import { createFileRoute } from '@tanstack/react-router';

import { secureRoute } from '@/src/api/route-security';
import { signInSession } from '@/src/auth.server';
import { updateDisplayNameUseCase } from '@/src/domain/profile/use-cases';

export const Route = createFileRoute('/api/profile/display-name')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const guard = await secureRoute({
          request,
          action: 'profile.updateDisplayName',
          requireAuth: true,
        });

        if (!guard.ok) {
          return guard.response;
        }

        const session = guard.session!;
        const userId = session.user.id;

        const formData = await request.formData();
        const rawDisplayName = formData.get('displayName');
        const displayName = typeof rawDisplayName === 'string' ? rawDisplayName : '';

        try {
          const result = await updateDisplayNameUseCase(userId, displayName);

          if (!result.ok) {
            return guard.json({ error: result.error.message }, { status: 400 });
          }

          await signInSession({
            ...session.user,
            name: result.data.displayName,
          });

          return guard.json({ ok: true });
        } catch {
          return guard.json(
            { error: 'Unable to update your display name right now. Please try again.' },
            { status: 500 },
          );
        }
      },
    },
  },
});
