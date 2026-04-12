import { and, asc, count, eq, ilike, isNull, ne, or } from 'drizzle-orm';

import { getDb } from '@/src/db/client';
import { userFollows, users } from '@/src/db/schema';
import { failure, success, type ServiceResult } from '@/src/domain/shared/result';
import { buildProfileImageUrl, deleteProfileImage, uploadProfileImage } from '@/src/profile/object-storage';
import { ImageValidationError, validateImageUpload } from '@/src/profile/image-validation';

const DISPLAY_NAME_MIN_LENGTH = 2;
const DISPLAY_NAME_MAX_LENGTH = 60;
const SEARCH_QUERY_MAX_LENGTH = 80;

export type ProfileError = {
  code: 'VALIDATION_ERROR' | 'NOT_FOUND' | 'FORBIDDEN' | 'CONFLICT';
  message: string;
};

export type ProfileViewPayload = {
  userId: string;
  displayName: string;
  imageUrl: string | null;
  followerCount: number;
  isOwnProfile: boolean;
  isFollowing: boolean;
};

export type UpdateDisplayNamePayload = {
  displayName: string;
};

export type UpdateProfileImagePayload = {
  imageKey: string;
  imageUrl: string;
};

export type ProfileDirectoryEntry = {
  userId: string;
  displayName: string;
  imageUrl: string | null;
};

export type ProfileSearchVisibilityPayload = {
  isSearchable: boolean;
};

type ProfileUserRecord = {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  isSearchable: boolean;
};

export type ProfileUseCaseDeps = {
  findUserById: (userId: string) => Promise<ProfileUserRecord | undefined>;
  countFollowers: (userId: string) => Promise<number>;
  hasFollowRelationship: (followerId: string, followingId: string) => Promise<boolean>;
  createFollowRelationship: (followerId: string, followingId: string) => Promise<void>;
  deleteFollowRelationship: (followerId: string, followingId: string) => Promise<void>;
  listFollowingUsers: (followerId: string) => Promise<ProfileUserRecord[]>;
  searchUsersToFollow: (viewerUserId: string, query: string) => Promise<ProfileUserRecord[]>;
  updateUserSearchVisibility: (userId: string, isSearchable: boolean) => Promise<void>;
};

function getProfileUseCaseDeps(): ProfileUseCaseDeps {
  return {
    findUserById: (userId) =>
      getDb().query.users.findFirst({
        where: (table, { eq: innerEq }) => innerEq(table.id, userId),
      }),
    countFollowers: async (userId) => {
      const [result] = await getDb()
        .select({ value: count() })
        .from(userFollows)
        .where(eq(userFollows.followingId, userId));

      return result?.value ?? 0;
    },
    hasFollowRelationship: async (followerId, followingId) => {
      const relationship = await getDb().query.userFollows.findFirst({
        where: (table, { and: innerAnd, eq: innerEq }) =>
          innerAnd(innerEq(table.followerId, followerId), innerEq(table.followingId, followingId)),
      });

      return Boolean(relationship);
    },
    createFollowRelationship: async (followerId, followingId) => {
      await getDb()
        .insert(userFollows)
        .values({
          followerId,
          followingId,
        })
        .onConflictDoNothing();
    },
    deleteFollowRelationship: async (followerId, followingId) => {
      await getDb()
        .delete(userFollows)
        .where(and(eq(userFollows.followerId, followerId), eq(userFollows.followingId, followingId)));
    },
    listFollowingUsers: async (followerId) => {
      const rows = await getDb()
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          image: users.image,
          isSearchable: users.isSearchable,
        })
        .from(userFollows)
        .innerJoin(users, eq(userFollows.followingId, users.id))
        .where(eq(userFollows.followerId, followerId))
        .orderBy(asc(users.name), asc(users.email));

      return rows;
    },
    searchUsersToFollow: async (viewerUserId, query) => {
      const rows = await getDb()
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          image: users.image,
          isSearchable: users.isSearchable,
        })
        .from(users)
        .leftJoin(
          userFollows,
          and(eq(userFollows.followingId, users.id), eq(userFollows.followerId, viewerUserId)),
        )
        .where(
          and(
            eq(users.isSearchable, true),
            ne(users.id, viewerUserId),
            isNull(userFollows.followingId),
            or(ilike(users.name, `%${query}%`), ilike(users.email, `%${query}%`)),
          ),
        )
        .orderBy(asc(users.name), asc(users.email))
        .limit(12);

      return rows;
    },
    updateUserSearchVisibility: async (userId, isSearchable) => {
      await getDb()
        .update(users)
        .set({ isSearchable, updatedAt: new Date() })
        .where(eq(users.id, userId));
    },
  };
}

function resolveProfileDisplayName(user: Pick<ProfileUserRecord, 'name' | 'email'>) {
  const trimmedName = user.name?.trim();

  if (trimmedName) {
    return trimmedName;
  }

  const emailPrefix = user.email?.split('@')[0]?.trim();
  return emailPrefix || 'User';
}

function toProfileDirectoryEntry(user: ProfileUserRecord): ProfileDirectoryEntry {
  return {
    userId: user.id,
    displayName: resolveProfileDisplayName(user),
    imageUrl: buildProfileImageUrl(user.image) ?? null,
  };
}

export async function getProfileViewUseCase(
  profileUserId: string,
  viewerUserId?: string | null,
  deps: ProfileUseCaseDeps = getProfileUseCaseDeps(),
): Promise<ServiceResult<ProfileViewPayload, ProfileError>> {
  const user = await deps.findUserById(profileUserId);

  if (!user) {
    return failure({
      code: 'NOT_FOUND',
      message: 'User account was not found.',
    });
  }

  const isOwnProfile = Boolean(viewerUserId && viewerUserId === profileUserId);
  const [followerCount, isFollowing] = await Promise.all([
    deps.countFollowers(profileUserId),
    viewerUserId && !isOwnProfile ? deps.hasFollowRelationship(viewerUserId, profileUserId) : Promise.resolve(false),
  ]);

  return success({
    userId: user.id,
    displayName: resolveProfileDisplayName(user),
    imageUrl: buildProfileImageUrl(user.image) ?? null,
    followerCount,
    isOwnProfile,
    isFollowing,
  });
}

async function updateFollowRelationship(
  actorUserId: string,
  targetUserId: string,
  shouldFollow: boolean,
  deps: ProfileUseCaseDeps = getProfileUseCaseDeps(),
): Promise<ServiceResult<{ following: boolean }, ProfileError>> {
  if (actorUserId === targetUserId) {
    return failure({
      code: 'VALIDATION_ERROR',
      message: 'You cannot follow your own profile.',
    });
  }

  const targetUser = await deps.findUserById(targetUserId);

  if (!targetUser) {
    return failure({
      code: 'NOT_FOUND',
      message: 'User account was not found.',
    });
  }

  if (shouldFollow) {
    await deps.createFollowRelationship(actorUserId, targetUserId);
    return success({ following: true });
  }

  await deps.deleteFollowRelationship(actorUserId, targetUserId);
  return success({ following: false });
}

export function followUserUseCase(
  actorUserId: string,
  targetUserId: string,
  deps?: ProfileUseCaseDeps,
) {
  return updateFollowRelationship(actorUserId, targetUserId, true, deps);
}

export function unfollowUserUseCase(
  actorUserId: string,
  targetUserId: string,
  deps?: ProfileUseCaseDeps,
) {
  return updateFollowRelationship(actorUserId, targetUserId, false, deps);
}

export async function listFollowingProfilesUseCase(
  userId: string,
  deps: ProfileUseCaseDeps = getProfileUseCaseDeps(),
): Promise<ServiceResult<{ profiles: ProfileDirectoryEntry[] }, ProfileError>> {
  const user = await deps.findUserById(userId);

  if (!user) {
    return failure({
      code: 'NOT_FOUND',
      message: 'User account was not found.',
    });
  }

  const profiles = await deps.listFollowingUsers(userId);

  return success({
    profiles: profiles.map(toProfileDirectoryEntry),
  });
}

export async function searchUsersToFollowUseCase(
  userId: string,
  rawQuery: string,
  deps: ProfileUseCaseDeps = getProfileUseCaseDeps(),
): Promise<ServiceResult<{ profiles: ProfileDirectoryEntry[] }, ProfileError>> {
  const user = await deps.findUserById(userId);

  if (!user) {
    return failure({
      code: 'NOT_FOUND',
      message: 'User account was not found.',
    });
  }

  const query = rawQuery.trim();

  if (!query) {
    return success({ profiles: [] });
  }

  if (query.length > SEARCH_QUERY_MAX_LENGTH) {
    return failure({
      code: 'VALIDATION_ERROR',
      message: `Search must be ${SEARCH_QUERY_MAX_LENGTH} characters or fewer.`,
    });
  }

  const profiles = await deps.searchUsersToFollow(userId, query);

  return success({
    profiles: profiles.map(toProfileDirectoryEntry),
  });
}

export async function getProfileSearchVisibilityUseCase(
  userId: string,
  deps: ProfileUseCaseDeps = getProfileUseCaseDeps(),
): Promise<ServiceResult<ProfileSearchVisibilityPayload, ProfileError>> {
  const user = await deps.findUserById(userId);

  if (!user) {
    return failure({
      code: 'NOT_FOUND',
      message: 'User account was not found.',
    });
  }

  return success({
    isSearchable: user.isSearchable,
  });
}

export async function updateProfileSearchVisibilityUseCase(
  userId: string,
  isSearchable: boolean,
  deps: ProfileUseCaseDeps = getProfileUseCaseDeps(),
): Promise<ServiceResult<ProfileSearchVisibilityPayload, ProfileError>> {
  const user = await deps.findUserById(userId);

  if (!user) {
    return failure({
      code: 'NOT_FOUND',
      message: 'User account was not found.',
    });
  }

  await deps.updateUserSearchVisibility(userId, isSearchable);

  return success({
    isSearchable,
  });
}

export async function updateDisplayNameUseCase(
  userId: string,
  rawDisplayName: string,
): Promise<ServiceResult<UpdateDisplayNamePayload, ProfileError>> {
  const displayName = rawDisplayName.trim();

  if (displayName.length < DISPLAY_NAME_MIN_LENGTH) {
    return failure({
      code: 'VALIDATION_ERROR',
      message: `Display name must be at least ${DISPLAY_NAME_MIN_LENGTH} characters.`,
    });
  }

  if (displayName.length > DISPLAY_NAME_MAX_LENGTH) {
    return failure({
      code: 'VALIDATION_ERROR',
      message: `Display name must be ${DISPLAY_NAME_MAX_LENGTH} characters or fewer.`,
    });
  }

  const existingUser = await getDb().query.users.findFirst({
    where: (table, { eq: innerEq }) => innerEq(table.id, userId),
  });

  if (!existingUser) {
    return failure({
      code: 'NOT_FOUND',
      message: 'User account was not found.',
    });
  }

  await getDb()
    .update(users)
    .set({ name: displayName, updatedAt: new Date() })
    .where(eq(users.id, userId));

  return success({
    displayName,
  });
}

export async function updateProfileImageUseCase(
  userId: string,
  file: File,
): Promise<ServiceResult<UpdateProfileImagePayload, ProfileError>> {
  const existingUser = await getDb().query.users.findFirst({
    where: (table, { eq: innerEq }) => innerEq(table.id, userId),
  });

  if (!existingUser) {
    return failure({
      code: 'NOT_FOUND',
      message: 'User account was not found.',
    });
  }

  try {
    const validated = await validateImageUpload(file);
    const uploaded = await uploadProfileImage(userId, validated);

    try {
      await getDb()
        .update(users)
        .set({ image: uploaded.key, updatedAt: new Date() })
        .where(eq(users.id, userId));
    } catch (error) {
      await deleteProfileImage(uploaded.key);
      throw error;
    }

    await deleteProfileImage(existingUser.image);

    return success({
      imageKey: uploaded.key,
      imageUrl: uploaded.url,
    });
  } catch (error) {
    if (error instanceof ImageValidationError) {
      return failure({
        code: 'VALIDATION_ERROR',
        message: error.message,
      });
    }

    throw error;
  }
}

export async function removeProfileImageUseCase(
  userId: string,
): Promise<ServiceResult<{ removed: true }, ProfileError>> {
  const existingUser = await getDb().query.users.findFirst({
    where: (table, { eq: innerEq }) => innerEq(table.id, userId),
  });

  if (!existingUser) {
    return failure({
      code: 'NOT_FOUND',
      message: 'User account was not found.',
    });
  }

  await getDb()
    .update(users)
    .set({ image: null, updatedAt: new Date() })
    .where(eq(users.id, userId));

  await deleteProfileImage(existingUser.image);

  return success({ removed: true });
}
