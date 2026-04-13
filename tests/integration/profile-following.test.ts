import { describe, expect, it, vi } from 'vitest';

import {
  followUserUseCase,
  getProfileViewByTagUseCase,
  getProfileViewUseCase,
  getProfileSearchVisibilityUseCase,
  listFollowingProfilesUseCase,
  searchUsersToFollowUseCase,
  unfollowUserUseCase,
  updateProfileSearchVisibilityUseCase,
  updateProfileTagUseCase,
  type ProfileUseCaseDeps,
} from '@/src/domain/profile/use-cases';

function createDeps(overrides: Partial<ProfileUseCaseDeps> = {}): ProfileUseCaseDeps {
  return {
    findUserById: vi.fn(),
    findUserByTag: vi.fn(),
    findUserByTagExcludingId: vi.fn(),
    countFollowers: vi.fn().mockResolvedValue(0),
    hasFollowRelationship: vi.fn().mockResolvedValue(false),
    createFollowRelationship: vi.fn().mockResolvedValue(undefined),
    deleteFollowRelationship: vi.fn().mockResolvedValue(undefined),
    listFollowingUsers: vi.fn().mockResolvedValue([]),
    searchUsersToFollow: vi.fn().mockResolvedValue([]),
    updateUserSearchVisibility: vi.fn().mockResolvedValue(undefined),
    updateUserTag: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('profile follow use cases', () => {
  it('loads a profile view with follower count and follow state', async () => {
    const deps = createDeps({
      findUserById: vi.fn().mockResolvedValue({
        id: 'user_2',
        email: 'person@example.com',
        tag: 'person',
        name: 'Person',
        image: 'local-profile-images/user_2/avatar.jpg',
        isSearchable: true,
      }),
      countFollowers: vi.fn().mockResolvedValue(14),
      hasFollowRelationship: vi.fn().mockResolvedValue(true),
    });

    const result = await getProfileViewUseCase('user_2', 'user_1', deps);

    expect(result).toEqual({
      ok: true,
      data: {
        userId: 'user_2',
        tag: 'person',
        displayName: 'Person',
        imageUrl: '/local-profile-images/user_2/avatar.jpg',
        followerCount: 14,
        isOwnProfile: false,
        isFollowing: true,
      },
    });
  });

  it('does not query follow state for your own profile', async () => {
    const deps = createDeps({
      findUserById: vi.fn().mockResolvedValue({
        id: 'user_1',
        email: 'person@example.com',
        tag: 'person',
        name: null,
        image: null,
        isSearchable: true,
      }),
      countFollowers: vi.fn().mockResolvedValue(3),
    });

    const result = await getProfileViewUseCase('user_1', 'user_1', deps);

    expect(result).toEqual({
      ok: true,
      data: {
        userId: 'user_1',
        tag: 'person',
        displayName: 'person',
        imageUrl: null,
        followerCount: 3,
        isOwnProfile: true,
        isFollowing: false,
      },
    });
    expect(deps.hasFollowRelationship).not.toHaveBeenCalled();
  });

  it('creates and removes follow relationships idempotently', async () => {
    const deps = createDeps({
      findUserById: vi.fn().mockResolvedValue({
        id: 'user_2',
        email: 'person@example.com',
        tag: 'person',
        name: 'Person',
        image: null,
        isSearchable: true,
      }),
    });

    await expect(followUserUseCase('user_1', 'user_2', deps)).resolves.toEqual({
      ok: true,
      data: {
        following: true,
      },
    });
    expect(deps.createFollowRelationship).toHaveBeenCalledWith('user_1', 'user_2');

    await expect(unfollowUserUseCase('user_1', 'user_2', deps)).resolves.toEqual({
      ok: true,
      data: {
        following: false,
      },
    });
    expect(deps.deleteFollowRelationship).toHaveBeenCalledWith('user_1', 'user_2');
  });

  it('rejects attempts to follow yourself', async () => {
    const deps = createDeps();

    await expect(followUserUseCase('user_1', 'user_1', deps)).resolves.toEqual({
      ok: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'You cannot follow your own profile.',
      },
    });

    expect(deps.findUserById).not.toHaveBeenCalled();
    expect(deps.createFollowRelationship).not.toHaveBeenCalled();
  });

  it('lists the profiles a user already follows', async () => {
    const deps = createDeps({
      findUserById: vi.fn().mockResolvedValue({
        id: 'user_1',
        email: 'viewer@example.com',
        tag: 'viewer',
        name: 'Viewer',
        image: null,
        isSearchable: true,
      }),
      listFollowingUsers: vi.fn().mockResolvedValue([
        {
          id: 'user_2',
          email: 'alpha@example.com',
          tag: 'alpha',
          name: 'Alpha',
          image: null,
          isSearchable: true,
        },
        {
          id: 'user_3',
          email: 'bravo@example.com',
          tag: 'bravo',
          name: null,
          image: 'local-profile-images/user_3/avatar.jpg',
          isSearchable: false,
        },
      ]),
    });

    const result = await listFollowingProfilesUseCase('user_1', deps);

    expect(result).toEqual({
      ok: true,
      data: {
        profiles: [
          {
            userId: 'user_2',
            tag: 'alpha',
            displayName: 'Alpha',
            imageUrl: null,
          },
          {
            userId: 'user_3',
            tag: 'bravo',
            displayName: 'bravo',
            imageUrl: '/local-profile-images/user_3/avatar.jpg',
          },
        ],
      },
    });
  });

  it('searches discoverable users to follow', async () => {
    const deps = createDeps({
      findUserById: vi.fn().mockResolvedValue({
        id: 'user_1',
        email: 'viewer@example.com',
        tag: 'viewer',
        name: 'Viewer',
        image: null,
        isSearchable: true,
      }),
      searchUsersToFollow: vi.fn().mockResolvedValue([
        {
          id: 'user_4',
          email: 'casey@example.com',
          tag: 'casey',
          name: 'Casey',
          image: null,
          isSearchable: true,
        },
      ]),
    });

    const result = await searchUsersToFollowUseCase('user_1', 'case', deps);

    expect(result).toEqual({
      ok: true,
      data: {
        profiles: [
          {
            userId: 'user_4',
            tag: 'casey',
            displayName: 'Casey',
            imageUrl: null,
          },
        ],
      },
    });
    expect(deps.searchUsersToFollow).toHaveBeenCalledWith('user_1', 'case');
  });

  it('reads and updates whether a profile can be searched', async () => {
    const deps = createDeps({
      findUserById: vi.fn().mockResolvedValue({
        id: 'user_1',
        email: 'viewer@example.com',
        tag: 'viewer',
        name: 'Viewer',
        image: null,
        isSearchable: false,
      }),
    });

    await expect(getProfileSearchVisibilityUseCase('user_1', deps)).resolves.toEqual({
      ok: true,
      data: {
        isSearchable: false,
      },
    });

    await expect(updateProfileSearchVisibilityUseCase('user_1', true, deps)).resolves.toEqual({
      ok: true,
      data: {
        isSearchable: true,
      },
    });
    expect(deps.updateUserSearchVisibility).toHaveBeenCalledWith('user_1', true);
  });

  it('loads a public profile by tag', async () => {
    const deps = createDeps({
      findUserByTag: vi.fn().mockResolvedValue({
        id: 'user_2',
        email: 'person@example.com',
        tag: 'person',
        name: 'Person',
        image: null,
        isSearchable: true,
      }),
      countFollowers: vi.fn().mockResolvedValue(2),
    });

    await expect(getProfileViewByTagUseCase('person', null, deps)).resolves.toEqual({
      ok: true,
      data: {
        userId: 'user_2',
        tag: 'person',
        displayName: 'Person',
        imageUrl: null,
        followerCount: 2,
        isOwnProfile: false,
        isFollowing: false,
      },
    });
  });

  it('updates a profile tag when it is available', async () => {
    const deps = createDeps({
      findUserById: vi.fn().mockResolvedValue({
        id: 'user_1',
        email: 'viewer@example.com',
        tag: 'viewer',
        name: 'Viewer',
        image: null,
        isSearchable: true,
      }),
      findUserByTagExcludingId: vi.fn().mockResolvedValue(undefined),
    });

    await expect(updateProfileTagUseCase('user_1', '@new-handle', deps)).resolves.toEqual({
      ok: true,
      data: {
        tag: 'new-handle',
      },
    });
    expect(deps.updateUserTag).toHaveBeenCalledWith('user_1', 'new-handle');
  });

  it('rejects profile tags that are already taken', async () => {
    const deps = createDeps({
      findUserById: vi.fn().mockResolvedValue({
        id: 'user_1',
        email: 'viewer@example.com',
        tag: 'viewer',
        name: 'Viewer',
        image: null,
        isSearchable: true,
      }),
      findUserByTagExcludingId: vi.fn().mockResolvedValue({
        id: 'user_2',
        email: 'person@example.com',
        tag: 'new-handle',
        name: 'Person',
        image: null,
        isSearchable: true,
      }),
    });

    await expect(updateProfileTagUseCase('user_1', 'new-handle', deps)).resolves.toEqual({
      ok: false,
      error: {
        code: 'CONFLICT',
        message: 'That tag is already taken.',
      },
    });
  });
});
