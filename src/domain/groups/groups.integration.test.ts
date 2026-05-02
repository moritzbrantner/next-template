import { describe, expect, it, vi } from 'vitest';

import {
  createGroupUseCase,
  inviteUserToGroupUseCase,
  removeGroupMemberUseCase,
  respondToGroupInvitationUseCase,
  updateGroupMemberRoleUseCase,
  type GroupUseCaseDeps,
} from '@/src/domain/groups/use-cases';

const createdAt = new Date('2026-01-01T00:00:00.000Z');

function user(id: string, name: string) {
  return {
    id,
    email: `${id}@example.com`,
    tag: id,
    name,
    image: null,
  };
}

function membership(
  groupId: string,
  userId: string,
  role: 'OWNER' | 'ADMIN' | 'MEMBER',
) {
  return {
    groupId,
    userId,
    role,
    createdAt,
    updatedAt: createdAt,
  };
}

function group(id = 'group_1') {
  return {
    id,
    name: 'Product team',
    description: 'Launch planning',
    ownerId: 'user_owner',
    createdAt,
    updatedAt: createdAt,
  };
}

function createDeps(
  overrides: Partial<GroupUseCaseDeps> = {},
): GroupUseCaseDeps {
  return {
    findUserById: vi.fn().mockImplementation(async (userId: string) => {
      const users = new Map([
        ['user_owner', user('user_owner', 'Owner')],
        ['user_admin', user('user_admin', 'Admin')],
        ['user_member', user('user_member', 'Member')],
        ['user_invited', user('user_invited', 'Invited')],
      ]);
      return users.get(userId);
    }),
    createGroupWithOwner: vi.fn().mockResolvedValue(group()),
    listGroupsForUser: vi.fn().mockResolvedValue([]),
    listPendingInvitationsForUser: vi.fn().mockResolvedValue([]),
    findGroupById: vi.fn().mockResolvedValue(group()),
    findMembership: vi.fn().mockResolvedValue(undefined),
    listMembers: vi.fn().mockResolvedValue([
      {
        ...membership('group_1', 'user_owner', 'OWNER'),
        user: user('user_owner', 'Owner'),
      },
    ]),
    listPendingInvitations: vi.fn().mockResolvedValue([]),
    findPendingInvitation: vi.fn().mockResolvedValue(undefined),
    findInvitationById: vi.fn().mockResolvedValue(undefined),
    createInvitation: vi.fn().mockResolvedValue({
      id: 'invitation_1',
      groupId: 'group_1',
      invitedUserId: 'user_invited',
      invitedByUserId: 'user_owner',
      status: 'pending',
      createdAt,
      respondedAt: null,
    }),
    updateInvitationStatus: vi.fn().mockResolvedValue(undefined),
    addMember: vi.fn().mockResolvedValue(undefined),
    updateMemberRole: vi.fn().mockResolvedValue(undefined),
    removeMember: vi.fn().mockResolvedValue(undefined),
    searchInviteCandidates: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

describe('group use cases', () => {
  it('creates a group with the creator as owner', async () => {
    const deps = createDeps();

    const result = await createGroupUseCase(
      'user_owner',
      { name: ' Product team ', description: ' Launch planning ' },
      deps,
    );

    expect(result).toEqual({
      ok: true,
      data: {
        id: 'group_1',
        name: 'Product team',
        description: 'Launch planning',
        ownerId: 'user_owner',
        role: 'OWNER',
        memberCount: 1,
        pendingInvitationCount: 0,
      },
    });
    expect(deps.createGroupWithOwner).toHaveBeenCalledWith({
      id: expect.any(String),
      name: 'Product team',
      description: 'Launch planning',
      ownerId: 'user_owner',
    });
  });

  it('allows owners and admins to invite non-members', async () => {
    const deps = createDeps({
      findMembership: vi
        .fn()
        .mockImplementation(async (_groupId: string, userId: string) => {
          if (userId === 'user_owner') {
            return membership('group_1', 'user_owner', 'OWNER');
          }

          return undefined;
        }),
    });

    const result = await inviteUserToGroupUseCase(
      'user_owner',
      'group_1',
      'user_invited',
      deps,
    );

    expect(result.ok).toBe(true);
    expect(deps.createInvitation).toHaveBeenCalledWith({
      id: expect.any(String),
      groupId: 'group_1',
      invitedUserId: 'user_invited',
      invitedByUserId: 'user_owner',
    });
  });

  it('rejects invitations from regular members', async () => {
    const deps = createDeps({
      findMembership: vi
        .fn()
        .mockResolvedValue(membership('group_1', 'user_member', 'MEMBER')),
    });

    await expect(
      inviteUserToGroupUseCase('user_member', 'group_1', 'user_invited', deps),
    ).resolves.toEqual({
      ok: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Only group admins can invite members.',
      },
    });
    expect(deps.createInvitation).not.toHaveBeenCalled();
  });

  it('accepts invitations by adding the invited user as a member', async () => {
    const deps = createDeps({
      findInvitationById: vi.fn().mockResolvedValue({
        id: 'invitation_1',
        groupId: 'group_1',
        invitedUserId: 'user_invited',
        invitedByUserId: 'user_owner',
        status: 'pending',
        createdAt,
        respondedAt: null,
        group: group(),
        inviter: user('user_owner', 'Owner'),
      }),
    });

    const result = await respondToGroupInvitationUseCase(
      'user_invited',
      'invitation_1',
      'accept',
      deps,
    );

    expect(result.ok).toBe(true);
    expect(deps.addMember).toHaveBeenCalledWith(
      'group_1',
      'user_invited',
      'MEMBER',
    );
    expect(deps.updateInvitationStatus).toHaveBeenCalledWith(
      'invitation_1',
      'accepted',
    );
  });

  it('only lets the owner promote or demote admins', async () => {
    const deps = createDeps({
      findMembership: vi
        .fn()
        .mockImplementation(async (_groupId: string, userId: string) => {
          if (userId === 'user_owner') {
            return membership('group_1', 'user_owner', 'OWNER');
          }

          return membership('group_1', userId, 'MEMBER');
        }),
    });

    await expect(
      updateGroupMemberRoleUseCase(
        'user_owner',
        'group_1',
        'user_member',
        'ADMIN',
        deps,
      ),
    ).resolves.toEqual({
      ok: true,
      data: {
        userId: 'user_member',
        role: 'ADMIN',
      },
    });
    expect(deps.updateMemberRole).toHaveBeenCalledWith(
      'group_1',
      'user_member',
      'ADMIN',
    );
  });

  it('prevents admins from removing other admins while allowing member removal', async () => {
    const deps = createDeps({
      findMembership: vi
        .fn()
        .mockImplementation(async (_groupId: string, userId: string) => {
          if (userId === 'user_admin') {
            return membership('group_1', 'user_admin', 'ADMIN');
          }

          return membership(
            'group_1',
            userId,
            userId === 'user_member' ? 'MEMBER' : 'ADMIN',
          );
        }),
    });

    await expect(
      removeGroupMemberUseCase('user_admin', 'group_1', 'user_invited', deps),
    ).resolves.toEqual({
      ok: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Admins can only remove regular members.',
      },
    });

    await expect(
      removeGroupMemberUseCase('user_admin', 'group_1', 'user_member', deps),
    ).resolves.toEqual({
      ok: true,
      data: {
        removed: true,
        userId: 'user_member',
      },
    });
    expect(deps.removeMember).toHaveBeenCalledWith('group_1', 'user_member');
  });
});
