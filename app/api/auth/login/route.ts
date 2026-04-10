import { secureRoute } from '@/src/api/route-security';
import { authorizeCredentials } from '@/src/auth/credentials';
import { signInSession } from '@/src/auth.server';

export async function POST(request: Request) {
  const guard = await secureRoute({
    request,
    action: 'auth.login',
  });

  if (!guard.ok) {
    return guard.response;
  }

  const body = (await request.json()) as { email?: string; password?: string };
  const user = await authorizeCredentials(
    {
      email: body.email,
      password: body.password,
    },
    undefined,
    request,
  );

  if (!user?.email) {
    return guard.json({ error: 'Email or password is incorrect.' }, { status: 401 });
  }

  await signInSession({
    id: user.id,
    email: user.email,
    image: user.image ?? null,
    name: user.name ?? null,
    role: user.role,
  });

  return guard.json({ ok: true }, { metadata: { actorId: user.id } });
}
