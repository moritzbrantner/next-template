import { createFileRoute } from '@tanstack/react-router';

import { signOutSession } from '@/src/auth.server';

export const Route = createFileRoute('/api/auth/logout')({
  server: {
    handlers: {
      POST: async () => {
        await signOutSession();
        return Response.json({ ok: true });
      },
    },
  },
});
