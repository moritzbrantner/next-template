import { secureRoute } from '@/src/api/route-security';
import { signUpWithCredentials } from '@/src/auth/account-lifecycle';
import { signInSession } from '@/src/auth.server';
import { getDb } from '@/src/db/client';

export async function POST(request: Request) {
  const guard = await secureRoute({
    request,
    action: 'account.signup',
  });

  if (!guard.ok) {
    return guard.response;
  }

  const body = (await request.json()) as { email?: string; password?: string; name?: string; locale?: string };
  const result = await signUpWithCredentials({
    email: body.email ?? '',
    password: body.password ?? '',
    name: body.name,
    locale: body.locale,
  });

  if (!result.ok) {
    return guard.json({ error: result.error }, { status: 400 });
  }

  const user = await getDb().query.users.findFirst({
    where: (table, { eq }) => eq(table.id, result.userId),
  });

  if (!user?.email) {
    return guard.json(
      { error: 'Account created, but automatic sign-in failed. Try logging in manually.' },
      { status: 500 },
    );
  }

  await signInSession({
    id: user.id,
    email: user.email,
    image: user.image,
    name: user.name,
    role: user.role,
  });

  return guard.json({ ok: true }, { metadata: { actorId: user.id } });
}
