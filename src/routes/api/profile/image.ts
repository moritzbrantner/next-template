import { createFileRoute } from '@tanstack/react-router';

import { getAuthSession, signInSession } from '@/src/auth.server';
import { updateProfileImageUseCase } from '@/src/domain/profile/use-cases';

export const Route = createFileRoute('/api/profile/image')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const session = await getAuthSession();
        const userId = session?.user?.id;

        if (!userId || !session) {
          return Response.json({ error: 'You must be signed in to update your profile picture.' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('image');

        if (!(file instanceof File)) {
          return Response.json({ error: 'Please select an image file.' }, { status: 400 });
        }

        try {
          const result = await updateProfileImageUseCase(userId, file);

          if (!result.ok) {
            return Response.json({ error: result.error.message }, { status: 400 });
          }

          await signInSession({
            ...session.user,
            image: result.data.imageUrl,
          });

          return Response.json({ ok: true });
        } catch (error) {
          console.error('Profile image upload failed.', error);
          return Response.json({ error: 'Unable to update profile picture right now. Please try again.' }, { status: 500 });
        }
      },
    },
  },
});
