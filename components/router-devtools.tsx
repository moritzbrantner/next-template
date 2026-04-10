import { Suspense, lazy } from 'react';

const TanStackRouterDevtools = import.meta.env.DEV
  ? lazy(() =>
      import('@tanstack/react-router-devtools').then((module) => ({
        default: module.TanStackRouterDevtools,
      })),
    )
  : null;

export function RouterDevtools() {
  if (!TanStackRouterDevtools) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <TanStackRouterDevtools position="bottom-right" />
    </Suspense>
  );
}
