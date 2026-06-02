import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { AdminAnnouncementForm } from '@/components/admin/admin-announcement-form';
import { AdminNotificationComposer } from '@/components/admin/admin-notification-composer';
import { AdminOverviewGrid } from '@/components/admin/admin-overview-grid';
import { I18nProvider } from '@/src/i18n';
import { adminPage } from '@/messages/en/admin-page';

const meta = {
  title: 'Admin/Components',
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <I18nProvider locale="en" messages={{ AdminPage: adminPage }}>
        <Story />
      </I18nProvider>
    ),
  ],
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

async function saveAnnouncementStoryAction() {
  return {};
}

export const OverviewCards: Story = {
  render: () => (
    <AdminOverviewGrid
      pages={[
        {
          key: 'users',
          href: '/admin/users',
          title: adminPage.navigation.users,
          description: adminPage.users.description,
        },
        {
          key: 'reports',
          href: '/admin/reports',
          title: adminPage.navigation.reports,
          description: adminPage.reports.description,
        },
        {
          key: 'content',
          href: '/admin/content',
          title: adminPage.navigation.content,
          description: adminPage.content.description,
        },
        {
          key: 'systemSettings',
          href: '/admin/system-settings',
          title: adminPage.navigation.systemSettings,
          description: 'Review feature flags, analytics windows, and roles.',
        },
      ]}
    />
  ),
};

export const AnnouncementForm: Story = {
  render: () => (
    <div className="max-w-3xl">
      <AdminAnnouncementForm
        mode="create"
        cancelHref="/admin/content"
        action={saveAnnouncementStoryAction}
        initialValues={{
          locale: 'en',
          title: 'Scheduled maintenance',
          body: 'The admin workspace will be unavailable for a short maintenance window.',
          href: '/status',
          status: 'scheduled',
          publishAt: '2026-06-12T08:00',
          unpublishAt: '2026-06-12T12:00',
        }}
      />
    </div>
  ),
};

export const NotificationComposer: Story = {
  render: () => (
    <div className="max-w-2xl">
      <AdminNotificationComposer
        allowedAudiences={['role', 'all']}
        initialAudience="role"
        initialTargetRole="MANAGER"
      />
    </div>
  ),
};
