import * as z from 'zod';

import {
  sendGroupMessageUseCase,
  type GroupError,
} from '@/src/domain/groups/use-cases';
import { problem, ProblemError } from '@/src/http/errors';
import { createApiRoute } from '@/src/http/route';

const groupMessageBodySchema = z.object({
  groupId: z.string().min(1),
  message: z.string().min(1).max(500),
});

function mapGroupMessageProblem(error: GroupError) {
  const status =
    error.code === 'NOT_FOUND'
      ? 404
      : error.code === 'FORBIDDEN'
        ? 403
        : error.code === 'CONFLICT'
          ? 409
          : 400;
  return new ProblemError(
    problem(
      '/problems/groups/messages',
      'Unable to send group message',
      status,
      error.message,
    ),
  );
}

export const POST = createApiRoute({
  action: 'groups.message',
  featureKey: 'groups',
  auth: true,
  bodySchema: groupMessageBodySchema,
  async handler({ actorId, body }) {
    const result = await sendGroupMessageUseCase(
      actorId!,
      body.groupId,
      body.message,
    );

    if (!result.ok) {
      throw mapGroupMessageProblem(result.error);
    }

    return {
      ok: true,
      message: result.data.message,
    };
  },
});
