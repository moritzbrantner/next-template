import type { AppLocale } from '@moritzbrantner/app-pack';

import { RemocnShowcase } from '@/apps/showcase/components/remocn-showcase';
import { createTranslator } from '@/src/i18n/messages';

export default function RemocnPage({ locale }: { locale: AppLocale }) {
  const t = createTranslator(locale, 'RemocnPage');

  return (
    <RemocnShowcase
      copy={{
        eyebrow: t('eyebrow'),
        subeyebrow: t('subeyebrow'),
        title: t('title'),
        description: t('description'),
        supportingCopy: t('supportingCopy'),
        actions: {
          catalog: t('actions.catalog'),
          installation: t('actions.installation'),
        },
        stats: {
          components: t('stats.components'),
          registryFlow: t('stats.registryFlow'),
          browserPreview: t('stats.browserPreview'),
        },
        cards: {
          terminal: {
            eyebrow: t('cards.terminal.eyebrow'),
            title: t('cards.terminal.title'),
            description: t('cards.terminal.description'),
          },
          blur: {
            eyebrow: t('cards.blur.eyebrow'),
            title: t('cards.blur.title'),
            description: t('cards.blur.description'),
          },
          matrix: {
            eyebrow: t('cards.matrix.eyebrow'),
            title: t('cards.matrix.title'),
            description: t('cards.matrix.description'),
          },
          spotlight: {
            eyebrow: t('cards.spotlight.eyebrow'),
            title: t('cards.spotlight.title'),
            description: t('cards.spotlight.description'),
          },
        },
        install: {
          title: t('install.title'),
          description: t('install.description'),
        },
        integration: {
          title: t('integration.title'),
          pointOne: t('integration.pointOne'),
          pointTwo: t('integration.pointTwo'),
          pointThree: t('integration.pointThree'),
        },
      }}
    />
  );
}
