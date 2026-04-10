import { secureRoute } from '@/src/api/route-security';
import { resetPasswordWithToken } from '@/src/auth/account-lifecycle';

export async function POST(request: Request) {
  const guard = await secureRoute({
    request,
    action: 'account.resetPassword',
  });

  if (!guard.ok) {
    return guard.response;
  }

  const body = (await request.json()) as { token?: string; password?: string };
  const result = await resetPasswordWithToken(body.token ?? '', body.password ?? '');

  if (!result.ok) {
    return guard.json({ error: result.error }, { status: 400 });
  }

  return guard.json({ ok: true });
}
