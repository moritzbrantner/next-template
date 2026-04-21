import { and, asc, count, eq, ilike, isNull, ne, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { getDb } from '@/src/db/client';
import { groupInvitations, groupMemberships, groups, users } from '@/src/db/schema';
import { failure, success, type ServiceResult } from '@/src/domain/shared/result';
import { buildProfileImageUrl } from '@/src/profile/object-storage';

const GROUP_NAME_MIN_LENGTH = 2;
const GROUP_NAME_MAX_LENGTH = 80;
const GROUP_DESCRIPTION_MAX_LENGTH = 500;
const SEARCH_QUERY_MAX_LENGTH = 80;

export type GroupMemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';
export type GroupInvitationStatus = 'pending' | 'accepted' | 'declined' | 'revoked';

export type GroupError = {
  code: 'VALIDATION_ERROR' | 'NOT_FOUND' | 'FORBIDDEN' | 'CONFLICT';
  message: string;
};

export type GroupUserSummary = {
  userId: string;
  tag: string;
  displayName: string;
  imageUrl: string | null;
};

export type GroupSummary = {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  role: GroupMemberRole;
  memberCount: number;
  pendingInvitationCount: number;
};

export type GroupInvitationSummary = {
  id: string;
  groupId: string;
  groupName: string;
  invitedBy: GroupUserSummary;
  createdAt: string;
};

export type GroupMemberSummary = GroupUserSummary & {
  role: GroupMemberRole;
  joinedAt: string;
};

export type GroupPendingInvitation = {
  id: string;
  invitedUser: GroupUserSummary;
  invitedBy: GroupUserSummary;
  createdAt: string;
};

export type GroupsPageData = {
  groups: GroupSummary[];
  invitations: GroupInvitationSummary[];
};

export type GroupDetail = GroupSummary & {
  members: GroupMemberSummary[];
  pendingInvitations: GroupPendingInvitation[];
  canInvite: boolean;
  canManageMembers: boolean;
};

type UserRecord = {
  id: string;
  email: string | null;
  tag: string;
  name: string | null;
  image: string | null;
};

type GroupRecord = {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
};

type MembershipRecord = {
  groupId: string;
  userId: string;
  role: GroupMemberRole;
  createdAt: Date;
  updatedAt: Date;
};

type InvitationRecord = {
  id: string;
  groupId: string;
  invitedUserId: string;
  invitedByUserId: string;
  status: GroupInvitationStatus;
  createdAt: Date;
  respondedAt: Date | null;
};

type GroupMembershipRow = GroupRecord & {
  role: GroupMemberRole;
  memberCount: number;
  pendingInvitationCount: number;
};

type PendingInvitationForUserRow = InvitationRecord & {
  group: GroupRecord;
  inviter: UserRecord;
};

type MemberRow = MembershipRecord & {
  user: UserRecord;
};

type PendingInvitationRow = InvitationRecord & {
  invitedUser: UserRecord;
  invitedBy: UserRecord;
};

export type GroupUseCaseDeps = {
  findUserById: (userId: string) => Promise<UserRecord | undefined>;
  createGroupWithOwner: (input: {
    id: string;
    name: string;
    description: string | null;
    ownerId: string;
  }) => Promise<GroupRecord>;
  listGroupsForUser: (userId: string) => Promise<GroupMembershipRow[]>;
  listPendingInvitationsForUser: (userId: string) => Promise<PendingInvitationForUserRow[]>;
  findGroupById: (groupId: string) => Promise<GroupRecord | undefined>;
  findMembership: (groupId: string, userId: string) => Promise<MembershipRecord | undefined>;
  listMembers: (groupId: string) => Promise<MemberRow[]>;
  listPendingInvitations: (groupId: string) => Promise<PendingInvitationRow[]>;
  findPendingInvitation: (groupId: string, invitedUserId: string) => Promise<InvitationRecord | undefined>;
  findInvitationById: (invitationId: string) => Promise<PendingInvitationForUserRow | undefined>;
  createInvitation: (input: {
    id: string;
    groupId: string;
    invitedUserId: string;
    invitedByUserId: string;
  }) => Promise<InvitationRecord>;
  updateInvitationStatus: (invitationId: string, status: Exclude<GroupInvitationStatus, 'pending'>) => Promise<void>;
  addMember: (groupId: string, userId: string, role: GroupMemberRole) => Promise<void>;
  updateMemberRole: (groupId: string, userId: string, role: Exclude<GroupMemberRole, 'OWNER'>) => Promise<void>;
  removeMember: (groupId: string, userId: string) => Promise<void>;
  searchInviteCandidates: (groupId: string, actorUserId: string, query: string) => Promise<UserRecord[]>;
};

function getGroupUseCaseDeps(): GroupUseCaseDeps {
  return {
    findUserById: (userId) =>
      getDb().query.users.findFirst({
        where: (table, { eq: innerEq }) => innerEq(table.id, userId),
      }),
    createGroupWithOwner: async ({ id, name, description, ownerId }) => {
      return getDb().transaction(async (tx) => {
        const [createdGroup] = await tx
          .insert(groups)
          .values({
            id,
            name,
            description,
            ownerId,
          })
          .returning();

        if (!createdGroup) {
          throw new Error('Expected group to be created.');
        }

        await tx.insert(groupMemberships).values({
          groupId: createdGroup.id,
          userId: ownerId,
          role: 'OWNER',
        });

        return createdGroup;
      });
    },
    listGroupsForUser: async (userId) => {
      const membershipRows = await getDb()
        .select({
          id: groups.id,
          name: groups.name,
          description: groups.description,
          ownerId: groups.ownerId,
          createdAt: groups.createdAt,
          updatedAt: groups.updatedAt,
          role: groupMemberships.role,
        })
        .from(groupMemberships)
        .innerJoin(groups, eq(groupMemberships.groupId, groups.id))
        .where(eq(groupMemberships.userId, userId))
        .orderBy(asc(groups.name), asc(groups.createdAt));

      return Promise.all(
        membershipRows.map(async (group) => {
          const [memberCountResult, pendingInvitationCountResult] = await Promise.all([
            getDb()
              .select({ value: count() })
              .from(groupMemberships)
              .where(eq(groupMemberships.groupId, group.id)),
            getDb()
              .select({ value: count() })
              .from(groupInvitations)
              .where(and(eq(groupInvitations.groupId, group.id), eq(groupInvitations.status, 'pending'))),
          ]);

          return {
            ...group,
            memberCount: memberCountResult[0]?.value ?? 0,
            pendingInvitationCount: pendingInvitationCountResult[0]?.value ?? 0,
          };
        }),
      );
    },
    listPendingInvitationsForUser: async (userId) => {
      const inviter = alias(users, 'groupInvitationInviter');
      const rows = await getDb()
        .select({
          id: groupInvitations.id,
          groupId: groupInvitations.groupId,
          invitedUserId: groupInvitations.invitedUserId,
          invitedByUserId: groupInvitations.invitedByUserId,
          status: groupInvitations.status,
          createdAt: groupInvitations.createdAt,
          respondedAt: groupInvitations.respondedAt,
          group: {
            id: groups.id,
            name: groups.name,
            description: groups.description,
            ownerId: groups.ownerId,
            createdAt: groups.createdAt,
            updatedAt: groups.updatedAt,
          },
          inviter: {
            id: inviter.id,
            email: inviter.email,
            tag: inviter.tag,
            name: inviter.name,
            image: inviter.image,
          },
        })
        .from(groupInvitations)
        .innerJoin(groups, eq(groupInvitations.groupId, groups.id))
        .innerJoin(inviter, eq(groupInvitations.invitedByUserId, inviter.id))
        .where(and(eq(groupInvitations.invitedUserId, userId), eq(groupInvitations.status, 'pending')))
        .orderBy(asc(groupInvitations.createdAt));

      return rows;
    },
    findGroupById: (groupId) =>
      getDb().query.groups.findFirst({
        where: (table, { eq: innerEq }) => innerEq(table.id, groupId),
      }),
    findMembership: (groupId, userId) =>
      getDb().query.groupMemberships.findFirst({
        where: (table, { and: innerAnd, eq: innerEq }) =>
          innerAnd(innerEq(table.groupId, groupId), innerEq(table.userId, userId)),
      }),
    listMembers: async (groupId) => {
      const rows = await getDb()
        .select({
          groupId: groupMemberships.groupId,
          userId: groupMemberships.userId,
          role: groupMemberships.role,
          createdAt: groupMemberships.createdAt,
          updatedAt: groupMemberships.updatedAt,
          user: {
            id: users.id,
            email: users.email,
            tag: users.tag,
            name: users.name,
            image: users.image,
          },
        })
        .from(groupMemberships)
        .innerJoin(users, eq(groupMemberships.userId, users.id))
        .where(eq(groupMemberships.groupId, groupId))
        .orderBy(
          sql`case ${groupMemberships.role} when 'OWNER' then 0 when 'ADMIN' then 1 else 2 end`,
          asc(users.name),
          asc(users.tag),
        );

      return rows;
    },
    listPendingInvitations: async (groupId) => {
      const invited = alias(users, 'groupInvitationInvitee');
      const inviter = alias(users, 'groupInvitationDetailInviter');
      const rows = await getDb()
        .select({
          id: groupInvitations.id,
          groupId: groupInvitations.groupId,
          invitedUserId: groupInvitations.invitedUserId,
          invitedByUserId: groupInvitations.invitedByUserId,
          status: groupInvitations.status,
          createdAt: groupInvitations.createdAt,
          respondedAt: groupInvitations.respondedAt,
          invitedUser: {
            id: invited.id,
            email: invited.email,
            tag: invited.tag,
            name: invited.name,
            image: invited.image,
          },
          invitedBy: {
            id: inviter.id,
            email: inviter.email,
            tag: inviter.tag,
            name: inviter.name,
            image: inviter.image,
          },
        })
        .from(groupInvitations)
        .innerJoin(invited, eq(groupInvitations.invitedUserId, invited.id))
        .innerJoin(inviter, eq(groupInvitations.invitedByUserId, inviter.id))
        .where(and(eq(groupInvitations.groupId, groupId), eq(groupInvitations.status, 'pending')))
        .orderBy(asc(groupInvitations.createdAt));

      return rows;
    },
    findPendingInvitation: (groupId, invitedUserId) =>
      getDb().query.groupInvitations.findFirst({
        where: (table, { and: innerAnd, eq: innerEq }) =>
          innerAnd(
            innerEq(table.groupId, groupId),
            innerEq(table.invitedUserId, invitedUserId),
            innerEq(table.status, 'pending'),
          ),
      }),
    findInvitationById: async (invitationId) => {
      const inviter = alias(users, 'groupInvitationByIdInviter');
      const rows = await getDb()
        .select({
          id: groupInvitations.id,
          groupId: groupInvitations.groupId,
          invitedUserId: groupInvitations.invitedUserId,
          invitedByUserId: groupInvitations.invitedByUserId,
          status: groupInvitations.status,
          createdAt: groupInvitations.createdAt,
          respondedAt: groupInvitations.respondedAt,
          group: {
            id: groups.id,
            name: groups.name,
            description: groups.description,
            ownerId: groups.ownerId,
            createdAt: groups.createdAt,
            updatedAt: groups.updatedAt,
          },
          inviter: {
            id: inviter.id,
            email: inviter.email,
            tag: inviter.tag,
            name: inviter.name,
            image: inviter.image,
          },
        })
        .from(groupInvitations)
        .innerJoin(groups, eq(groupInvitations.groupId, groups.id))
        .innerJoin(inviter, eq(groupInvitations.invitedByUserId, inviter.id))
        .where(eq(groupInvitations.id, invitationId))
        .limit(1);

      return rows[0];
    },
    createInvitation: async ({ id, groupId, invitedUserId, invitedByUserId }) => {
      const [createdInvitation] = await getDb()
        .insert(groupInvitations)
        .values({
          id,
          groupId,
          invitedUserId,
          invitedByUserId,
        })
        .returning();

      if (!createdInvitation) {
        throw new Error('Expected group invitation to be created.');
      }

      return createdInvitation;
    },
    updateInvitationStatus: async (invitationId, status) => {
      await getDb()
        .update(groupInvitations)
        .set({
          status,
          respondedAt: new Date(),
        })
        .where(eq(groupInvitations.id, invitationId));
    },
    addMember: async (groupId, userId, role) => {
      await getDb()
        .insert(groupMemberships)
        .values({
          groupId,
          userId,
          role,
        })
        .onConflictDoNothing();
    },
    updateMemberRole: async (groupId, userId, role) => {
      await getDb()
        .update(groupMemberships)
        .set({
          role,
          updatedAt: new Date(),
        })
        .where(and(eq(groupMemberships.groupId, groupId), eq(groupMemberships.userId, userId)));
    },
    removeMember: async (groupId, userId) => {
      await getDb()
        .delete(groupMemberships)
        .where(and(eq(groupMemberships.groupId, groupId), eq(groupMemberships.userId, userId)));
    },
    searchInviteCandidates: async (groupId, actorUserId, query) => {
      const pendingInvitations = alias(groupInvitations, 'pendingGroupInvitations');
      const rows = await getDb()
        .select({
          id: users.id,
          email: users.email,
          tag: users.tag,
          name: users.name,
          image: users.image,
        })
        .from(users)
        .leftJoin(
          groupMemberships,
          and(eq(groupMemberships.groupId, groupId), eq(groupMemberships.userId, users.id)),
        )
        .leftJoin(
          pendingInvitations,
          and(
            eq(pendingInvitations.groupId, groupId),
            eq(pendingInvitations.invitedUserId, users.id),
            eq(pendingInvitations.status, 'pending'),
          ),
        )
        .where(
          and(
            eq(users.isSearchable, true),
            ne(users.id, actorUserId),
            isNull(groupMemberships.userId),
            isNull(pendingInvitations.id),
            or(ilike(users.name, `%${query}%`), ilike(users.email, `%${query}%`), ilike(users.tag, `%${query}%`)),
          ),
        )
        .orderBy(asc(users.name), asc(users.tag), asc(users.email))
        .limit(12);

      return rows;
    },
  };
}

function normalizeGroupName(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function normalizeGroupDescription(value: string | null | undefined) {
  const description = value?.trim().replace(/\s+/g, ' ') ?? '';
  return description || null;
}

function resolveDisplayName(user: Pick<UserRecord, 'name' | 'email'>) {
  const trimmedName = user.name?.trim();

  if (trimmedName) {
    return trimmedName;
  }

  const emailPrefix = user.email?.split('@')[0]?.trim();
  return emailPrefix || 'User';
}

function toUserSummary(user: UserRecord): GroupUserSummary {
  return {
    userId: user.id,
    tag: user.tag,
    displayName: resolveDisplayName(user),
    imageUrl: buildProfileImageUrl(user.image) ?? null,
  };
}

function toGroupSummary(row: GroupMembershipRow): GroupSummary {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    ownerId: row.ownerId,
    role: row.role,
    memberCount: Number(row.memberCount),
    pendingInvitationCount: Number(row.pendingInvitationCount),
  };
}

function toInvitationSummary(row: PendingInvitationForUserRow): GroupInvitationSummary {
  return {
    id: row.id,
    groupId: row.groupId,
    groupName: row.group.name,
    invitedBy: toUserSummary(row.inviter),
    createdAt: row.createdAt.toISOString(),
  };
}

function toMemberSummary(row: MemberRow): GroupMemberSummary {
  return {
    ...toUserSummary(row.user),
    role: row.role,
    joinedAt: row.createdAt.toISOString(),
  };
}

function toPendingInvitation(row: PendingInvitationRow): GroupPendingInvitation {
  return {
    id: row.id,
    invitedUser: toUserSummary(row.invitedUser),
    invitedBy: toUserSummary(row.invitedBy),
    createdAt: row.createdAt.toISOString(),
  };
}

function isGroupAdmin(role: GroupMemberRole | null | undefined) {
  return role === 'OWNER' || role === 'ADMIN';
}

function validateGroupInput(name: string, description: string | null): GroupError | null {
  if (name.length < GROUP_NAME_MIN_LENGTH) {
    return {
      code: 'VALIDATION_ERROR',
      message: `Group names must be at least ${GROUP_NAME_MIN_LENGTH} characters.`,
    };
  }

  if (name.length > GROUP_NAME_MAX_LENGTH) {
    return {
      code: 'VALIDATION_ERROR',
      message: `Group names must be ${GROUP_NAME_MAX_LENGTH} characters or fewer.`,
    };
  }

  if ((description?.length ?? 0) > GROUP_DESCRIPTION_MAX_LENGTH) {
    return {
      code: 'VALIDATION_ERROR',
      message: `Group descriptions must be ${GROUP_DESCRIPTION_MAX_LENGTH} characters or fewer.`,
    };
  }

  return null;
}

async function buildGroupSummary(
  group: GroupRecord,
  role: GroupMemberRole,
  deps: GroupUseCaseDeps,
): Promise<GroupSummary> {
  const [members, invitations] = await Promise.all([
    deps.listMembers(group.id),
    deps.listPendingInvitations(group.id),
  ]);

  return {
    id: group.id,
    name: group.name,
    description: group.description,
    ownerId: group.ownerId,
    role,
    memberCount: members.length,
    pendingInvitationCount: invitations.length,
  };
}

export async function getGroupsPageDataUseCase(
  userId: string,
  deps: GroupUseCaseDeps = getGroupUseCaseDeps(),
): Promise<ServiceResult<GroupsPageData, GroupError>> {
  const user = await deps.findUserById(userId);

  if (!user) {
    return failure({
      code: 'NOT_FOUND',
      message: 'User account was not found.',
    });
  }

  const [groupRows, invitationRows] = await Promise.all([
    deps.listGroupsForUser(userId),
    deps.listPendingInvitationsForUser(userId),
  ]);

  return success({
    groups: groupRows.map(toGroupSummary),
    invitations: invitationRows.map(toInvitationSummary),
  });
}

export async function createGroupUseCase(
  actorUserId: string,
  input: { name: string; description?: string | null },
  deps: GroupUseCaseDeps = getGroupUseCaseDeps(),
): Promise<ServiceResult<GroupSummary, GroupError>> {
  const actor = await deps.findUserById(actorUserId);

  if (!actor) {
    return failure({
      code: 'NOT_FOUND',
      message: 'User account was not found.',
    });
  }

  const name = normalizeGroupName(input.name);
  const description = normalizeGroupDescription(input.description);
  const validationError = validateGroupInput(name, description);

  if (validationError) {
    return failure(validationError);
  }

  const group = await deps.createGroupWithOwner({
    id: crypto.randomUUID(),
    name,
    description,
    ownerId: actorUserId,
  });

  return success(await buildGroupSummary(group, 'OWNER', deps));
}

export async function getGroupDetailUseCase(
  actorUserId: string,
  groupId: string,
  deps: GroupUseCaseDeps = getGroupUseCaseDeps(),
): Promise<ServiceResult<GroupDetail, GroupError>> {
  const [group, membership] = await Promise.all([
    deps.findGroupById(groupId),
    deps.findMembership(groupId, actorUserId),
  ]);

  if (!group) {
    return failure({
      code: 'NOT_FOUND',
      message: 'Group was not found.',
    });
  }

  if (!membership) {
    return failure({
      code: 'FORBIDDEN',
      message: 'You are not a member of this group.',
    });
  }

  const [memberRows, invitationRows] = await Promise.all([
    deps.listMembers(groupId),
    deps.listPendingInvitations(groupId),
  ]);

  return success({
    id: group.id,
    name: group.name,
    description: group.description,
    ownerId: group.ownerId,
    role: membership.role,
    memberCount: memberRows.length,
    pendingInvitationCount: invitationRows.length,
    members: memberRows.map(toMemberSummary),
    pendingInvitations: invitationRows.map(toPendingInvitation),
    canInvite: isGroupAdmin(membership.role),
    canManageMembers: membership.role === 'OWNER' || membership.role === 'ADMIN',
  });
}

export async function searchGroupInviteCandidatesUseCase(
  actorUserId: string,
  groupId: string,
  rawQuery: string,
  deps: GroupUseCaseDeps = getGroupUseCaseDeps(),
): Promise<ServiceResult<{ users: GroupUserSummary[] }, GroupError>> {
  const membership = await deps.findMembership(groupId, actorUserId);

  if (!membership || !isGroupAdmin(membership.role)) {
    return failure({
      code: 'FORBIDDEN',
      message: 'Only group admins can invite members.',
    });
  }

  const query = rawQuery.trim();

  if (!query) {
    return success({ users: [] });
  }

  if (query.length > SEARCH_QUERY_MAX_LENGTH) {
    return failure({
      code: 'VALIDATION_ERROR',
      message: `Search must be ${SEARCH_QUERY_MAX_LENGTH} characters or fewer.`,
    });
  }

  const candidates = await deps.searchInviteCandidates(groupId, actorUserId, query);

  return success({
    users: candidates.map(toUserSummary),
  });
}

export async function inviteUserToGroupUseCase(
  actorUserId: string,
  groupId: string,
  invitedUserId: string,
  deps: GroupUseCaseDeps = getGroupUseCaseDeps(),
): Promise<ServiceResult<{ invitation: GroupPendingInvitation }, GroupError>> {
  const [group, actorMembership, invitedUser] = await Promise.all([
    deps.findGroupById(groupId),
    deps.findMembership(groupId, actorUserId),
    deps.findUserById(invitedUserId),
  ]);

  if (!group) {
    return failure({
      code: 'NOT_FOUND',
      message: 'Group was not found.',
    });
  }

  if (!actorMembership || !isGroupAdmin(actorMembership.role)) {
    return failure({
      code: 'FORBIDDEN',
      message: 'Only group admins can invite members.',
    });
  }

  if (!invitedUser) {
    return failure({
      code: 'NOT_FOUND',
      message: 'User account was not found.',
    });
  }

  const [existingMembership, existingInvitation, inviter] = await Promise.all([
    deps.findMembership(groupId, invitedUserId),
    deps.findPendingInvitation(groupId, invitedUserId),
    deps.findUserById(actorUserId),
  ]);

  if (existingMembership) {
    return failure({
      code: 'CONFLICT',
      message: 'That user is already a group member.',
    });
  }

  if (existingInvitation) {
    return failure({
      code: 'CONFLICT',
      message: 'That user already has a pending invitation.',
    });
  }

  if (!inviter) {
    return failure({
      code: 'NOT_FOUND',
      message: 'User account was not found.',
    });
  }

  const invitation = await deps.createInvitation({
    id: crypto.randomUUID(),
    groupId,
    invitedUserId,
    invitedByUserId: actorUserId,
  });

  return success({
    invitation: toPendingInvitation({
      ...invitation,
      invitedUser,
      invitedBy: inviter,
    }),
  });
}

export async function respondToGroupInvitationUseCase(
  actorUserId: string,
  invitationId: string,
  decision: 'accept' | 'decline',
  deps: GroupUseCaseDeps = getGroupUseCaseDeps(),
): Promise<ServiceResult<{ status: 'accepted' | 'declined'; group: GroupSummary | null }, GroupError>> {
  const invitation = await deps.findInvitationById(invitationId);

  if (!invitation) {
    return failure({
      code: 'NOT_FOUND',
      message: 'Invitation was not found.',
    });
  }

  if (invitation.invitedUserId !== actorUserId) {
    return failure({
      code: 'FORBIDDEN',
      message: 'This invitation belongs to another user.',
    });
  }

  if (invitation.status !== 'pending') {
    return failure({
      code: 'CONFLICT',
      message: 'This invitation has already been answered.',
    });
  }

  if (decision === 'decline') {
    await deps.updateInvitationStatus(invitationId, 'declined');
    return success({ status: 'declined', group: null });
  }

  await deps.addMember(invitation.groupId, actorUserId, 'MEMBER');
  await deps.updateInvitationStatus(invitationId, 'accepted');

  return success({
    status: 'accepted',
    group: await buildGroupSummary(invitation.group, 'MEMBER', deps),
  });
}

export async function updateGroupMemberRoleUseCase(
  actorUserId: string,
  groupId: string,
  targetUserId: string,
  role: Exclude<GroupMemberRole, 'OWNER'>,
  deps: GroupUseCaseDeps = getGroupUseCaseDeps(),
): Promise<ServiceResult<{ userId: string; role: Exclude<GroupMemberRole, 'OWNER'> }, GroupError>> {
  const [actorMembership, targetMembership] = await Promise.all([
    deps.findMembership(groupId, actorUserId),
    deps.findMembership(groupId, targetUserId),
  ]);

  if (!actorMembership || actorMembership.role !== 'OWNER') {
    return failure({
      code: 'FORBIDDEN',
      message: 'Only the group owner can change member roles.',
    });
  }

  if (!targetMembership) {
    return failure({
      code: 'NOT_FOUND',
      message: 'Group member was not found.',
    });
  }

  if (targetMembership.role === 'OWNER') {
    return failure({
      code: 'VALIDATION_ERROR',
      message: 'The group owner role cannot be changed here.',
    });
  }

  await deps.updateMemberRole(groupId, targetUserId, role);

  return success({
    userId: targetUserId,
    role,
  });
}

export async function removeGroupMemberUseCase(
  actorUserId: string,
  groupId: string,
  targetUserId: string,
  deps: GroupUseCaseDeps = getGroupUseCaseDeps(),
): Promise<ServiceResult<{ removed: boolean; userId: string }, GroupError>> {
  const [actorMembership, targetMembership] = await Promise.all([
    deps.findMembership(groupId, actorUserId),
    deps.findMembership(groupId, targetUserId),
  ]);

  if (!actorMembership) {
    return failure({
      code: 'FORBIDDEN',
      message: 'You are not a member of this group.',
    });
  }

  if (!targetMembership) {
    return failure({
      code: 'NOT_FOUND',
      message: 'Group member was not found.',
    });
  }

  if (targetMembership.role === 'OWNER') {
    return failure({
      code: 'VALIDATION_ERROR',
      message: 'The group owner cannot be removed.',
    });
  }

  const removingSelf = actorUserId === targetUserId;

  if (!removingSelf) {
    if (actorMembership.role === 'MEMBER') {
      return failure({
        code: 'FORBIDDEN',
        message: 'Only group admins can remove members.',
      });
    }

    if (actorMembership.role === 'ADMIN' && targetMembership.role !== 'MEMBER') {
      return failure({
        code: 'FORBIDDEN',
        message: 'Admins can only remove regular members.',
      });
    }
  }

  await deps.removeMember(groupId, targetUserId);

  return success({
    removed: true,
    userId: targetUserId,
  });
}
