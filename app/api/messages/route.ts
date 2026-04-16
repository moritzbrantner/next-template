import * as z from 'zod';

import { sendDirectMessageUseCase } from '@/src/domain/messages/use-cases';
import { problem, ProblemError } from '@/src/http/errors';
import { createApiRoute } from '@/src/http/route';

const sendDirectMessageSchema = z.object({
  targetUserId: z.string().min(1),
  body: z.string().max(2000),
});

function mapDirectMessageProblem(code: 'VALIDATION_ERROR' | 'NOT_FOUND' | 'FORBIDDEN', detail: string) {
  const status = code === 'NOT_FOUND' ? 404 : code === 'FORBIDDEN' ? 403 : 400;
  return new ProblemError(problem('/problems/direct-messages', 'Unable to send direct message', status, detail));
}

export const POST = createApiRoute({
  action: 'messages.send',
  auth: true,
  featureKey: 'messages.direct',
  bodySchema: sendDirectMessageSchema,
  async handler({ actorId, body }) {
    const result = await sendDirectMessageUseCase(actorId!, body);

    if (!result.ok) {
      throw mapDirectMessageProblem(result.error.code, result.error.message);
    }

    return result.data;
  },
});
