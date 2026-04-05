import { createFileRoute } from '@tanstack/react-router';

import { requestPasswordReset } from '@/src/auth/account-lifecycle';

export const Route = createFileRoute('/api/account/forgot-password')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as { email?: string; locale?: string };

        await requestPasswordReset(body.email ?? '', { locale: body.locale });

        return Response.json({ ok: true });
      },
    },
  },
});
