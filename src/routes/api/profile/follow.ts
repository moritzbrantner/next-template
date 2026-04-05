import { createFileRoute } from '@tanstack/react-router';

import { getAuthSession } from '@/src/auth.server';
import { followUserUseCase, unfollowUserUseCase } from '@/src/domain/profile/use-cases';

function getTargetUserId(body: unknown) {
  if (!body || typeof body !== 'object') {
    return '';
  }

  const userId = (body as { userId?: unknown }).userId;
  return typeof userId === 'string' ? userId : '';
}

async function handleFollowRequest(request: Request, shouldFollow: boolean) {
  const session = await getAuthSession();
  const actorUserId = session?.user?.id;

  if (!actorUserId) {
    return Response.json({ error: 'You must be signed in to follow someone.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const targetUserId = getTargetUserId(body);

  if (!targetUserId) {
    return Response.json({ error: 'A valid user id is required.' }, { status: 400 });
  }

  const result = shouldFollow
    ? await followUserUseCase(actorUserId, targetUserId)
    : await unfollowUserUseCase(actorUserId, targetUserId);

  if (!result.ok) {
    const status = result.error.code === 'NOT_FOUND' ? 404 : 400;
    return Response.json({ error: result.error.message }, { status });
  }

  return Response.json({ ok: true, following: result.data.following });
}

export const Route = createFileRoute('/api/profile/follow')({
  server: {
    handlers: {
      POST: ({ request }) => handleFollowRequest(request, true),
      DELETE: ({ request }) => handleFollowRequest(request, false),
    },
  },
});
