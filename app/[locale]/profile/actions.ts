'use server';

import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';

import { authOptions } from '@/src/auth';
import { getDb } from '@/src/db/client';
import { users } from '@/src/db/schema';
import { ImageValidationError, validateAndEncodeImage } from '@/src/profile/image-validation';

export type UpdateProfileImageState = {
  error?: string;
  success?: boolean;
};

export type UpdateDisplayNameState = {
  error?: string;
  success?: boolean;
};

const DISPLAY_NAME_MIN_LENGTH = 2;
const DISPLAY_NAME_MAX_LENGTH = 60;

export async function updateDisplayName(
  _previousState: UpdateDisplayNameState,
  formData: FormData,
): Promise<UpdateDisplayNameState> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return { error: 'You must be signed in to update your display name.' };
  }

  const rawDisplayName = formData.get('displayName');
  const displayName = typeof rawDisplayName === 'string' ? rawDisplayName.trim() : '';

  if (displayName.length < DISPLAY_NAME_MIN_LENGTH) {
    return { error: `Display name must be at least ${DISPLAY_NAME_MIN_LENGTH} characters.` };
  }

  if (displayName.length > DISPLAY_NAME_MAX_LENGTH) {
    return { error: `Display name must be ${DISPLAY_NAME_MAX_LENGTH} characters or fewer.` };
  }

  try {
    await getDb()
      .update(users)
      .set({ name: displayName, updatedAt: new Date() })
      .where(eq(users.id, userId));

    revalidatePath('/');
    revalidatePath('/[locale]', 'layout');
    revalidatePath('/[locale]/profile');

    return { success: true };
  } catch {
    return { error: 'Unable to update display name right now. Please try again.' };
  }
}

export async function updateProfileImage(
  _previousState: UpdateProfileImageState,
  formData: FormData,
): Promise<UpdateProfileImageState> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return { error: 'You must be signed in to update your profile picture.' };
  }

  const file = formData.get('image');

  if (!(file instanceof File)) {
    return { error: 'Please select an image file.' };
  }

  try {
    const { dataUrl } = await validateAndEncodeImage(file);

    await getDb()
      .update(users)
      .set({ image: dataUrl, updatedAt: new Date() })
      .where(eq(users.id, userId));

    revalidatePath('/');
    revalidatePath('/[locale]', 'layout');
    revalidatePath('/[locale]/profile');

    return { success: true };
  } catch (error) {
    if (error instanceof ImageValidationError) {
      return { error: error.message };
    }

    return { error: 'Unable to update profile picture right now. Please try again.' };
  }
}

export async function removeProfileImage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return;
  }

  await getDb()
    .update(users)
    .set({ image: null, updatedAt: new Date() })
    .where(eq(users.id, userId));

  revalidatePath('/');
  revalidatePath('/[locale]', 'layout');
  revalidatePath('/[locale]/profile');
}
