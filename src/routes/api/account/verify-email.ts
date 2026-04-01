import { createFileRoute } from '@tanstack/react-router';

import { verifyEmailByToken } from '@/src/auth/account-lifecycle';

export const Route = createFileRoute('/api/account/verify-email')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const token = url.searchParams.get('token');

        if (!token) {
          return Response.json({ error: 'Missing token.' }, { status: 400 });
        }

        const result = await verifyEmailByToken(token);

        if (!result.ok) {
          return Response.json({ error: result.error }, { status: 400 });
        }

        return Response.json({ ok: true });
      },
    },
  },
});
