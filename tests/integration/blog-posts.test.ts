import { describe, expect, it, vi } from 'vitest';

import {
  createBlogPostUseCase,
  getUserBlogUseCase,
  type BlogUseCaseDeps,
} from '@/src/domain/blog/use-cases';

function createDeps(overrides: Partial<BlogUseCaseDeps> = {}): BlogUseCaseDeps {
  return {
    findUserById: vi.fn(),
    listPostsByUserId: vi.fn().mockResolvedValue([]),
    listFollowerIdsByUserId: vi.fn().mockResolvedValue([]),
    createPost: vi.fn(),
    createNotifications: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('blog post use cases', () => {
  it('loads a user blog with profile metadata and posts', async () => {
    const createdAt = new Date('2026-04-10T08:00:00.000Z');
    const updatedAt = new Date('2026-04-10T08:15:00.000Z');
    const deps = createDeps({
      findUserById: vi.fn().mockResolvedValue({
        id: 'user_2',
        email: 'writer@example.com',
        name: 'Writer',
        image: 'local-profile-images/user_2/avatar.jpg',
      }),
      listPostsByUserId: vi.fn().mockResolvedValue([
        {
          id: 'post_1',
          userId: 'user_2',
          title: 'First post',
          content: 'This is the first published post for the public blog page.',
          createdAt,
          updatedAt,
        },
      ]),
    });

    const result = await getUserBlogUseCase('user_2', deps);

    expect(result).toEqual({
      ok: true,
      data: {
        userId: 'user_2',
        displayName: 'Writer',
        imageUrl: '/local-profile-images/user_2/avatar.jpg',
        posts: [
          {
            id: 'post_1',
            title: 'First post',
            content: 'This is the first published post for the public blog page.',
            createdAt,
            updatedAt,
          },
        ],
      },
    });
  });

  it('creates a post with trimmed values', async () => {
    const deps = createDeps({
      findUserById: vi.fn().mockResolvedValue({
        id: 'user_1',
        email: 'author@example.com',
        name: 'Author',
        image: null,
      }),
      createPost: vi.fn().mockResolvedValue({
        id: 'post_2',
        userId: 'user_1',
        title: 'Trimmed title',
        content: 'This body has enough content to pass the minimum validation.',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      listFollowerIdsByUserId: vi.fn().mockResolvedValue(['user_2', 'user_3']),
    });

    const result = await createBlogPostUseCase(
      'user_1',
      {
        title: '  Trimmed title  ',
        content: '  This body has enough content to pass the minimum validation.  ',
      },
      deps,
    );

    expect(result).toEqual({
      ok: true,
      data: {
        id: 'post_2',
        title: 'Trimmed title',
        content: 'This body has enough content to pass the minimum validation.',
      },
    });
    expect(deps.createPost).toHaveBeenCalledWith({
      userId: 'user_1',
      title: 'Trimmed title',
      content: 'This body has enough content to pass the minimum validation.',
    });
    expect(deps.createNotifications).toHaveBeenCalledWith([
      {
        userId: 'user_2',
        actorId: 'user_1',
        title: 'Author published a new blog post',
        body: 'Trimmed title',
        href: '/profile/user_1/blog#post-post_2',
      },
      {
        userId: 'user_3',
        actorId: 'user_1',
        title: 'Author published a new blog post',
        body: 'Trimmed title',
        href: '/profile/user_1/blog#post-post_2',
      },
    ]);
  });

  it('does not fail post creation when follower notifications cannot be delivered', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      const deps = createDeps({
        findUserById: vi.fn().mockResolvedValue({
          id: 'user_1',
          email: 'author@example.com',
          name: 'Author',
          image: null,
        }),
        listFollowerIdsByUserId: vi.fn().mockResolvedValue(['user_2']),
        createPost: vi.fn().mockResolvedValue({
          id: 'post_3',
          userId: 'user_1',
          title: 'Resilient title',
          content: 'This body has enough content to pass the minimum validation.',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        createNotifications: vi.fn().mockRejectedValue(new Error('database unavailable')),
      });

      const result = await createBlogPostUseCase(
        'user_1',
        {
          title: 'Resilient title',
          content: 'This body has enough content to pass the minimum validation.',
        },
        deps,
      );

      expect(result).toEqual({
        ok: true,
        data: {
          id: 'post_3',
          title: 'Resilient title',
          content: 'This body has enough content to pass the minimum validation.',
        },
      });
      expect(deps.createNotifications).toHaveBeenCalledTimes(1);
      expect(consoleError).toHaveBeenCalled();
    } finally {
      consoleError.mockRestore();
    }
  });

  it('rejects posts that are too short', async () => {
    const deps = createDeps();

    await expect(
      createBlogPostUseCase(
        'user_1',
        {
          title: 'Hey',
          content: 'Too short',
        },
        deps,
      ),
    ).resolves.toEqual({
      ok: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Title must be at least 4 characters.',
      },
    });

    expect(deps.findUserById).not.toHaveBeenCalled();
    expect(deps.createPost).not.toHaveBeenCalled();
  });
});
