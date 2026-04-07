import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';

import { parseThemeFromCookieHeader } from '@/lib/theme';
import { recordPageVisit, shouldTrackPageVisit, type PageVisitTrackingCause } from '@/src/analytics/page-visits';
import { getAuthSession } from '@/src/auth.server';
import { getNotificationPreviewUseCase } from '@/src/domain/notifications/use-cases';
import { parseAppSettingsFromCookieHeader } from '@/src/settings/preferences';

type LoadAppContextInput = {
  href?: string;
  cause?: PageVisitTrackingCause;
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
    const request = getRequest();
    const cookieHeader = request.headers.get('cookie');
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
      theme: parseThemeFromCookieHeader(cookieHeader),
      settings: parseAppSettingsFromCookieHeader(cookieHeader),
    };
  });
