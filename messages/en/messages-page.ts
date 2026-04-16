export const messagesPage = {
  title: 'Messages',
  description: 'Open a private conversation with another member and keep replies in one thread.',
  list: {
    title: 'Inbox',
    description: 'Recent one-to-one conversations.',
    empty: 'No conversations yet. Start one from a profile or the people directory.',
    unread: '{count} unread',
  },
  thread: {
    title: 'Conversation',
    emptyTitle: 'Choose a conversation',
    emptyDescription: 'Open an existing thread or start a new one from the people directory.',
    emptyAction: 'Browse people',
    startTitle: 'Start the conversation',
    startDescription: 'Send the first message to {name}.',
    viewProfile: 'View profile',
  },
  composer: {
    label: 'Message',
    placeholder: 'Write a message…',
    send: 'Send message',
    sending: 'Sending…',
    helper: 'Messages stay visible to both participants in this thread.',
    error: 'Unable to send your message right now. Please try again.',
  },
};
