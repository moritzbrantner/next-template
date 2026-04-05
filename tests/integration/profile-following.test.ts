import { describe, expect, it, vi } from 'vitest';

import {
  followUserUseCase,
  getProfileViewUseCase,
  unfollowUserUseCase,
  type ProfileUseCaseDeps,
} from '@/src/domain/profile/use-cases';

function createDeps(overrides: Partial<ProfileUseCaseDeps> = {}): ProfileUseCaseDeps {
  return {
    findUserById: vi.fn(),
    countFollowers: vi.fn().mockResolvedValue(0),
    hasFollowRelationship: vi.fn().mockResolvedValue(false),
    createFollowRelationship: vi.fn().mockResolvedValue(undefined),
    deleteFollowRelationship: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('profile follow use cases', () => {
  it('loads a profile view with follower count and follow state', async () => {
    const deps = createDeps({
      findUserById: vi.fn().mockResolvedValue({
        id: 'user_2',
        email: 'person@example.com',
        name: 'Person',
        image: 'local-profile-images/user_2/avatar.jpg',
      }),
      countFollowers: vi.fn().mockResolvedValue(14),
      hasFollowRelationship: vi.fn().mockResolvedValue(true),
    });

    const result = await getProfileViewUseCase('user_2', 'user_1', deps);

    expect(result).toEqual({
      ok: true,
      data: {
        userId: 'user_2',
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
        name: null,
        image: null,
      }),
      countFollowers: vi.fn().mockResolvedValue(3),
    });

    const result = await getProfileViewUseCase('user_1', 'user_1', deps);

    expect(result).toEqual({
      ok: true,
      data: {
        userId: 'user_1',
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
        name: 'Person',
        image: null,
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
});
