export const notificationsPage = {
  fallbackUser: 'there',
  badge: 'Signed-in updates',
  title: 'Notifications',
  description: 'A simple inbox for {name}. Keep track of security events, workspace updates, and scheduled digests.',
  summary: {
    unread: {
      label: 'Unread',
      value: '3',
      hint: 'Everything new since your last session is grouped here.',
    },
    today: {
      label: 'Today',
      value: '2',
      hint: 'Fresh activity from your account and workspace over the last few hours.',
    },
    preferences: {
      label: 'Delivery',
      value: 'Email + in-app',
      hint: 'Use settings to switch between instant alerts and quieter digests.',
    },
  },
  feed: {
    title: 'Recent activity',
    description: 'These sample notifications show the kinds of updates a signed-in user would see.',
    items: {
      security: {
        statusKey: 'unread',
        status: 'Unread',
        time: '2 min ago',
        title: 'New sign-in detected',
        body: 'Your account was accessed from a new browser session. If this was you, no action is needed.',
      },
      workspace: {
        statusKey: 'upcoming',
        status: 'Scheduled',
        time: 'Today at 16:00',
        title: 'Workspace changes queued',
        body: 'A small batch of content and form updates is ready to be published to your shared workspace.',
      },
      digest: {
        statusKey: 'read',
        status: 'Read',
        time: 'Yesterday',
        title: 'Weekly digest sent',
        body: 'Your latest digest was delivered with profile changes, uploads, and recent communication highlights.',
      },
    },
  },
  actions: {
    title: 'Quick actions',
    description: 'Jump directly to the areas most often connected to account notifications.',
    profile: 'Open profile',
    settings: 'Notification settings',
  },
  preferences: {
    title: 'Delivery preferences',
    description: 'Use this page as a lightweight notification center while your full preference controls live in settings.',
    email: 'Email alerts stay enabled for security and account-recovery events.',
    push: 'In-app notices are ideal for workspace activity that does not require immediate attention.',
    digest: 'Weekly digests help reduce noise while still summarizing changes worth reviewing.',
  },
};
