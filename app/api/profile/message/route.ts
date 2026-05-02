import * as z from 'zod';

import { sendProfileMessageUseCase } from '@/src/domain/profile/use-cases';
import { problem, ProblemError } from '@/src/http/errors';
import { createApiRoute } from '@/src/http/route';

const messageBodySchema = z.object({
  userId: z.string().min(1),
  message: z.string().min(1).max(500),
});

function mapMessageProblem(
  code: 'NOT_FOUND' | 'VALIDATION_ERROR' | 'FORBIDDEN' | 'CONFLICT',
  detail: string,
) {
  const status =
    code === 'NOT_FOUND'
      ? 404
      : code === 'FORBIDDEN'
        ? 403
        : code === 'CONFLICT'
          ? 409
          : 400;
  return new ProblemError(
    problem(
      '/problems/profile-message',
      'Unable to send profile message',
      status,
      detail,
    ),
  );
}

export const POST = createApiRoute({
  action: 'profile.message',
  featureKey: 'profiles.follow',
  auth: true,
  permission: 'profile.follow',
  bodySchema: messageBodySchema,
  async handler({ actorId, body }) {
    const result = await sendProfileMessageUseCase(
      actorId!,
      body.userId,
      body.message,
    );

    if (!result.ok) {
      throw mapMessageProblem(result.error.code, result.error.message);
    }

    return {
      ok: true,
      notificationId: result.data.notificationId,
    };
  },
});
