import { createServerFn } from '@tanstack/react-start';

import { recordPageVisit, shouldTrackPageVisit, type PageVisitTrackingCause } from '@/src/analytics/page-visits';
import { getAuthSession } from '@/src/auth.server';
import { getNotificationPreviewUseCase, type NotificationPreview } from '@/src/domain/notifications/use-cases';

type LoadAppContextInput = {
  href?: string;
  cause?: PageVisitTrackingCause;
};

export type AppRouteContext = {
  session: Awaited<ReturnType<typeof getAuthSession>>;
  notificationCenter: NotificationPreview | null;
};

export const emptyAppContext: AppRouteContext = {
  session: null,
  notificationCenter: null,
};

function validateLoadAppContextInput(input: LoadAppContextInput | undefined): LoadAppContextInput {
  return {
    href: typeof input?.href === 'string' ? input.href : undefined,
    cause: input?.cause,
  };
}

export const loadAppContext = createServerFn({ method: 'GET' })
  .inputValidator(validateLoadAppContextInput)
  .handler(async ({ data }) => {
    const session = await getAuthSession();

    if (session?.user.id && shouldTrackPageVisit(data)) {
      void recordPageVisit({
        userId: session.user.id,
        href: data.href!,
      }).catch((error) => {
        console.warn('[analytics] unable to record page visit', error);
      });
    }

    return {
      session,
      notificationCenter: session?.user.id ? await getNotificationPreviewUseCase(session.user.id, 3) : null,
    };
  });
