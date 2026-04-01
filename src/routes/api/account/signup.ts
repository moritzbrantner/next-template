import { createFileRoute } from '@tanstack/react-router';

import { signInSession } from '@/src/auth.server';
import { signUpWithCredentials } from '@/src/auth/account-lifecycle';
import { getDb } from '@/src/db/client';

export const Route = createFileRoute('/api/account/signup')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as { email?: string; password?: string; name?: string };

        const result = await signUpWithCredentials({
          email: body.email ?? '',
          password: body.password ?? '',
          name: body.name,
        });

        if (!result.ok) {
          return Response.json({ error: result.error }, { status: 400 });
        }

        const user = await getDb().query.users.findFirst({
          where: (table, { eq }) => eq(table.id, result.userId),
        });

        if (!user?.email) {
          return Response.json({ error: 'Account created, but automatic sign-in failed. Try logging in manually.' }, { status: 500 });
        }

        await signInSession({
          id: user.id,
          email: user.email,
          image: user.image,
          name: user.name,
          role: user.role,
        });

        return Response.json({ ok: true });
      },
    },
  },
});
