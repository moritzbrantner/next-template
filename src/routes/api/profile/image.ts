import { createFileRoute } from '@tanstack/react-router';

import { secureRoute } from '@/src/api/route-security';
import { signInSession } from '@/src/auth.server';
import { updateProfileImageUseCase } from '@/src/domain/profile/use-cases';

export const Route = createFileRoute('/api/profile/image')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const guard = await secureRoute({
          request,
          action: 'profile.updateImage',
          requireAuth: true,
        });

        if (!guard.ok) {
          return guard.response;
        }

        const session = guard.session!;
        const userId = session.user.id;

        const formData = await request.formData();
        const file = formData.get('image');

        if (!(file instanceof File)) {
          return guard.json({ error: 'Please select an image file.' }, { status: 400 });
        }

        try {
          const result = await updateProfileImageUseCase(userId, file);

          if (!result.ok) {
            return guard.json({ error: result.error.message }, { status: 400 });
          }

          await signInSession({
            ...session.user,
            image: result.data.imageUrl,
          });

          return guard.json({ ok: true });
        } catch (error) {
          console.error('Profile image upload failed.', error);
          return guard.json(
            { error: 'Unable to update profile picture right now. Please try again.' },
            { status: 500 },
          );
        }
      },
    },
  },
});
