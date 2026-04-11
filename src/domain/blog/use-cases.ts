import { getDb } from '@/src/db/client';
import { blogPosts } from '@/src/db/schema';
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
  createPost: (input: { userId: string; title: string; content: string }) => Promise<BlogPostRecord>;
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

  const post = await deps.createPost({
    userId,
    title,
    content,
  });

  return success({
    id: post.id,
    title: post.title,
    content: post.content,
  });
}
