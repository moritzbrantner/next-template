import { randomUUID } from 'node:crypto';

import { and, eq, inArray, isNull } from 'drizzle-orm';

import { getDb } from '@/src/db/client';
import { directMessageConversations, directMessages } from '@/src/db/schema';
import { failure, success, type ServiceResult } from '@/src/domain/shared/result';
import { buildProfileImageUrl } from '@/src/profile/object-storage';
import { normalizeProfileTagInput, validateProfileTag } from '@/src/profile/tags';

const MESSAGE_BODY_MAX_LENGTH = 2000;
const MESSAGE_PREVIEW_MAX_LENGTH = 120;

type DirectMessageUserRecord = {
  id: string;
  email: string | null;
  tag: string;
  name: string | null;
  image: string | null;
};

type DirectMessageConversationRecord = {
  id: string;
  participantOneId: string;
  participantTwoId: string;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

type DirectMessageRecord = {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  body: string;
  readAt: Date | null;
  createdAt: Date;
};

type BlockRelationshipState = {
  isBlockedByViewer: boolean;
  hasBlockedViewer: boolean;
};

export type DirectMessageError = {
  code: 'VALIDATION_ERROR' | 'NOT_FOUND' | 'FORBIDDEN';
  message: string;
};

export type DirectMessageParticipant = {
  userId: string;
  tag: string;
  displayName: string;
  imageUrl: string | null;
};

export type DirectMessageConversationSummary = {
  conversationId: string;
  participant: DirectMessageParticipant;
  lastMessageSnippet: string;
  lastMessageAt: string;
  unreadCount: number;
};

export type DirectMessageItem = {
  id: string;
  senderId: string;
  senderDisplayName: string;
  body: string;
  createdAt: string;
  isOwnMessage: boolean;
};

export type DirectMessageThread = {
  conversationId: string;
  participant: DirectMessageParticipant;
  messages: DirectMessageItem[];
};

export type DirectMessagesPageData = {
  conversations: DirectMessageConversationSummary[];
  selectedConversation: DirectMessageThread | null;
  composeTarget: DirectMessageParticipant | null;
  targetError: string | null;
};

export type SendDirectMessageInput = {
  targetUserId: string;
  body: string;
};

export type SendDirectMessagePayload = {
  conversation: DirectMessageConversationSummary;
  message: DirectMessageItem;
  participant: DirectMessageParticipant;
};

export type DirectMessageUseCaseDeps = {
  findUserById: (userId: string) => Promise<DirectMessageUserRecord | undefined>;
  findUserByTag: (tag: string) => Promise<DirectMessageUserRecord | undefined>;
  findUsersByIds: (userIds: string[]) => Promise<DirectMessageUserRecord[]>;
  getBlockRelationshipState: (viewerUserId: string, otherUserId: string) => Promise<BlockRelationshipState>;
  listConversationsForUser: (userId: string) => Promise<DirectMessageConversationRecord[]>;
  findConversationBetweenUsers: (firstUserId: string, secondUserId: string) => Promise<DirectMessageConversationRecord | undefined>;
  createConversation: (participantOneId: string, participantTwoId: string) => Promise<DirectMessageConversationRecord>;
  listMessagesForConversation: (conversationId: string) => Promise<DirectMessageRecord[]>;
  listLatestMessagesForConversations: (conversationIds: string[]) => Promise<DirectMessageRecord[]>;
  listUnreadConversationCounts: (userId: string, conversationIds: string[]) => Promise<Map<string, number>>;
  markConversationRead: (conversationId: string, recipientId: string) => Promise<void>;
  createMessage: (input: {
    conversationId: string;
    senderId: string;
    recipientId: string;
    body: string;
  }) => Promise<DirectMessageRecord>;
  touchConversation: (conversationId: string, lastMessageAt: Date) => Promise<void>;
};

function getDirectMessageUseCaseDeps(): DirectMessageUseCaseDeps {
  return {
    findUserById: (userId) =>
      getDb().query.users.findFirst({
        where: (table, { eq: innerEq }) => innerEq(table.id, userId),
      }),
    findUserByTag: (tag) =>
      getDb().query.users.findFirst({
        where: (table, { eq: innerEq }) => innerEq(table.tag, tag),
      }),
    findUsersByIds: async (userIds) => {
      if (userIds.length === 0) {
        return [];
      }

      return getDb().query.users.findMany({
        where: (table, { inArray: innerInArray }) => innerInArray(table.id, userIds),
      });
    },
    getBlockRelationshipState: async (viewerUserId, otherUserId) => {
      const [isBlockedByViewer, hasBlockedViewer] = await Promise.all([
        getDb().query.userBlocks.findFirst({
          where: (table, { and: innerAnd, eq: innerEq }) =>
            innerAnd(innerEq(table.blockerId, viewerUserId), innerEq(table.blockedId, otherUserId)),
        }),
        getDb().query.userBlocks.findFirst({
          where: (table, { and: innerAnd, eq: innerEq }) =>
            innerAnd(innerEq(table.blockerId, otherUserId), innerEq(table.blockedId, viewerUserId)),
        }),
      ]);

      return {
        isBlockedByViewer: Boolean(isBlockedByViewer),
        hasBlockedViewer: Boolean(hasBlockedViewer),
      };
    },
    listConversationsForUser: (userId) =>
      getDb().query.directMessageConversations.findMany({
        where: (table, { eq: innerEq, or: innerOr }) =>
          innerOr(innerEq(table.participantOneId, userId), innerEq(table.participantTwoId, userId)),
        orderBy: (table, { desc: innerDesc }) => [innerDesc(table.lastMessageAt)],
      }),
    findConversationBetweenUsers: (firstUserId, secondUserId) => {
      const [participantOneId, participantTwoId] = canonicalizeConversationPair(firstUserId, secondUserId);

      return getDb().query.directMessageConversations.findFirst({
        where: (table, { and: innerAnd, eq: innerEq }) =>
          innerAnd(
            innerEq(table.participantOneId, participantOneId),
            innerEq(table.participantTwoId, participantTwoId),
          ),
      });
    },
    createConversation: async (participantOneId, participantTwoId) => {
      const [firstId, secondId] = canonicalizeConversationPair(participantOneId, participantTwoId);

      await getDb()
        .insert(directMessageConversations)
        .values({
          id: randomUUID(),
          participantOneId: firstId,
          participantTwoId: secondId,
        })
        .onConflictDoNothing();

      const conversation = await getDb().query.directMessageConversations.findFirst({
        where: (table, { and: innerAnd, eq: innerEq }) =>
          innerAnd(innerEq(table.participantOneId, firstId), innerEq(table.participantTwoId, secondId)),
      });

      if (!conversation) {
        throw new Error('Unable to create direct message conversation.');
      }

      return conversation;
    },
    listMessagesForConversation: (conversationId) =>
      getDb().query.directMessages.findMany({
        where: (table, { eq: innerEq }) => innerEq(table.conversationId, conversationId),
        orderBy: (table, { asc: innerAsc }) => [innerAsc(table.createdAt)],
      }),
    listLatestMessagesForConversations: async (conversationIds) => {
      if (conversationIds.length === 0) {
        return [];
      }

      return getDb().query.directMessages.findMany({
        where: (table, { inArray: innerInArray }) => innerInArray(table.conversationId, conversationIds),
        orderBy: (table, { desc: innerDesc }) => [innerDesc(table.createdAt)],
      });
    },
    listUnreadConversationCounts: async (userId, conversationIds) => {
      if (conversationIds.length === 0) {
        return new Map<string, number>();
      }

      const rows = await getDb()
        .select({
          conversationId: directMessages.conversationId,
          id: directMessages.id,
        })
        .from(directMessages)
        .where(
          and(
            eq(directMessages.recipientId, userId),
            isNull(directMessages.readAt),
            inArray(directMessages.conversationId, conversationIds),
          ),
        );

      const counts = new Map<string, number>();

      for (const row of rows) {
        counts.set(row.conversationId, (counts.get(row.conversationId) ?? 0) + 1);
      }

      return counts;
    },
    markConversationRead: async (conversationId, recipientId) => {
      await getDb()
        .update(directMessages)
        .set({
          readAt: new Date(),
        })
        .where(
          and(
            eq(directMessages.conversationId, conversationId),
            eq(directMessages.recipientId, recipientId),
            isNull(directMessages.readAt),
          ),
        );
    },
    createMessage: async ({ conversationId, senderId, recipientId, body }) => {
      const [message] = await getDb()
        .insert(directMessages)
        .values({
          id: randomUUID(),
          conversationId,
          senderId,
          recipientId,
          body,
        })
        .returning();

      if (!message) {
        throw new Error('Unable to create direct message.');
      }

      return message;
    },
    touchConversation: async (conversationId, lastMessageAt) => {
      await getDb()
        .update(directMessageConversations)
        .set({
          lastMessageAt,
          updatedAt: new Date(),
        })
        .where(eq(directMessageConversations.id, conversationId));
    },
  };
}

function canonicalizeConversationPair(firstUserId: string, secondUserId: string) {
  return firstUserId < secondUserId ? [firstUserId, secondUserId] as const : [secondUserId, firstUserId] as const;
}

function resolveDisplayName(user: Pick<DirectMessageUserRecord, 'name' | 'email'>) {
  const trimmedName = user.name?.trim();

  if (trimmedName) {
    return trimmedName;
  }

  const emailPrefix = user.email?.split('@')[0]?.trim();
  return emailPrefix || 'User';
}

function toParticipantSummary(user: DirectMessageUserRecord): DirectMessageParticipant {
  return {
    userId: user.id,
    tag: user.tag,
    displayName: resolveDisplayName(user),
    imageUrl: buildProfileImageUrl(user.image) ?? null,
  };
}

function getConversationParticipantId(conversation: DirectMessageConversationRecord, viewerUserId: string) {
  return conversation.participantOneId === viewerUserId ? conversation.participantTwoId : conversation.participantOneId;
}

function buildMessagePreview(body: string) {
  const normalized = body.replace(/\s+/g, ' ').trim();

  if (normalized.length <= MESSAGE_PREVIEW_MAX_LENGTH) {
    return normalized;
  }

  return `${normalized.slice(0, MESSAGE_PREVIEW_MAX_LENGTH - 1).trimEnd()}…`;
}

function toDirectMessageItem(input: {
  message: DirectMessageRecord;
  viewerUserId: string;
  senderDisplayName: string;
}): DirectMessageItem {
  return {
    id: input.message.id,
    senderId: input.message.senderId,
    senderDisplayName: input.senderDisplayName,
    body: input.message.body,
    createdAt: input.message.createdAt.toISOString(),
    isOwnMessage: input.message.senderId === input.viewerUserId,
  };
}

async function resolveMessageRecipient(
  viewerUserId: string,
  targetUserId: string,
  deps: DirectMessageUseCaseDeps,
): Promise<ServiceResult<DirectMessageUserRecord, DirectMessageError>> {
  if (viewerUserId === targetUserId) {
    return failure({
      code: 'VALIDATION_ERROR',
      message: 'You cannot message your own account.',
    });
  }

  const targetUser = await deps.findUserById(targetUserId);

  if (!targetUser) {
    return failure({
      code: 'NOT_FOUND',
      message: 'User account was not found.',
    });
  }

  const blockState = await deps.getBlockRelationshipState(viewerUserId, targetUser.id);

  if (blockState.isBlockedByViewer || blockState.hasBlockedViewer) {
    return failure({
      code: 'FORBIDDEN',
      message: 'You cannot message this user.',
    });
  }

  return success(targetUser);
}

export async function getDirectMessagesPageDataUseCase(
  viewerUserId: string,
  rawTargetTag?: string | null,
  deps: DirectMessageUseCaseDeps = getDirectMessageUseCaseDeps(),
): Promise<ServiceResult<DirectMessagesPageData, DirectMessageError>> {
  const viewer = await deps.findUserById(viewerUserId);

  if (!viewer) {
    return failure({
      code: 'NOT_FOUND',
      message: 'User account was not found.',
    });
  }

  const conversationRecords = await deps.listConversationsForUser(viewerUserId);
  const otherUserIds = Array.from(
    new Set(conversationRecords.map((conversation) => getConversationParticipantId(conversation, viewerUserId))),
  );
  const [participants, latestMessages, unreadCounts, blockEntries] = await Promise.all([
    deps.findUsersByIds(otherUserIds),
    deps.listLatestMessagesForConversations(conversationRecords.map((conversation) => conversation.id)),
    deps.listUnreadConversationCounts(viewerUserId, conversationRecords.map((conversation) => conversation.id)),
    Promise.all(
      otherUserIds.map(async (otherUserId) => {
        const state = await deps.getBlockRelationshipState(viewerUserId, otherUserId);
        return [otherUserId, state] as const;
      }),
    ),
  ]);

  const participantsById = new Map(participants.map((participant) => [participant.id, participant]));
  const latestMessageByConversationId = new Map<string, DirectMessageRecord>();
  const blockStatesByUserId = new Map(blockEntries);

  for (const message of latestMessages) {
    if (!latestMessageByConversationId.has(message.conversationId)) {
      latestMessageByConversationId.set(message.conversationId, message);
    }
  }

  let conversations = conversationRecords.flatMap<DirectMessageConversationSummary>((conversation) => {
    const otherUserId = getConversationParticipantId(conversation, viewerUserId);
    const participant = participantsById.get(otherUserId);
    const latestMessage = latestMessageByConversationId.get(conversation.id);
    const blockState = blockStatesByUserId.get(otherUserId);

    if (!participant || !latestMessage || !blockState || blockState.isBlockedByViewer || blockState.hasBlockedViewer) {
      return [];
    }

    return [
      {
        conversationId: conversation.id,
        participant: toParticipantSummary(participant),
        lastMessageSnippet: buildMessagePreview(latestMessage.body),
        lastMessageAt: latestMessage.createdAt.toISOString(),
        unreadCount: unreadCounts.get(conversation.id) ?? 0,
      },
    ];
  });

  let composeTarget: DirectMessageParticipant | null = null;
  let targetError: string | null = null;
  let selectedConversation: DirectMessageConversationSummary | null = conversations[0] ?? null;

  const normalizedTargetTag = rawTargetTag?.trim() ? normalizeProfileTagInput(rawTargetTag) : null;

  if (normalizedTargetTag) {
    const validTargetTag = validateProfileTag(normalizedTargetTag);

    if (!validTargetTag.ok) {
      targetError = 'Conversation target was not found.';
      selectedConversation = conversations[0] ?? null;
    } else {
      const targetUser = await deps.findUserByTag(normalizedTargetTag);

      if (!targetUser) {
        targetError = 'Conversation target was not found.';
        selectedConversation = conversations[0] ?? null;
      } else if (targetUser.id === viewerUserId) {
        targetError = 'Choose another user to start a conversation.';
        selectedConversation = conversations[0] ?? null;
      } else {
        const blockState = await deps.getBlockRelationshipState(viewerUserId, targetUser.id);

        if (blockState.isBlockedByViewer || blockState.hasBlockedViewer) {
          targetError = 'You cannot message this user.';
          selectedConversation = conversations[0] ?? null;
        } else {
          selectedConversation =
            conversations.find((conversation) => conversation.participant.userId === targetUser.id) ?? null;
          composeTarget = selectedConversation ? null : toParticipantSummary(targetUser);
        }
      }
    }
  }

  let selectedThread: DirectMessageThread | null = null;

  if (selectedConversation) {
    const threadMessages = await deps.listMessagesForConversation(selectedConversation.conversationId);
    const participant = participantsById.get(selectedConversation.participant.userId);

    if (!participant) {
      return success({
        conversations,
        selectedConversation: null,
        composeTarget,
        targetError,
      });
    }

    if (selectedConversation.unreadCount > 0) {
      await deps.markConversationRead(selectedConversation.conversationId, viewerUserId);
      conversations = conversations.map((conversation) =>
        conversation.conversationId === selectedConversation?.conversationId
          ? { ...conversation, unreadCount: 0 }
          : conversation,
      );
    }

    const participantSummary = toParticipantSummary(participant);
    const viewerDisplayName = resolveDisplayName(viewer);

    selectedThread = {
      conversationId: selectedConversation.conversationId,
      participant: participantSummary,
      messages: threadMessages.map((message) =>
        toDirectMessageItem({
          message,
          viewerUserId,
          senderDisplayName:
            message.senderId === viewerUserId ? viewerDisplayName : participantSummary.displayName,
        }),
      ),
    };
  }

  return success({
    conversations,
    selectedConversation: selectedThread,
    composeTarget,
    targetError,
  });
}

export async function sendDirectMessageUseCase(
  viewerUserId: string,
  input: SendDirectMessageInput,
  deps: DirectMessageUseCaseDeps = getDirectMessageUseCaseDeps(),
): Promise<ServiceResult<SendDirectMessagePayload, DirectMessageError>> {
  const body = input.body.trim();

  if (!body) {
    return failure({
      code: 'VALIDATION_ERROR',
      message: 'Message text is required.',
    });
  }

  if (body.length > MESSAGE_BODY_MAX_LENGTH) {
    return failure({
      code: 'VALIDATION_ERROR',
      message: `Message must be ${MESSAGE_BODY_MAX_LENGTH} characters or fewer.`,
    });
  }

  const sender = await deps.findUserById(viewerUserId);

  if (!sender) {
    return failure({
      code: 'NOT_FOUND',
      message: 'User account was not found.',
    });
  }

  const recipientResult = await resolveMessageRecipient(viewerUserId, input.targetUserId, deps);

  if (!recipientResult.ok) {
    return recipientResult;
  }

  const recipient = recipientResult.data;
  const conversation =
    (await deps.findConversationBetweenUsers(viewerUserId, recipient.id)) ??
    (await deps.createConversation(viewerUserId, recipient.id));
  const message = await deps.createMessage({
    conversationId: conversation.id,
    senderId: viewerUserId,
    recipientId: recipient.id,
    body,
  });

  await deps.touchConversation(conversation.id, message.createdAt);

  const participant = toParticipantSummary(recipient);

  return success({
    participant,
    conversation: {
      conversationId: conversation.id,
      participant,
      lastMessageSnippet: buildMessagePreview(message.body),
      lastMessageAt: message.createdAt.toISOString(),
      unreadCount: 0,
    },
    message: toDirectMessageItem({
      message,
      viewerUserId,
      senderDisplayName: resolveDisplayName(sender),
    }),
  });
}
