import { useEffect } from 'react';
import { useLocation } from '@tanstack/react-router';

const DUPLICATE_VISIT_WINDOW_MS = 1_000;

type TrackingWindow = Window & {
  __lastTrackedPageVisit?: {
    href: string;
    trackedAt: number;
  };
};

export function PageVisitTracker() {
  const href = useLocation({
    select: (location) => location.href,
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !href || href.startsWith('/api/')) {
      return;
    }

    const trackingWindow = window as TrackingWindow;
    const now = Date.now();
    const previousVisit = trackingWindow.__lastTrackedPageVisit;

    if (previousVisit && previousVisit.href === href && now - previousVisit.trackedAt < DUPLICATE_VISIT_WINDOW_MS) {
      return;
    }

    trackingWindow.__lastTrackedPageVisit = {
      href,
      trackedAt: now,
    };

    void fetch('/api/analytics/page-visits', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ href }),
      keepalive: true,
    }).catch(() => undefined);
  }, [href]);

  return null;
}
