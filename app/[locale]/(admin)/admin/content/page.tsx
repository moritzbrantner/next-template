import { revalidatePath } from 'next/cache';

import { AdminPageShell } from '@/components/admin/admin-page-shell';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createTranslator } from '@/src/i18n/messages';
import { enqueueJob } from '@/src/jobs/service';
import { resolveLocale } from '@/src/server/page-guards';
import { deleteAnnouncement, listAnnouncements, saveAnnouncement } from '@/src/site-config/service';

async function upsertAnnouncement(formData: FormData) {
  'use server';

  const locale = String(formData.get('locale') ?? 'en');
  const id = String(formData.get('id') ?? '') || undefined;
  const status = String(formData.get('status') ?? 'draft') as 'draft' | 'scheduled' | 'published' | 'archived';
  const publishAtRaw = String(formData.get('publishAt') ?? '').trim();
  const unpublishAtRaw = String(formData.get('unpublishAt') ?? '').trim();
  const publishAt = publishAtRaw ? new Date(publishAtRaw) : null;
  const announcementId = await saveAnnouncement({
    id,
    locale: locale as 'en' | 'de',
    title: String(formData.get('title') ?? ''),
    body: String(formData.get('body') ?? ''),
    href: String(formData.get('href') ?? '') || undefined,
    status,
    publishAt,
    unpublishAt: unpublishAtRaw ? new Date(unpublishAtRaw) : null,
  });

  if (status === 'scheduled' && publishAt) {
    await enqueueJob('publishAnnouncement', { announcementId }, { runAt: publishAt });
  }

  revalidatePath(`/${locale}/admin/content`);
}

async function removeAnnouncement(formData: FormData) {
  'use server';

  const locale = String(formData.get('locale') ?? 'en');
  await deleteAnnouncement(String(formData.get('id')));
  revalidatePath(`/${locale}/admin/content`);
}

export default async function AdminContentPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const t = createTranslator(locale, 'AdminPage');
  const announcements = await listAnnouncements(locale);

  return (
    <AdminPageShell title={t('content.title')} description={t('content.description')}>
      <Card>
        <CardHeader>
          <CardTitle>Create announcement</CardTitle>
          <CardDescription>Announcements are localized, schedulable, and rendered in the public shell.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={upsertAnnouncement} className="grid gap-3">
            <input type="hidden" name="locale" value={locale} />
            <input name="title" placeholder="Scheduled maintenance tonight" className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
            <textarea name="body" placeholder="Short operational update for customers." rows={4} className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
            <input name="href" placeholder="/status" className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
            <div className="grid gap-3 md:grid-cols-3">
              <select name="status" className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900">
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
              <input type="datetime-local" name="publishAt" className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
              <input type="datetime-local" name="unpublishAt" className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
            </div>
            <button type="submit" className="w-fit rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-950">
              Save announcement
            </button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing announcements</CardTitle>
          <CardDescription>Publish, schedule, or archive operational content without changing repo-managed MDX.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {announcements.map((announcement) => (
            <div key={announcement.id} className="rounded-2xl border p-4 dark:border-zinc-800">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{announcement.title}</p>
                <Badge variant="outline">{announcement.status}</Badge>
                <Badge variant="secondary">{announcement.locale}</Badge>
              </div>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{announcement.body}</p>
              <p className="mt-2 text-xs text-zinc-500">
                {announcement.publishAt ? `Publish: ${new Date(announcement.publishAt).toLocaleString(locale)}` : 'Publish immediately'}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <form action={removeAnnouncement}>
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="id" value={announcement.id} />
                  <button type="submit" className="rounded-full border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700">
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}
