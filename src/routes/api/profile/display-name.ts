import { createFileRoute } from '@tanstack/react-router';

import { getAuthSession, signInSession } from '@/src/auth.server';
import { updateDisplayNameUseCase } from '@/src/domain/profile/use-cases';

export const Route = createFileRoute('/api/profile/display-name')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const session = await getAuthSession();
        const userId = session?.user?.id;

        if (!userId || !session) {
          return Response.json({ error: 'You must be signed in to update your display name.' }, { status: 401 });
        }

        const formData = await request.formData();
        const rawDisplayName = formData.get('displayName');
        const displayName = typeof rawDisplayName === 'string' ? rawDisplayName : '';

        try {
          const result = await updateDisplayNameUseCase(userId, displayName);

          if (!result.ok) {
            return Response.json({ error: result.error.message }, { status: 400 });
          }

          await signInSession({
            ...session.user,
            name: result.data.displayName,
          });

          return Response.json({ ok: true });
        } catch {
          return Response.json({ error: 'Unable to update your display name right now. Please try again.' }, { status: 500 });
        }
      },
    },
  },
});
