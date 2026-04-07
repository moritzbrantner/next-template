import { createFileRoute } from '@tanstack/react-router';

import { secureRoute } from '@/src/api/route-security';
import { signInSession } from '@/src/auth.server';
import { removeProfileImageUseCase } from '@/src/domain/profile/use-cases';

export const Route = createFileRoute('/api/profile/image/remove')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const guard = await secureRoute({
          request,
          action: 'profile.removeImage',
          requireAuth: true,
        });

        if (!guard.ok) {
          return guard.response;
        }

        const session = guard.session!;
        const userId = session.user.id;

        const result = await removeProfileImageUseCase(userId);

        if (!result.ok) {
          return guard.json({ error: result.error.message }, { status: 400 });
        }

        await signInSession({
          ...session.user,
          image: null,
        });

        return guard.json({ ok: true });
      },
    },
  },
});
