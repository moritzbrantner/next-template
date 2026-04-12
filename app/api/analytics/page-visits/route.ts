import * as z from 'zod';

import { recordPageVisit } from '@/src/analytics/page-visits';
import { getAuthSession } from '@/src/auth.server';
import { problem, ProblemError } from '@/src/http/errors';
import { createApiRoute } from '@/src/http/route';
import { getConsentState } from '@/src/privacy/consent';

export const POST = createApiRoute({
  action: 'analytics.pageVisits',
  bodySchema: z.object({
    href: z.string().min(1),
  }),
  async handler({ body }) {
    const session = await getAuthSession();
    const userId = session?.user.id;
    const consent = await getConsentState();

    if (!userId || !consent.state.analytics) {
      return Response.json({ tracked: false }, { status: 202 });
    }

    try {
      const visit = await recordPageVisit({ userId, href: body.href });
      return Response.json({ tracked: true, visitId: visit.id }, { status: 201 });
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message === 'Page visit href is required.' || error.message === 'Invalid page visit href.')
      ) {
        throw new ProblemError(problem('/problems/page-visit', 'Invalid page visit', 400, error.message));
      }

      return Response.json({ tracked: false }, { status: 202 });
    }
  },
});
