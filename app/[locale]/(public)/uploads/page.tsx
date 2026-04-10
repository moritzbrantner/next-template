import { redirect } from 'next/navigation';

import { withLocalePath } from '@/i18n/routing';
import { resolveLocale } from '@/src/server/page-guards';

export default async function UploadsRedirectPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);

  redirect(withLocalePath('/examples/uploads', locale));
}
