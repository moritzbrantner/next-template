import { secureRoute } from '@/src/api/route-security';
import { markAllNotificationsReadUseCase } from '@/src/domain/notifications/use-cases';

export async function POST(request: Request) {
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
}
