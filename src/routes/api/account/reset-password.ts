import { createFileRoute } from '@tanstack/react-router';

import { resetPasswordWithToken } from '@/src/auth/account-lifecycle';

export const Route = createFileRoute('/api/account/reset-password')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as { token?: string; password?: string };

        const result = await resetPasswordWithToken(body.token ?? '', body.password ?? '');

        if (!result.ok) {
          return Response.json({ error: result.error }, { status: 400 });
        }

        return Response.json({ ok: true });
      },
    },
  },
});
