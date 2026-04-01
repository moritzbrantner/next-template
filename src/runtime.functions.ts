import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';

import { parseThemeFromCookieHeader } from '@/lib/theme';
import { getAuthSession } from '@/src/auth.server';

export const loadAppContext = createServerFn({ method: 'GET' }).handler(async () => {
  const request = getRequest();

  return {
    session: await getAuthSession(),
    theme: parseThemeFromCookieHeader(request.headers.get('cookie')),
  };
});
