import { redirect } from 'next/navigation';

import { routing, withLocalePath } from '@/i18n/routing';

export default function AboutRedirectPage() {
  redirect(withLocalePath('/about', routing.defaultLocale));
}
