import { createFileRoute } from '@tanstack/react-router';

import { getAuthSession, signInSession } from '@/src/auth.server';
import { removeProfileImageUseCase } from '@/src/domain/profile/use-cases';

export const Route = createFileRoute('/api/profile/image/remove')({
  server: {
    handlers: {
      POST: async () => {
        const session = await getAuthSession();
        const userId = session?.user?.id;

        if (!userId || !session) {
          return Response.json({ error: 'You must be signed in to update your profile picture.' }, { status: 401 });
        }

        const result = await removeProfileImageUseCase(userId);

        if (!result.ok) {
          return Response.json({ error: result.error.message }, { status: 400 });
        }

        await signInSession({
          ...session.user,
          image: null,
        });

        return Response.json({ ok: true });
      },
    },
  },
});
