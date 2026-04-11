import { eq } from 'drizzle-orm';

import { getDb } from '@/src/db/client';
import { blogPosts, notifications, userFollows } from '@/src/db/schema';
import { failure, success, type ServiceResult } from '@/src/domain/shared/result';
import { buildProfileImageUrl } from '@/src/profile/object-storage';

const BLOG_POST_TITLE_MIN_LENGTH = 4;
const BLOG_POST_TITLE_MAX_LENGTH = 120;
const BLOG_POST_CONTENT_MIN_LENGTH = 20;
const BLOG_POST_CONTENT_MAX_LENGTH = 10_000;

type BlogAuthorRecord = {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
};

type BlogPostRecord = {
  id: string;
  userId: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
};

export type BlogPostSummary = {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
};

export type UserBlogPayload = {
  userId: string;
  displayName: string;
  imageUrl: string | null;
  posts: BlogPostSummary[];
};

export type BlogPostMutationPayload = {
  id: string;
  title: string;
  content: string;
};

export type BlogError = {
  code: 'VALIDATION_ERROR' | 'NOT_FOUND';
  message: string;
};

export type BlogUseCaseDeps = {
  findUserById: (userId: string) => Promise<BlogAuthorRecord | undefined>;
  listPostsByUserId: (userId: string) => Promise<BlogPostRecord[]>;
  listFollowerIdsByUserId: (userId: string) => Promise<string[]>;
  createPost: (input: { userId: string; title: string; content: string }) => Promise<BlogPostRecord>;
  createNotifications: (
    input: Array<{
      userId: string;
      actorId: string;
      title: string;
      body: string;
      href: string;
    }>,
  ) => Promise<void>;
};

function getBlogUseCaseDeps(): BlogUseCaseDeps {
  return {
    findUserById: (userId) =>
      getDb().query.users.findFirst({
        where: (table, { eq: innerEq }) => innerEq(table.id, userId),
      }),
    listPostsByUserId: (userId) =>
      getDb().query.blogPosts.findMany({
        where: (table, { eq: innerEq }) => innerEq(table.userId, userId),
        orderBy: (table, { desc: innerDesc }) => [innerDesc(table.createdAt)],
      }),
    listFollowerIdsByUserId: async (userId) => {
      const followers = await getDb()
        .select({ userId: userFollows.followerId })
        .from(userFollows)
        .where(eq(userFollows.followingId, userId));

      return followers.map((follower) => follower.userId);
    },
    createPost: async ({ userId, title, content }) => {
      const [createdPost] = await getDb()
        .insert(blogPosts)
        .values({
          id: crypto.randomUUID(),
          userId,
          title,
          content,
        })
        .returning();

      return createdPost;
    },
    createNotifications: async (input) => {
      if (input.length === 0) {
        return;
      }

      const now = new Date();

      await getDb().insert(notifications).values(
        input.map((notification) => ({
          id: crypto.randomUUID(),
          userId: notification.userId,
          actorId: notification.actorId,
          title: notification.title,
          body: notification.body,
          href: notification.href,
          audience: 'user' as const,
          createdAt: now,
        })),
      );
    },
  };
}

function resolveProfileDisplayName(user: Pick<BlogAuthorRecord, 'name' | 'email'>) {
  const trimmedName = user.name?.trim();

  if (trimmedName) {
    return trimmedName;
  }

  const emailPrefix = user.email?.split('@')[0]?.trim();
  return emailPrefix || 'User';
}

function normalizeBlogPost(post: BlogPostRecord): BlogPostSummary {
  return {
    id: post.id,
    title: post.title,
    content: post.content,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };
}

function buildBlogPostHref(userId: string, postId: string) {
  return `/profile/${userId}/blog#post-${postId}`;
}

function buildFollowerNotification(input: {
  authorUserId: string;
  authorDisplayName: string;
  followerUserId: string;
  postId: string;
  postTitle: string;
}) {
  return {
    userId: input.followerUserId,
    actorId: input.authorUserId,
    title: `${input.authorDisplayName} published a new blog post`,
    body: input.postTitle,
    href: buildBlogPostHref(input.authorUserId, input.postId),
  };
}

export async function getUserBlogUseCase(
  userId: string,
  deps: BlogUseCaseDeps = getBlogUseCaseDeps(),
): Promise<ServiceResult<UserBlogPayload, BlogError>> {
  const user = await deps.findUserById(userId);

  if (!user) {
    return failure({
      code: 'NOT_FOUND',
      message: 'User account was not found.',
    });
  }

  const posts = await deps.listPostsByUserId(userId);

  return success({
    userId: user.id,
    displayName: resolveProfileDisplayName(user),
    imageUrl: buildProfileImageUrl(user.image) ?? null,
    posts: posts.map(normalizeBlogPost),
  });
}

export async function createBlogPostUseCase(
  userId: string,
  input: { title: string; content: string },
  deps: BlogUseCaseDeps = getBlogUseCaseDeps(),
): Promise<ServiceResult<BlogPostMutationPayload, BlogError>> {
  const title = input.title.trim();
  const content = input.content.trim();

  if (title.length < BLOG_POST_TITLE_MIN_LENGTH) {
    return failure({
      code: 'VALIDATION_ERROR',
      message: `Title must be at least ${BLOG_POST_TITLE_MIN_LENGTH} characters.`,
    });
  }

  if (title.length > BLOG_POST_TITLE_MAX_LENGTH) {
    return failure({
      code: 'VALIDATION_ERROR',
      message: `Title must be ${BLOG_POST_TITLE_MAX_LENGTH} characters or fewer.`,
    });
  }

  if (content.length < BLOG_POST_CONTENT_MIN_LENGTH) {
    return failure({
      code: 'VALIDATION_ERROR',
      message: `Post content must be at least ${BLOG_POST_CONTENT_MIN_LENGTH} characters.`,
    });
  }

  if (content.length > BLOG_POST_CONTENT_MAX_LENGTH) {
    return failure({
      code: 'VALIDATION_ERROR',
      message: `Post content must be ${BLOG_POST_CONTENT_MAX_LENGTH} characters or fewer.`,
    });
  }

  const user = await deps.findUserById(userId);

  if (!user) {
    return failure({
      code: 'NOT_FOUND',
      message: 'User account was not found.',
    });
  }

  const authorDisplayName = resolveProfileDisplayName(user);
  const post = await deps.createPost({
    userId,
    title,
    content,
  });

  const followerIds = [...new Set(await deps.listFollowerIdsByUserId(userId))].filter((followerId) => followerId !== userId);

  if (followerIds.length > 0) {
    try {
      await deps.createNotifications(
        followerIds.map((followerUserId) =>
          buildFollowerNotification({
            authorUserId: userId,
            authorDisplayName,
            followerUserId,
            postId: post.id,
            postTitle: post.title,
          }),
        ),
      );
    } catch (error) {
      console.error('Failed to deliver follower notifications for blog post.', error);
    }
  }

  return success({
    id: post.id,
    title: post.title,
    content: post.content,
  });
}
