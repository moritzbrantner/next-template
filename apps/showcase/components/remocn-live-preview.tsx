'use client';

import { Player } from '@remotion/player';

import type { RemocnPlayerPreviewProps } from '@/apps/showcase/components/remocn-player-preview';
import { BlurReveal } from '@/src/components/remocn/blur-reveal';
import { MatrixDecode } from '@/src/components/remocn/matrix-decode';
import { SpotlightCard } from '@/src/components/remocn/spotlight-card';
import { TerminalSimulator } from '@/src/components/remocn/terminal-simulator';

const playerBaseProps = {
  fps: 30,
  controls: false,
  loop: true,
  autoPlay: true,
  clickToPlay: false,
  allowFullscreen: false,
  spaceKeyToPlayOrPause: false,
  initiallyMuted: true,
  acknowledgeRemotionLicense: true,
  noSuspense: true,
  style: { width: '100%', height: '100%' },
} as const;

export function RemocnLivePreview({
  variant,
  terminalLines,
}: RemocnPlayerPreviewProps) {
  switch (variant) {
    case 'terminal':
      return (
        <Player
          component={TerminalSimulator}
          inputProps={{
            title: '~/projects/remocn-showcase',
            lines: terminalLines,
            fontSize: 17,
            speed: 0.9,
          }}
          durationInFrames={180}
          compositionWidth={1280}
          compositionHeight={800}
          className="size-full"
          {...playerBaseProps}
        />
      );
    case 'blur':
      return (
        <Player
          component={BlurReveal}
          inputProps={{
            text: 'remocn',
            fontSize: 138,
            blur: 18,
            color: '#111827',
          }}
          durationInFrames={90}
          compositionWidth={1200}
          compositionHeight={900}
          className="size-full"
          {...playerBaseProps}
        />
      );
    case 'matrix':
      return (
        <Player
          component={MatrixDecode}
          inputProps={{
            text: 'REGISTRY READY',
            fontSize: 82,
            color: '#16a34a',
            revealDuration: 72,
          }}
          durationInFrames={96}
          compositionWidth={1200}
          compositionHeight={900}
          className="size-full"
          {...playerBaseProps}
        />
      );
    case 'spotlight':
      return (
        <Player
          component={SpotlightCard}
          inputProps={{
            title: 'Render once, showcase anywhere',
            body: 'These remocn primitives were pulled in with the CLI and mounted in-browser with @remotion/player.',
            cardWidth: 760,
            cardHeight: 420,
            glowOpacity: 0.12,
          }}
          durationInFrames={150}
          compositionWidth={1400}
          compositionHeight={820}
          className="size-full"
          {...playerBaseProps}
        />
      );
  }
}
