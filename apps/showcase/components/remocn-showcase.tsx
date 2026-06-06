import type { CSSProperties, ReactNode } from 'react';

import { RemocnPlayerPreview } from '@/apps/showcase/components/remocn-player-preview';
import type { TerminalLine } from '@/src/components/remocn/terminal-simulator';

const docsUrl = 'https://www.remocn.dev/docs/components';
const installUrl = 'https://www.remocn.dev/docs/getting-started/installation';
const installCommand =
  'bunx shadcn@latest add @remocn/blur-reveal @remocn/matrix-decode @remocn/spotlight-card @remocn/terminal-simulator';
const buttonClassName =
  'inline-flex min-h-10 min-w-10 items-center justify-center whitespace-nowrap rounded-[var(--ui-button-radius,var(--ui-radius-control))] px-[var(--ui-button-padding-x-md,var(--ui-control-padding-x-md))] py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-[var(--ui-focus-ring-width)] focus-visible:ring-ring/50';
const primaryButtonClassName = `${buttonClassName} bg-primary text-primary-foreground shadow-[var(--ui-shadow-interactive)] hover:bg-primary/90`;
const outlineButtonClassName = `${buttonClassName} border bg-background shadow-[var(--ui-shadow-interactive)] hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50`;

const terminalLines: TerminalLine[] = [
  {
    text: 'bunx shadcn@latest add @remocn/terminal-simulator',
    type: 'command',
    delay: 0,
  },
  { text: 'Checking registry...', type: 'log', delay: 8, pause: 12 },
  { text: 'Installing remotion peer dependencies...', type: 'log', delay: 6 },
  {
    text: 'Creating src/components/remocn/terminal-simulator.tsx',
    type: 'success',
    delay: 10,
  },
  {
    text: 'Embedding the component with @remotion/player',
    type: 'success',
    delay: 10,
  },
  { text: 'Showcase ready.', type: 'success', delay: 8 },
];

type PreviewCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
};

type PillVariant = 'solid' | 'outline' | 'secondary';

type CardCopy = {
  eyebrow: string;
  title: string;
  description: string;
};

export type RemocnShowcaseCopy = {
  eyebrow: string;
  subeyebrow: string;
  title: string;
  description: string;
  supportingCopy: string;
  actions: {
    catalog: string;
    installation: string;
  };
  stats: {
    components: string;
    registryFlow: string;
    browserPreview: string;
  };
  cards: {
    terminal: CardCopy;
    blur: CardCopy;
    matrix: CardCopy;
    spotlight: CardCopy;
  };
  install: {
    title: string;
    description: string;
  };
  integration: {
    title: string;
    pointOne: string;
    pointTwo: string;
    pointThree: string;
  };
};

const terminalLineColors: Record<TerminalLine['type'], string> = {
  command: 'text-zinc-50',
  log: 'text-zinc-400',
  success: 'text-emerald-400',
  error: 'text-red-400',
};

function Pill({
  children,
  variant = 'secondary',
  className,
}: {
  children: ReactNode;
  variant?: PillVariant;
  className?: string;
}) {
  const variantClassNames: Record<PillVariant, string> = {
    solid: 'bg-zinc-950 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950',
    outline:
      'border border-zinc-400/60 bg-white/60 text-zinc-700 dark:bg-zinc-950/40 dark:text-zinc-200',
    secondary: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100',
  };

  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        variantClassNames[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </span>
  );
}

function PreviewCard({
  eyebrow,
  title,
  description,
  children,
  className,
}: PreviewCardProps) {
  return (
    <article
      className={[
        'overflow-hidden rounded-[1.75rem] border border-zinc-200/80 bg-white/90 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.7)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex items-start justify-between gap-4 border-b border-zinc-200/80 px-5 py-4 dark:border-zinc-800">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500 dark:text-zinc-400">
            {eyebrow}
          </p>
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              {title}
            </h2>
            <p className="mt-1 max-w-xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              {description}
            </p>
          </div>
        </div>
      </div>
      {children}
    </article>
  );
}

function TerminalMock({
  title,
  lines,
  fontSize = 17,
}: {
  title: string;
  lines: TerminalLine[];
  fontSize?: number;
}) {
  return (
    <div className="flex size-full items-center justify-center bg-[#050505] p-6">
      <div className="flex h-[72%] w-[82%] flex-col overflow-hidden rounded-xl bg-[#0a0a0a] font-mono shadow-[0_30px_80px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.06)]">
        <div className="flex h-10 items-center gap-2 border-b border-white/10 bg-[#1a1a1a] px-4">
          <span className="size-3 rounded-full bg-[#ff5f57]/85" />
          <span className="size-3 rounded-full bg-[#febc2e]/85" />
          <span className="size-3 rounded-full bg-[#28c840]/85" />
          <span className="min-w-0 flex-1 truncate text-center text-[13px] text-zinc-500">
            {title}
          </span>
        </div>
        <div
          className="min-w-0 flex-1 space-y-2 overflow-hidden p-5"
          style={
            {
              '--terminal-font-size': `${fontSize}px`,
            } as CSSProperties
          }
        >
          {lines.map((line) => (
            <div
              key={`${line.type}-${line.text}`}
              className={[
                'flex min-w-0 items-center whitespace-pre text-[length:var(--terminal-font-size)] leading-[1.6]',
                terminalLineColors[line.type],
              ].join(' ')}
            >
              {line.type === 'command' && (
                <span className="mr-2 shrink-0 text-emerald-400">$</span>
              )}
              <span className="min-w-0 overflow-hidden text-ellipsis">
                {line.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function RemocnShowcase({ copy }: { copy: RemocnShowcaseCopy }) {
  const stats = [
    { value: '4', label: copy.stats.components },
    { value: '1', label: copy.stats.registryFlow },
    { value: '100%', label: copy.stats.browserPreview },
  ];

  const importedComponents = [
    'BlurReveal',
    'MatrixDecode',
    'SpotlightCard',
    'TerminalSimulator',
  ];

  return (
    <section className="space-y-8">
      <div className="relative overflow-hidden rounded-[2rem] border border-zinc-200 bg-[linear-gradient(135deg,#f8fafc_0%,#fff7ed_35%,#ecfeff_100%)] p-6 shadow-[0_32px_120px_-64px_rgba(15,23,42,0.75)] dark:border-zinc-800 dark:bg-[linear-gradient(135deg,#09090b_0%,#111827_38%,#0f172a_100%)] md:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.22),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(34,211,238,0.2),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.16),transparent_28%)]" />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,540px)] lg:items-center">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <Pill variant="solid">{copy.eyebrow}</Pill>
              <Pill variant="outline">{copy.subeyebrow}</Pill>
            </div>

            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 md:text-5xl">
                {copy.title}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-zinc-700 dark:text-zinc-300 md:text-lg">
                {copy.description}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href={docsUrl}
                target="_blank"
                rel="noreferrer"
                className={primaryButtonClassName}
              >
                {copy.actions.catalog}
              </a>
              <a
                href={installUrl}
                target="_blank"
                rel="noreferrer"
                className={outlineButtonClassName}
              >
                {copy.actions.installation}
              </a>
            </div>

            <p className="max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              {copy.supportingCopy}
            </p>
          </div>

          <div className="overflow-hidden rounded-[1.75rem] border border-zinc-200/80 bg-zinc-950/95 p-3 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.75)] dark:border-zinc-700/80">
            <div className="aspect-[16/11] overflow-hidden rounded-[1.25rem]">
              <TerminalMock
                title="~/projects/remocn-showcase"
                lines={terminalLines}
                fontSize={17}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-[1.5rem] border border-zinc-200 bg-white px-5 py-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            <p className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              {stat.value}
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <PreviewCard
            eyebrow={copy.cards.terminal.eyebrow}
            title={copy.cards.terminal.title}
            description={copy.cards.terminal.description}
          >
            <div className="aspect-[16/10] overflow-hidden bg-zinc-950">
              <RemocnPlayerPreview
                variant="terminal"
                terminalLines={terminalLines}
              />
            </div>
          </PreviewCard>

          <div className="grid gap-6 lg:grid-cols-2">
            <PreviewCard
              eyebrow={copy.cards.blur.eyebrow}
              title={copy.cards.blur.title}
              description={copy.cards.blur.description}
            >
              <div className="aspect-[4/3] overflow-hidden bg-white">
                <RemocnPlayerPreview variant="blur" />
              </div>
            </PreviewCard>

            <PreviewCard
              eyebrow={copy.cards.matrix.eyebrow}
              title={copy.cards.matrix.title}
              description={copy.cards.matrix.description}
            >
              <div className="aspect-[4/3] overflow-hidden bg-white">
                <RemocnPlayerPreview variant="matrix" />
              </div>
            </PreviewCard>
          </div>

          <PreviewCard
            eyebrow={copy.cards.spotlight.eyebrow}
            title={copy.cards.spotlight.title}
            description={copy.cards.spotlight.description}
          >
            <div className="aspect-[16/9] overflow-hidden bg-zinc-950">
              <RemocnPlayerPreview variant="spotlight" />
            </div>
          </PreviewCard>
        </div>

        <aside className="space-y-6">
          <div className="rounded-[1.75rem] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500 dark:text-zinc-400">
              {copy.install.title}
            </p>
            <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              {copy.install.description}
            </p>
            <pre className="mt-4 overflow-x-auto rounded-2xl bg-zinc-950 p-4 text-xs leading-6 text-zinc-100">
              <code>{installCommand}</code>
            </pre>
            <div className="mt-4 flex flex-wrap gap-2">
              {importedComponents.map((componentName) => (
                <Pill key={componentName}>{componentName}</Pill>
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500 dark:text-zinc-400">
              {copy.integration.title}
            </p>
            <div className="mt-3 space-y-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              <p>{copy.integration.pointOne}</p>
              <p>{copy.integration.pointTwo}</p>
              <p>{copy.integration.pointThree}</p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
