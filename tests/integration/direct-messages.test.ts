import { describe, expect, it, vi } from 'vitest';

import {
  getDirectMessagesPageDataUseCase,
  sendDirectMessageUseCase,
  type DirectMessageUseCaseDeps,
} from '@/src/domain/messages/use-cases';

function createDeps(overrides: Partial<DirectMessageUseCaseDeps> = {}): DirectMessageUseCaseDeps {
  return {
    findUserById: vi.fn(),
    findUserByTag: vi.fn(),
    findUsersByIds: vi.fn().mockResolvedValue([]),
    getBlockRelationshipState: vi.fn().mockResolvedValue({
      isBlockedByViewer: false,
      hasBlockedViewer: false,
    }),
    listConversationsForUser: vi.fn().mockResolvedValue([]),
    findConversationBetweenUsers: vi.fn().mockResolvedValue(undefined),
    createConversation: vi.fn().mockResolvedValue({
      id: 'conversation_1',
      participantOneId: 'user_1',
      participantTwoId: 'user_2',
      lastMessageAt: new Date('2026-04-16T09:00:00.000Z'),
      createdAt: new Date('2026-04-16T09:00:00.000Z'),
      updatedAt: new Date('2026-04-16T09:00:00.000Z'),
    }),
    listMessagesForConversation: vi.fn().mockResolvedValue([]),
    listLatestMessagesForConversations: vi.fn().mockResolvedValue([]),
    listUnreadConversationCounts: vi.fn().mockResolvedValue(new Map()),
    markConversationRead: vi.fn().mockResolvedValue(undefined),
    createMessage: vi.fn().mockResolvedValue({
      id: 'message_1',
      conversationId: 'conversation_1',
      senderId: 'user_1',
      recipientId: 'user_2',
      body: 'Hello there',
      readAt: null,
      createdAt: new Date('2026-04-16T09:05:00.000Z'),
    }),
    touchConversation: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('direct messages use cases', () => {
  it('creates a conversation and sends the first message', async () => {
    const deps = createDeps({
      findUserById: vi
        .fn()
        .mockResolvedValueOnce({
          id: 'user_1',
          email: 'sender@example.com',
          tag: 'sender',
          name: 'Sender',
          image: null,
        })
        .mockResolvedValueOnce({
          id: 'user_2',
          email: 'recipient@example.com',
          tag: 'recipient',
          name: 'Recipient',
          image: null,
        }),
    });

    const result = await sendDirectMessageUseCase(
      'user_1',
      {
        targetUserId: 'user_2',
        body: 'Hello there',
      },
      deps,
    );

    expect(result).toEqual({
      ok: true,
      data: {
        participant: {
          userId: 'user_2',
          tag: 'recipient',
          displayName: 'Recipient',
          imageUrl: null,
        },
        conversation: {
          conversationId: 'conversation_1',
          participant: {
            userId: 'user_2',
            tag: 'recipient',
            displayName: 'Recipient',
            imageUrl: null,
          },
          lastMessageSnippet: 'Hello there',
          lastMessageAt: '2026-04-16T09:05:00.000Z',
          unreadCount: 0,
        },
        message: {
          id: 'message_1',
          senderId: 'user_1',
          senderDisplayName: 'Sender',
          body: 'Hello there',
          createdAt: '2026-04-16T09:05:00.000Z',
          isOwnMessage: true,
        },
      },
    });
    expect(deps.createConversation).toHaveBeenCalledWith('user_1', 'user_2');
    expect(deps.touchConversation).toHaveBeenCalledWith('conversation_1', new Date('2026-04-16T09:05:00.000Z'));
  });

  it('rejects blocked recipients', async () => {
    const deps = createDeps({
      findUserById: vi
        .fn()
        .mockResolvedValueOnce({
          id: 'user_1',
          email: 'sender@example.com',
          tag: 'sender',
          name: 'Sender',
          image: null,
        })
        .mockResolvedValueOnce({
          id: 'user_2',
          email: 'recipient@example.com',
          tag: 'recipient',
          name: 'Recipient',
          image: null,
        }),
      getBlockRelationshipState: vi.fn().mockResolvedValue({
        isBlockedByViewer: false,
        hasBlockedViewer: true,
      }),
    });

    await expect(
      sendDirectMessageUseCase(
        'user_1',
        {
          targetUserId: 'user_2',
          body: 'Hello there',
        },
        deps,
      ),
    ).resolves.toEqual({
      ok: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You cannot message this user.',
      },
    });
    expect(deps.createConversation).not.toHaveBeenCalled();
    expect(deps.createMessage).not.toHaveBeenCalled();
  });

  it('loads the requested conversation and marks unread messages as read', async () => {
    const deps = createDeps({
      findUserById: vi.fn().mockResolvedValue({
        id: 'user_1',
        email: 'viewer@example.com',
        tag: 'viewer',
        name: 'Viewer',
        image: null,
      }),
      findUserByTag: vi.fn().mockResolvedValue({
        id: 'user_2',
        email: 'dana@example.com',
        tag: 'dana',
        name: 'Dana Diaz',
        image: null,
      }),
      findUsersByIds: vi.fn().mockResolvedValue([
        {
          id: 'user_2',
          email: 'dana@example.com',
          tag: 'dana',
          name: 'Dana Diaz',
          image: null,
        },
      ]),
      listConversationsForUser: vi.fn().mockResolvedValue([
        {
          id: 'conversation_1',
          participantOneId: 'user_1',
          participantTwoId: 'user_2',
          lastMessageAt: new Date('2026-04-16T09:05:00.000Z'),
          createdAt: new Date('2026-04-16T09:00:00.000Z'),
          updatedAt: new Date('2026-04-16T09:05:00.000Z'),
        },
      ]),
      listLatestMessagesForConversations: vi.fn().mockResolvedValue([
        {
          id: 'message_1',
          conversationId: 'conversation_1',
          senderId: 'user_2',
          recipientId: 'user_1',
          body: 'Hello there',
          readAt: null,
          createdAt: new Date('2026-04-16T09:05:00.000Z'),
        },
      ]),
      listUnreadConversationCounts: vi.fn().mockResolvedValue(new Map([['conversation_1', 1]])),
      listMessagesForConversation: vi.fn().mockResolvedValue([
        {
          id: 'message_1',
          conversationId: 'conversation_1',
          senderId: 'user_2',
          recipientId: 'user_1',
          body: 'Hello there',
          readAt: null,
          createdAt: new Date('2026-04-16T09:05:00.000Z'),
        },
      ]),
    });

    const result = await getDirectMessagesPageDataUseCase('user_1', '@dana', deps);

    expect(result).toEqual({
      ok: true,
      data: {
        conversations: [
          {
            conversationId: 'conversation_1',
            participant: {
              userId: 'user_2',
              tag: 'dana',
              displayName: 'Dana Diaz',
              imageUrl: null,
            },
            lastMessageSnippet: 'Hello there',
            lastMessageAt: '2026-04-16T09:05:00.000Z',
            unreadCount: 0,
          },
        ],
        selectedConversation: {
          conversationId: 'conversation_1',
          participant: {
            userId: 'user_2',
            tag: 'dana',
            displayName: 'Dana Diaz',
            imageUrl: null,
          },
          messages: [
            {
              id: 'message_1',
              senderId: 'user_2',
              senderDisplayName: 'Dana Diaz',
              body: 'Hello there',
              createdAt: '2026-04-16T09:05:00.000Z',
              isOwnMessage: false,
            },
          ],
        },
        composeTarget: null,
        targetError: null,
      },
    });
    expect(deps.markConversationRead).toHaveBeenCalledWith('conversation_1', 'user_1');
  });
});
