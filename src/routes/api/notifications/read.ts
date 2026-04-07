import { createFileRoute } from '@tanstack/react-router';

import { secureRoute } from '@/src/api/route-security';
import { markAllNotificationsReadUseCase } from '@/src/domain/notifications/use-cases';

export const Route = createFileRoute('/api/notifications/read')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const guard = await secureRoute({
          request,
          action: 'notifications.markRead',
          requireAuth: true,
        });

        if (!guard.ok) {
          return guard.response;
        }

        await markAllNotificationsReadUseCase(guard.session!.user.id);

        return guard.json({ ok: true });
      },
    },
  },
});
