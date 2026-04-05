import { createFileRoute } from '@tanstack/react-router';

import { getAuthSession, signInSession } from '@/src/auth.server';
import { updateAccountEmailUseCase, type AccountError } from '@/src/domain/account/use-cases';

function statusForAccountError(error: AccountError) {
  switch (error.code) {
    case 'FORBIDDEN':
      return 403;
    case 'NOT_FOUND':
      return 404;
    case 'CONFLICT':
      return 409;
    default:
      return 400;
  }
}

export const Route = createFileRoute('/api/account/email')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const session = await getAuthSession();
        const userId = session?.user?.id;

        if (!userId || !session) {
          return Response.json({ error: 'You must be signed in to update your email address.' }, { status: 401 });
        }

        const formData = await request.formData();
        const rawEmail = formData.get('email');
        const rawCurrentPassword = formData.get('currentPassword');
        const email = typeof rawEmail === 'string' ? rawEmail : '';
        const currentPassword = typeof rawCurrentPassword === 'string' ? rawCurrentPassword : '';

        try {
          const result = await updateAccountEmailUseCase(userId, { email, currentPassword });

          if (!result.ok) {
            return Response.json({ error: result.error.message }, { status: statusForAccountError(result.error) });
          }

          await signInSession({
            ...session.user,
            email: result.data.email,
          });

          return Response.json({ ok: true });
        } catch {
          return Response.json({ error: 'Unable to update your email address right now. Please try again.' }, { status: 500 });
        }
      },
    },
  },
});
