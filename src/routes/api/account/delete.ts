import { createFileRoute } from '@tanstack/react-router';

import { getAuthSession, signOutSession } from '@/src/auth.server';
import { deleteAccountUseCase, type AccountError } from '@/src/domain/account/use-cases';

function statusForAccountError(error: AccountError) {
  switch (error.code) {
    case 'FORBIDDEN':
      return 403;
    case 'NOT_FOUND':
      return 404;
    default:
      return 400;
  }
}

export const Route = createFileRoute('/api/account/delete')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const session = await getAuthSession();
        const userId = session?.user?.id;

        if (!userId) {
          return Response.json({ error: 'You must be signed in to delete your account.' }, { status: 401 });
        }

        const formData = await request.formData();
        const rawCurrentPassword = formData.get('currentPassword');
        const currentPassword = typeof rawCurrentPassword === 'string' ? rawCurrentPassword : '';

        try {
          const result = await deleteAccountUseCase(userId, { currentPassword });

          if (!result.ok) {
            return Response.json({ error: result.error.message }, { status: statusForAccountError(result.error) });
          }

          await signOutSession();
          return Response.json({ ok: true });
        } catch {
          return Response.json({ error: 'Unable to delete your account right now. Please try again.' }, { status: 500 });
        }
      },
    },
  },
});
