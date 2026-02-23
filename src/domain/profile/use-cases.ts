import { eq } from 'drizzle-orm';

import { getDb } from '@/src/db/client';
import { users } from '@/src/db/schema';
import { failure, success, type ServiceResult } from '@/src/domain/shared/result';
import { ImageValidationError, validateAndEncodeImage } from '@/src/profile/image-validation';

const DISPLAY_NAME_MIN_LENGTH = 2;
const DISPLAY_NAME_MAX_LENGTH = 60;

export type ProfileError = {
  code: 'VALIDATION_ERROR' | 'NOT_FOUND' | 'FORBIDDEN' | 'CONFLICT';
  message: string;
};

export type UpdateDisplayNamePayload = {
  displayName: string;
};

export type UpdateProfileImagePayload = {
  imageDataUrl: string;
};

export async function updateDisplayNameUseCase(
  userId: string,
  rawDisplayName: string,
): Promise<ServiceResult<UpdateDisplayNamePayload, ProfileError>> {
  const displayName = rawDisplayName.trim();

  if (displayName.length < DISPLAY_NAME_MIN_LENGTH) {
    return failure({
      code: 'VALIDATION_ERROR',
      message: `Display name must be at least ${DISPLAY_NAME_MIN_LENGTH} characters.`,
    });
  }

  if (displayName.length > DISPLAY_NAME_MAX_LENGTH) {
    return failure({
      code: 'VALIDATION_ERROR',
      message: `Display name must be ${DISPLAY_NAME_MAX_LENGTH} characters or fewer.`,
    });
  }

  const existingUser = await getDb().query.users.findFirst({
    where: (table, { eq }) => eq(table.id, userId),
  });

  if (!existingUser) {
    return failure({
      code: 'NOT_FOUND',
      message: 'User account was not found.',
    });
  }

  await getDb()
    .update(users)
    .set({ name: displayName, updatedAt: new Date() })
    .where(eq(users.id, userId));

  return success({
    displayName,
  });
}

export async function updateProfileImageUseCase(
  userId: string,
  file: File,
): Promise<ServiceResult<UpdateProfileImagePayload, ProfileError>> {
  const existingUser = await getDb().query.users.findFirst({
    where: (table, { eq }) => eq(table.id, userId),
  });

  if (!existingUser) {
    return failure({
      code: 'NOT_FOUND',
      message: 'User account was not found.',
    });
  }

  let dataUrl: string;
  try {
    const encoded = await validateAndEncodeImage(file);
    dataUrl = encoded.dataUrl;
  } catch (error) {
    if (error instanceof ImageValidationError) {
      return failure({
        code: 'VALIDATION_ERROR',
        message: error.message,
      });
    }

    throw error;
  }

  await getDb()
    .update(users)
    .set({ image: dataUrl, updatedAt: new Date() })
    .where(eq(users.id, userId));

  return success({
    imageDataUrl: dataUrl,
  });
}

export async function removeProfileImageUseCase(userId: string): Promise<ServiceResult<{ removed: true }, ProfileError>> {
  const existingUser = await getDb().query.users.findFirst({
    where: (table, { eq }) => eq(table.id, userId),
  });

  if (!existingUser) {
    return failure({
      code: 'NOT_FOUND',
      message: 'User account was not found.',
    });
  }

  await getDb()
    .update(users)
    .set({ image: null, updatedAt: new Date() })
    .where(eq(users.id, userId));

  return success({ removed: true });
}
