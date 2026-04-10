import { redirect } from 'next/navigation';

import { StaticRedirectPage } from '@/components/static-redirect-page';
import { withLocalePath } from '@/i18n/routing';
import { isGithubPagesBuild } from '@/src/runtime/build-target';
import { resolveLocale } from '@/src/server/page-guards';

export default async function StoryRedirectPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);

  if (isGithubPagesBuild) {
    return <StaticRedirectPage href="../examples/story/" />;
  }

  redirect(withLocalePath('/examples/story', locale));
}
