import { createFileRoute } from '@tanstack/react-router';

import { secureRoute } from '@/src/api/route-security';
import { resetPasswordWithToken } from '@/src/auth/account-lifecycle';

export const Route = createFileRoute('/api/account/reset-password')({
  server: {
    handlers: {
      POST: async ({ request }) => {
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
      },
    },
  },
});
