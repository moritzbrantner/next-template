import { createFileRoute } from '@tanstack/react-router';

import { subscribeToNewsletter } from '@/src/domain/newsletter/use-cases';

export const Route = createFileRoute('/api/newsletter/subscribe')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as { email?: string; locale?: string; source?: string };

        const result = await subscribeToNewsletter({
          email: body.email ?? '',
          locale: body.locale,
          source: body.source,
        });

        if (!result.ok) {
          return Response.json({ error: result.error }, { status: 400 });
        }

        return Response.json({ ok: true });
      },
    },
  },
});
