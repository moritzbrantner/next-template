import { createFileRoute } from '@tanstack/react-router';

import { recordPageVisit } from '@/src/analytics/page-visits';
import { getAuthSession } from '@/src/auth.server';

export const Route = createFileRoute('/api/analytics/page-visits')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => null)) as { href?: string } | null;

        if (!body?.href || typeof body.href !== 'string') {
          return Response.json({ error: 'A tracked page href is required.' }, { status: 400 });
        }

        const session = await getAuthSession();
        const userId = session?.user.id;

        if (!userId) {
          return Response.json({ tracked: false }, { status: 202 });
        }

        try {
          const visit = await recordPageVisit({ userId, href: body.href });

          return Response.json({ tracked: true, visitId: visit.id }, { status: 201 });
        } catch (error) {
          if (error instanceof Error && (error.message === 'Page visit href is required.' || error.message === 'Invalid page visit href.')) {
            return Response.json({ error: error.message }, { status: 400 });
          }

          console.warn('[analytics] unable to record page visit through api fallback', error);

          return Response.json({ tracked: false }, { status: 202 });
        }
      },
    },
  },
});
