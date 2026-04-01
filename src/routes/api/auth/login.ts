import { createFileRoute } from '@tanstack/react-router';

import { signInSession } from '@/src/auth.server';
import { authorizeCredentials } from '@/src/auth/credentials';

export const Route = createFileRoute('/api/auth/login')({
  server: {
    handlers: {
      POST: async ({ request }) => {
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
          return Response.json({ error: 'Email or password is incorrect.' }, { status: 401 });
        }

        await signInSession({
          id: user.id,
          email: user.email,
          image: user.image ?? null,
          name: user.name ?? null,
          role: user.role,
        });

        return Response.json({ ok: true });
      },
    },
  },
});
