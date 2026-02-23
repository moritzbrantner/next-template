import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

import type { ValidatedImageUpload } from '@/src/profile/image-validation';

export type StoredProfileImage = {
  key: string;
  url: string;
};

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getClient() {
  return new S3Client({
    region: process.env.PROFILE_IMAGE_STORAGE_REGION ?? 'auto',
    endpoint: process.env.PROFILE_IMAGE_STORAGE_ENDPOINT,
    forcePathStyle: process.env.PROFILE_IMAGE_STORAGE_FORCE_PATH_STYLE === 'true',
    credentials: {
      accessKeyId: requireEnv('PROFILE_IMAGE_STORAGE_ACCESS_KEY_ID'),
      secretAccessKey: requireEnv('PROFILE_IMAGE_STORAGE_SECRET_ACCESS_KEY'),
    },
  });
}

function getBucket() {
  return requireEnv('PROFILE_IMAGE_STORAGE_BUCKET');
}

function getPublicBaseUrl() {
  const raw = process.env.PROFILE_IMAGE_PUBLIC_BASE_URL;
  if (!raw) {
    return null;
  }

  return raw.endsWith('/') ? raw.slice(0, -1) : raw;
}

function extensionForMime(mimeType: string) {
  if (mimeType === 'image/png') {
    return 'png';
  }

  if (mimeType === 'image/jpeg') {
    return 'jpg';
  }

  return 'bin';
}

export function buildProfileImageUrl(keyOrUrl: string | null | undefined) {
  if (!keyOrUrl) {
    return null;
  }

  if (keyOrUrl.startsWith('http://') || keyOrUrl.startsWith('https://')) {
    return keyOrUrl;
  }

  const baseUrl = getPublicBaseUrl();
  return baseUrl ? `${baseUrl}/${keyOrUrl}` : keyOrUrl;
}

export async function uploadProfileImage(userId: string, image: ValidatedImageUpload): Promise<StoredProfileImage> {
  const key = `profile-images/${userId}/${Date.now()}-${crypto.randomUUID()}.${extensionForMime(image.mimeType)}`;

  await getClient().send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: image.bytes,
      ContentType: image.mimeType,
      CacheControl: 'public, max-age=31536000, immutable',
      Metadata: {
        userId,
        width: String(image.width),
        height: String(image.height),
      },
    }),
  );

  return {
    key,
    url: buildProfileImageUrl(key) ?? key,
  };
}

export async function deleteProfileImage(keyOrUrl: string | null | undefined) {
  if (!keyOrUrl) {
    return;
  }

  const baseUrl = getPublicBaseUrl();
  const key = baseUrl ? keyOrUrl.replace(`${baseUrl}/`, '') : keyOrUrl;

  await getClient().send(
    new DeleteObjectCommand({
      Bucket: getBucket(),
      Key: key,
    }),
  );
}
