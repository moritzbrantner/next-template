'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

import type { TerminalLine } from '@/src/components/remocn/terminal-simulator';

export type RemocnPreviewVariant = 'terminal' | 'blur' | 'matrix' | 'spotlight';

export type RemocnPlayerPreviewProps = {
  variant: RemocnPreviewVariant;
  terminalLines?: TerminalLine[];
};

const RemocnLivePreview = dynamic(
  () =>
    import('@/apps/showcase/components/remocn-live-preview').then(
      (mod) => mod.RemocnLivePreview,
    ),
  {
    ssr: false,
  },
);

function usePreviewShouldLoad() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateReducedMotion = () => {
      setIsReducedMotion(
        mediaQuery.matches ||
          document.documentElement.dataset.motion === 'reduced',
      );
    };

    updateReducedMotion();
    mediaQuery.addEventListener('change', updateReducedMotion);

    return () => {
      mediaQuery.removeEventListener('change', updateReducedMotion);
    };
  }, []);

  useEffect(() => {
    if (hasUserInteracted) {
      return;
    }

    const markInteracted = () => {
      setHasUserInteracted(true);
    };

    window.addEventListener('scroll', markInteracted, { passive: true });
    window.addEventListener('wheel', markInteracted, { passive: true });
    window.addEventListener('touchstart', markInteracted, { passive: true });
    window.addEventListener('pointerdown', markInteracted, { passive: true });
    window.addEventListener('keydown', markInteracted);

    return () => {
      window.removeEventListener('scroll', markInteracted);
      window.removeEventListener('wheel', markInteracted);
      window.removeEventListener('touchstart', markInteracted);
      window.removeEventListener('pointerdown', markInteracted);
      window.removeEventListener('keydown', markInteracted);
    };
  }, [hasUserInteracted]);

  useEffect(() => {
    if (isReducedMotion || shouldLoad || !hasUserInteracted) {
      return;
    }

    const target = rootRef.current;

    if (!target) {
      return;
    }

    if (!('IntersectionObserver' in window)) {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '320px 0px' },
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [hasUserInteracted, isReducedMotion, shouldLoad]);

  return { rootRef, shouldLoad: shouldLoad && !isReducedMotion };
}

function TerminalPlaceholder({ lines }: { lines?: TerminalLine[] }) {
  return (
    <div className="flex size-full items-center justify-center bg-[#050505] p-6">
      <div className="flex h-[72%] w-[82%] flex-col overflow-hidden rounded-xl bg-[#0a0a0a] font-mono shadow-[0_30px_80px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.06)]">
        <div className="flex h-10 items-center gap-2 border-b border-white/10 bg-[#1a1a1a] px-4">
          <span className="size-3 rounded-full bg-[#ff5f57]/85" />
          <span className="size-3 rounded-full bg-[#febc2e]/85" />
          <span className="size-3 rounded-full bg-[#28c840]/85" />
          <span className="min-w-0 flex-1 truncate text-center text-[13px] text-zinc-500">
            ~/projects/remocn-showcase
          </span>
        </div>
        <div className="min-w-0 flex-1 space-y-2 overflow-hidden p-5">
          {(lines ?? []).map((line) => (
            <div
              key={`${line.type}-${line.text}`}
              className="flex min-w-0 items-center whitespace-pre text-[17px] leading-[1.6] text-zinc-400"
            >
              {line.type === 'command' && (
                <span className="mr-2 shrink-0 text-emerald-400">$</span>
              )}
              <span
                className={[
                  'min-w-0 overflow-hidden text-ellipsis',
                  line.type === 'success' ? 'text-emerald-400' : null,
                  line.type === 'command' ? 'text-zinc-50' : null,
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {line.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BlurPlaceholder() {
  return (
    <div className="flex size-full items-center justify-center bg-white">
      <span className="text-[clamp(3rem,12vw,8.625rem)] font-semibold text-zinc-900">
        remocn
      </span>
    </div>
  );
}

function MatrixPlaceholder() {
  return (
    <div className="flex size-full items-center justify-center bg-white">
      <span className="whitespace-pre text-center font-mono text-[clamp(1.75rem,6vw,5.125rem)] font-semibold tracking-[0.05em] text-green-600">
        REGISTRY READY
      </span>
    </div>
  );
}

function SpotlightPlaceholder() {
  return (
    <div className="flex size-full items-center justify-center bg-[#050505] p-8">
      <div className="flex h-[62%] w-[62%] min-w-[240px] flex-col justify-end rounded-2xl border border-white/15 bg-[#0a0a0a] p-9 shadow-[0_30px_80px_rgba(0,0,0,0.5)]">
        <p className="text-2xl font-bold text-zinc-50">
          Render once, showcase anywhere
        </p>
        <p className="mt-3 max-w-sm text-base leading-6 text-zinc-500">
          These remocn primitives were pulled in with the CLI and mounted
          in-browser with @remotion/player.
        </p>
      </div>
    </div>
  );
}

function RemocnPreviewPlaceholder({
  variant,
  terminalLines,
}: RemocnPlayerPreviewProps) {
  switch (variant) {
    case 'terminal':
      return <TerminalPlaceholder lines={terminalLines} />;
    case 'blur':
      return <BlurPlaceholder />;
    case 'matrix':
      return <MatrixPlaceholder />;
    case 'spotlight':
      return <SpotlightPlaceholder />;
  }
}

export function RemocnPlayerPreview(props: RemocnPlayerPreviewProps) {
  const { rootRef, shouldLoad } = usePreviewShouldLoad();

  return (
    <div ref={rootRef} className="relative size-full">
      {shouldLoad ? <RemocnLivePreview {...props} /> : null}
      <div
        className={[
          'absolute inset-0 transition-opacity duration-300',
          shouldLoad ? 'pointer-events-none opacity-0' : 'opacity-100',
        ].join(' ')}
      >
        <RemocnPreviewPlaceholder {...props} />
      </div>
    </div>
  );
}
