import { secureRoute } from '@/src/api/route-security';
import { followUserUseCase, unfollowUserUseCase } from '@/src/domain/profile/use-cases';

function getTargetUserId(body: unknown) {
  if (!body || typeof body !== 'object') {
    return '';
  }

  const userId = (body as { userId?: unknown }).userId;
  return typeof userId === 'string' ? userId : '';
}

async function handleFollowRequest(request: Request, shouldFollow: boolean) {
  const guard = await secureRoute({
    request,
    action: shouldFollow ? 'profile.follow' : 'profile.unfollow',
    requireAuth: true,
  });

  if (!guard.ok) {
    return guard.response;
  }

  const actorUserId = guard.session!.user.id;
  const body = await request.json().catch(() => null);
  const targetUserId = getTargetUserId(body);

  if (!targetUserId) {
    return guard.json({ error: 'A valid user id is required.' }, { status: 400 });
  }

  const result = shouldFollow
    ? await followUserUseCase(actorUserId, targetUserId)
    : await unfollowUserUseCase(actorUserId, targetUserId);

  if (!result.ok) {
    const status = result.error.code === 'NOT_FOUND' ? 404 : 400;
    return guard.json({ error: result.error.message }, { status });
  }

  return guard.json({ ok: true, following: result.data.following });
}

export async function POST(request: Request) {
  return handleFollowRequest(request, true);
}

export async function DELETE(request: Request) {
  return handleFollowRequest(request, false);
}
