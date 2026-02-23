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
