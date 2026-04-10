import { secureRoute } from '@/src/api/route-security';
import { subscribeToNewsletter } from '@/src/domain/newsletter/use-cases';

export async function POST(request: Request) {
  const guard = await secureRoute({
    request,
    action: 'newsletter.subscribe',
  });

  if (!guard.ok) {
    return guard.response;
  }

  const body = (await request.json()) as { email?: string; locale?: string; source?: string };
  const result = await subscribeToNewsletter({
    email: body.email ?? '',
    locale: body.locale,
    source: body.source,
  });

  if (!result.ok) {
    return guard.json({ error: result.error }, { status: 400 });
  }

  return guard.json({ ok: true });
}
