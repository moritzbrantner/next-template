import { Link } from '@/i18n/navigation';

export function SiteAnnouncementBanner({
  announcement,
}: {
  announcement: {
    id: string;
    title: string;
    body: string;
    href: string | null;
  };
}) {
  const content = (
    <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <p className="font-semibold">{announcement.title}</p>
      <p className="mt-1">{announcement.body}</p>
    </div>
  );

  if (!announcement.href) {
    return content;
  }

  return (
    <Link href={announcement.href} className="block">
      {content}
    </Link>
  );
}
