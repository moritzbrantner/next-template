import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';

import { parseThemeFromCookieHeader } from '@/lib/theme';
import { getAuthSession } from '@/src/auth.server';
import { parseAppSettingsFromCookieHeader } from '@/src/settings/preferences';

export const loadAppContext = createServerFn({ method: 'GET' }).handler(async () => {
  const request = getRequest();
  const cookieHeader = request.headers.get('cookie');

  return {
    session: await getAuthSession(),
    theme: parseThemeFromCookieHeader(cookieHeader),
    settings: parseAppSettingsFromCookieHeader(cookieHeader),
  };
});
