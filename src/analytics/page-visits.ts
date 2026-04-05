import { getDb } from '@/src/db/client';
import { pageVisitQueryParameters, pageVisits } from '@/src/db/schema';

const TRACKED_PAGE_BASE_URL = 'https://page-visit.local';
const NON_TRACKABLE_PAGE_PATH_PREFIXES = ['/api', '/_build', '/_serverFn'] as const;

export type NormalizedPageVisit = {
  href: string;
  pathname: string;
  queryParameters: Array<{
    key: string;
    value: string;
    position: number;
  }>;
};

export type PageVisitTrackingCause = 'preload' | 'enter' | 'stay';

export function isTrackablePageVisitPathname(pathname: string): boolean {
  return !NON_TRACKABLE_PAGE_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function normalizeTrackedPageVisit(href: string): NormalizedPageVisit {
  if (typeof href !== 'string' || href.trim().length === 0) {
    throw new Error('Page visit href is required.');
  }

  let url: URL;

  try {
    url = new URL(href.trim(), TRACKED_PAGE_BASE_URL);
  } catch {
    throw new Error('Invalid page visit href.');
  }

  if (!url.pathname.startsWith('/')) {
    throw new Error('Invalid page visit href.');
  }

  const normalizedHref = `${url.pathname}${url.search}${url.hash}`;

  return {
    href: normalizedHref,
    pathname: url.pathname,
    queryParameters: Array.from(url.searchParams.entries()).map(([key, value], position) => ({
      key,
      value,
      position,
    })),
  };
}

export function shouldTrackPageVisit(input: { href?: string | null; cause?: PageVisitTrackingCause | null }): boolean {
  if (!input.href || input.cause === 'preload') {
    return false;
  }

  try {
    return isTrackablePageVisitPathname(normalizeTrackedPageVisit(input.href).pathname);
  } catch {
    return false;
  }
}

export async function recordPageVisit(input: { userId: string; href: string; visitedAt?: Date }) {
  const visitId = crypto.randomUUID();
  const visitedAt = input.visitedAt ?? new Date();
  const normalizedVisit = normalizeTrackedPageVisit(input.href);
  const db = getDb();

  if (!isTrackablePageVisitPathname(normalizedVisit.pathname)) {
    throw new Error('Invalid page visit href.');
  }

  await db.transaction(async (tx) => {
    await tx.insert(pageVisits).values({
      id: visitId,
      userId: input.userId,
      href: normalizedVisit.href,
      pathname: normalizedVisit.pathname,
      visitedAt,
    });

    if (normalizedVisit.queryParameters.length === 0) {
      return;
    }

    await tx.insert(pageVisitQueryParameters).values(
      normalizedVisit.queryParameters.map((parameter) => ({
        id: crypto.randomUUID(),
        pageVisitId: visitId,
        key: parameter.key,
        value: parameter.value,
        position: parameter.position,
      })),
    );
  });

  return {
    id: visitId,
    userId: input.userId,
    visitedAt,
    ...normalizedVisit,
  };
}
