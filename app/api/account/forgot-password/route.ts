import { secureRoute } from '@/src/api/route-security';
import { requestPasswordReset } from '@/src/auth/account-lifecycle';

export async function POST(request: Request) {
  const guard = await secureRoute({
    request,
    action: 'account.forgotPassword',
  });

  if (!guard.ok) {
    return guard.response;
  }

  const body = (await request.json()) as { email?: string; locale?: string };
  await requestPasswordReset(body.email ?? '', { locale: body.locale });
  return guard.json({ ok: true });
}
