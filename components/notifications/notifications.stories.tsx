import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { NotificationBell } from '@/components/notification-bell';
import { NotificationsFeedCard } from '@/components/notifications/notifications-feed-card';
import { I18nProvider } from '@/src/i18n';
import type { NotificationFeedItem } from '@/src/domain/notifications/use-cases';
import { navigationBar } from '@/messages/en/navigation-bar';
import { notificationsPage } from '@/messages/en/notifications-page';

const items = [
  {
    id: 'notification-1',
    title: 'Maintenance window scheduled',
    body: 'The admin workspace will be read-only during the deployment window.',
    href: '/admin/reports',
    status: 'unread',
    createdAt: '2026-06-02T09:30:00.000Z',
  },
  {
    id: 'notification-2',
    title: 'Profile image updated',
    body: 'Your new profile image passed validation and is now visible.',
    href: '/profile',
    status: 'read',
    createdAt: '2026-06-01T15:15:00.000Z',
  },
] satisfies NotificationFeedItem[];

const meta = {
  title: 'Notifications/Components',
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <I18nProvider
        locale="en"
        messages={{
          NavigationBar: navigationBar,
          NotificationsPage: notificationsPage,
        }}
      >
        <Story />
      </I18nProvider>
    ),
  ],
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Bell: Story = {
  render: () => (
    <div className="flex justify-end">
      <NotificationBell items={items} unreadCount={1} />
    </div>
  ),
};

export const FeedCard: Story = {
  render: () => (
    <NotificationsFeedCard
      items={items}
      unreadCount={1}
      totalCount={12}
      page={1}
      pageSize={10}
      totalPages={2}
      hasPreviousPage={false}
      hasNextPage
      previousHref="/notifications?page=1"
      nextHref="/notifications?page=2"
    />
  ),
};
