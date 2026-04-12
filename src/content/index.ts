import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import { cache } from 'react';
import matter from 'gray-matter';
import { compile, run } from '@mdx-js/mdx';
import * as jsxRuntime from 'react/jsx-runtime';
import * as z from 'zod';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';

import type { ContentCollection, ContentEntry, ContentIndexRecord } from '@/src/content/contracts';
import { getEnv } from '@/src/config/env';

const CONTENT_ROOT = path.join(process.cwd(), 'content');

const frontmatterSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  slug: z.string().min(1),
  locale: z.string().min(2),
  publishedAt: z.union([z.string().datetime(), z.date().transform((value) => value.toISOString())]),
  updatedAt: z.union([z.string().datetime(), z.date().transform((value) => value.toISOString())]).optional(),
  draft: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  seo: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      canonicalUrl: z.string().url().optional(),
      ogImage: z.string().optional(),
    })
    .default({}),
});

type IndexedCollection = {
  records: ContentEntry[];
};

function collectionDirectory(collection: ContentCollection, locale: string) {
  return path.join(CONTENT_ROOT, collection, locale);
}

function getHref(collection: ContentCollection, locale: string, slug: string) {
  if (collection === 'pages') {
    return `/${locale}/${slug}`;
  }

  return `/${locale}/${collection}/${slug}`;
}

async function readCollection(collection: ContentCollection, locale: string): Promise<IndexedCollection> {
  const directory = collectionDirectory(collection, locale);
  let fileNames: string[] = [];

  try {
    fileNames = (await readdir(directory)).filter((fileName) => fileName.endsWith('.mdx'));
  } catch {
    return { records: [] };
  }

  const records = await Promise.all(
    fileNames.map(async (fileName) => {
      const fullPath = path.join(directory, fileName);
      const source = await readFile(fullPath, 'utf8');
      const parsed = matter(source);
      const frontmatter = frontmatterSchema.parse(parsed.data);

      return {
        id: `${collection}:${frontmatter.locale}:${frontmatter.slug}`,
        collection,
        slug: frontmatter.slug,
        locale: frontmatter.locale,
        title: frontmatter.title,
        description: frontmatter.description,
        publishedAt: frontmatter.publishedAt,
        updatedAt: frontmatter.updatedAt ?? null,
        draft: frontmatter.draft,
        tags: frontmatter.tags,
        seo: frontmatter.seo,
        href: getHref(collection, frontmatter.locale, frontmatter.slug),
        body: parsed.content,
      } satisfies ContentEntry;
    }),
  );

  return {
    records: records
      .filter((record) => !record.draft || !getEnv().isProduction)
      .sort((left, right) => new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime()),
  };
}

const getCollectionCache = cache(async (collection: ContentCollection, locale: string) => readCollection(collection, locale));

export async function getPageContent(locale: string, slug: string) {
  const collection = await getCollectionCache('pages', locale);
  return collection.records.find((record) => record.slug === slug) ?? null;
}

export async function listBlogPosts(locale: string): Promise<ContentIndexRecord[]> {
  const collection = await getCollectionCache('blog', locale);
  return collection.records.map((record) => {
    const { body, ...summary } = record;
    void body;
    return summary;
  });
}

export async function listChangelogEntries(locale: string): Promise<ContentIndexRecord[]> {
  const collection = await getCollectionCache('changelog', locale);
  return collection.records.map((record) => {
    const { body, ...summary } = record;
    void body;
    return summary;
  });
}

export async function getContentEntry(collection: Extract<ContentCollection, 'blog' | 'changelog'>, locale: string, slug: string) {
  const indexed = await getCollectionCache(collection, locale);
  return indexed.records.find((record) => record.slug === slug) ?? null;
}

export async function getAdjacentEntries(collection: Extract<ContentCollection, 'blog' | 'changelog'>, locale: string, slug: string) {
  const indexed = await getCollectionCache(collection, locale);
  const currentIndex = indexed.records.findIndex((record) => record.slug === slug);

  if (currentIndex === -1) {
    return {
      previous: null,
      next: null,
    };
  }

  const previous = indexed.records[currentIndex + 1];
  const next = indexed.records[currentIndex - 1];

  return {
    previous: previous
      ? (() => {
          const { body, ...summary } = previous;
          void body;
          return summary;
        })()
      : null,
    next: next
      ? (() => {
          const { body, ...summary } = next;
          void body;
          return summary;
        })()
      : null,
  };
}

export const renderContentEntry = cache(async (entry: ContentEntry) => {
  const compiled = await compile(entry.body, {
    outputFormat: 'function-body',
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeSlug],
  });

  const evaluated = await run(compiled, {
    ...jsxRuntime,
    baseUrl: import.meta.url,
  });

  return evaluated.default;
});
