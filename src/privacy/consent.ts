import { cookies } from 'next/headers';

export const CONSENT_COOKIE_NAME = 'site-consent';
export const REDACTED_QUERY_VALUE = '[REDACTED]';
export const TRACKED_QUERY_ALLOWLIST = new Set(['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref']);
export const ALWAYS_REDACT_QUERY_KEYS = [/token/i, /^code$/i, /^state$/i, /email/i, /invite/i, /secret/i, /password/i];

export type ConsentState = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
};

export const defaultConsentState: ConsentState = {
  necessary: true,
  analytics: false,
  marketing: false,
};

export function serializeConsentState(state: ConsentState) {
  return encodeURIComponent(JSON.stringify(state));
}

export function parseConsentCookie(value?: string | null): ConsentState {
  if (!value) {
    return defaultConsentState;
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as Partial<ConsentState>;

    return {
      necessary: true,
      analytics: parsed.analytics === true,
      marketing: parsed.marketing === true,
    };
  } catch {
    return defaultConsentState;
  }
}

export async function getConsentState() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(CONSENT_COOKIE_NAME);

  return {
    hasExplicitChoice: Boolean(cookie),
    state: parseConsentCookie(cookie?.value),
  };
}

function shouldRedactQueryKey(key: string) {
  return ALWAYS_REDACT_QUERY_KEYS.some((pattern) => pattern.test(key)) || !TRACKED_QUERY_ALLOWLIST.has(key);
}

export function sanitizeTrackedQueryParameters(searchParams: URLSearchParams) {
  return Array.from(searchParams.entries()).map(([key, value], position) => ({
    key,
    value: shouldRedactQueryKey(key) ? REDACTED_QUERY_VALUE : value,
    position,
  }));
}
