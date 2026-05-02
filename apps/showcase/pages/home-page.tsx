import type { AppLocale } from '@moritzbrantner/app-pack';

import type { AppLocale as RoutingLocale } from '@/i18n/routing';
import { LocalizedLink } from '@/i18n/server-link';
import { createTranslator } from '@/src/i18n/messages';

const linkButtonBaseClassName =
  'inline-flex h-10 items-center justify-center whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-zinc-50';
const primaryLinkClassName = `${linkButtonBaseClassName} bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200`;
const ghostLinkClassName = `${linkButtonBaseClassName} hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50`;

export default async function HomePage({ locale }: { locale: AppLocale }) {
  const t = createTranslator(locale, 'HomePage');
  const routingLocale = locale as RoutingLocale;

  return (
    <section className="space-y-8">
      <div className="rounded-[2rem] border border-zinc-200 bg-zinc-50 p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-zinc-500 dark:text-zinc-400">
            {t('eyebrow')}
          </p>
          <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            {t('title')}
          </h1>
          <p className="max-w-3xl text-base leading-7 text-zinc-700 dark:text-zinc-300">
            {t('description')}
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <LocalizedLink
            href="/examples/forms"
            locale={routingLocale}
            prefetch={false}
            className={primaryLinkClassName}
          >
            {t('visitForm')}
          </LocalizedLink>
          <LocalizedLink
            href="/examples/story"
            locale={routingLocale}
            prefetch={false}
            className={ghostLinkClassName}
          >
            {t('visitStory')}
          </LocalizedLink>
          <LocalizedLink
            href="/examples/communication"
            locale={routingLocale}
            prefetch={false}
            className={ghostLinkClassName}
          >
            {t('visitCommunication')}
          </LocalizedLink>
        </div>
      </div>

      <div className="grid gap-4 [content-visibility:auto] [contain-intrinsic-size:28rem] md:grid-cols-3">
        {(['foundation', 'interaction', 'delivery'] as const).map((section) => (
          <article
            key={section}
            className="rounded-[1.75rem] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
              {t(`sections.${section}.title`)}
            </h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              {t(`sections.${section}.description`)}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
