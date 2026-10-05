import {
  CreateBucketCommand,
  DeleteBucketCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';

import { createClient, type S3Target } from './client';

export type CompatCheck = {
  name: string;
  ok: boolean;
  detail?: string;
};

export type CompatOptions = {
  target: S3Target;
  /** URL the app would put into <img src>, i.e. PROFILE_IMAGE_PUBLIC_BASE_URL. */
  publicBaseUrl: string;
  /** true: PutBucketPolicy (like `mc anonymous set download`). */
  publicReadViaPolicy: boolean;
  /** Out-of-band public-read grant for servers without bucket policies. */
  grantPublicRead?: () => void;
};

function describeError(error: unknown) {
  if (error && typeof error === 'object') {
    const named = error as { name?: string; message?: string };
    return `${named.name ?? 'Error'}: ${named.message ?? ''}`.slice(0, 200);
  }

  return String(error);
}

async function check(
  checks: CompatCheck[],
  name: string,
  fn: () => Promise<string | void>,
) {
  try {
    const detail = await fn();
    checks.push({ name, ok: true, ...(detail ? { detail } : {}) });
  } catch (error) {
    checks.push({ name, ok: false, detail: describeError(error) });
  }
}

export function publicReadPolicy(bucket: string) {
  // Equivalent of `mc anonymous set download local/<bucket>` in docker-compose.yml.
  return JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: { AWS: ['*'] },
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${bucket}/*`],
      },
    ],
  });
}

/**
 * Runs against a fresh bucket and exercises exactly what next-template does with object storage:
 * - docker-compose bucket bootstrap (`mc mb --ignore-existing`, `mc anonymous set download`)
 * - src/profile/object-storage.ts PutObject (ContentType, CacheControl,
 *   ContentDisposition, user metadata) and DeleteObject
 * - browsers loading the object anonymously from PROFILE_IMAGE_PUBLIC_BASE_URL
 * The app does not use presigned URLs, multipart uploads or listing.
 */
export async function runCompat(options: CompatOptions) {
  const { target } = options;
  const client = createClient(target, 4);
  const checks: CompatCheck[] = [];
  const key = `profile-images/compat-user/${Date.now()}-compat.png`;
  const body = new Uint8Array(256 * 1024);
  for (let index = 0; index < body.length; index += 1) {
    body[index] = (index * 31) % 251;
  }

  await check(checks, 'create bucket', async () => {
    await client.send(new CreateBucketCommand({ Bucket: target.bucket }));
  });

  await check(
    checks,
    'create bucket again (idempotent bootstrap)',
    async () => {
      try {
        await client.send(new CreateBucketCommand({ Bucket: target.bucket }));
        return 'created without error';
      } catch (error) {
        const name = (error as { name?: string }).name;
        if (
          name === 'BucketAlreadyOwnedByYou' ||
          name === 'BucketAlreadyExists'
        ) {
          return name;
        }

        throw error;
      }
    },
  );

  await check(checks, 'put object with app headers + metadata', async () => {
    await client.send(
      new PutObjectCommand({
        Bucket: target.bucket,
        Key: key,
        Body: body,
        ContentType: 'image/png',
        CacheControl: 'public, max-age=31536000, immutable',
        ContentDisposition: 'inline; filename="compat.png"',
        Metadata: { userId: 'compat-user', width: '128', height: '128' },
      }),
    );
  });

  await check(checks, 'head object returns metadata', async () => {
    const head = await client.send(
      new HeadObjectCommand({ Bucket: target.bucket, Key: key }),
    );
    const userId = head.Metadata?.userid ?? head.Metadata?.userId;
    if (userId !== 'compat-user') {
      throw new Error(`metadata userId=${String(userId)}`);
    }
    if (head.ContentLength !== body.length) {
      throw new Error(`ContentLength=${String(head.ContentLength)}`);
    }
  });

  const publicUrl = `${options.publicBaseUrl.replace(/\/$/u, '')}/${key}`;
  const pathStyleUrl = `${target.endpoint}/${target.bucket}/${key}`;

  await check(
    checks,
    'bucket is private before public-read grant',
    async () => {
      const response = await fetch(pathStyleUrl);
      if (response.ok) {
        throw new Error('anonymous GET succeeded before any grant');
      }
      return `HTTP ${response.status}`;
    },
  );

  await check(checks, 'put public-read bucket policy', async () => {
    await client.send(
      new PutBucketPolicyCommand({
        Bucket: target.bucket,
        Policy: publicReadPolicy(target.bucket),
      }),
    );
  });

  if (!options.publicReadViaPolicy) {
    await check(checks, 'out-of-band public-read grant', async () => {
      options.grantPublicRead?.();
      return 'server-specific setup instead of a bucket policy';
    });
  }

  await check(
    checks,
    'anonymous GET via path-style S3 URL (current .env default)',
    async () => {
      const response = await fetch(pathStyleUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
    },
  );

  await check(checks, 'anonymous GET via public base URL', async () => {
    const response = await fetch(publicUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for ${publicUrl}`);
    }
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.length !== body.length || bytes[1000] !== body[1000]) {
      throw new Error('body mismatch');
    }
    const problems: string[] = [];
    if (response.headers.get('content-type') !== 'image/png') {
      problems.push(`content-type=${response.headers.get('content-type')}`);
    }
    if (
      response.headers.get('cache-control') !==
      'public, max-age=31536000, immutable'
    ) {
      problems.push(`cache-control=${response.headers.get('cache-control')}`);
    }
    if (problems.length > 0) {
      throw new Error(problems.join('; '));
    }
  });

  await check(checks, 'anonymous write is rejected', async () => {
    const response = await fetch(
      `${target.endpoint}/${target.bucket}/anonymous-write-probe.txt`,
      { method: 'PUT', body: 'nope' },
    );
    if (response.ok) {
      throw new Error(`anonymous PUT succeeded (HTTP ${response.status})`);
    }
    return `HTTP ${response.status}`;
  });

  await check(checks, 'delete object', async () => {
    await client.send(
      new DeleteObjectCommand({ Bucket: target.bucket, Key: key }),
    );
    const response = await fetch(publicUrl);
    if (response.status !== 404 && response.status !== 403) {
      throw new Error(`public GET after delete returned ${response.status}`);
    }
    return `public GET after delete: HTTP ${response.status}`;
  });

  await check(checks, 'delete missing object is not an error', async () => {
    await client.send(
      new DeleteObjectCommand({
        Bucket: target.bucket,
        Key: 'profile-images/does-not-exist.png',
      }),
    );
  });

  await check(checks, 'delete bucket', async () => {
    await client.send(new DeleteBucketCommand({ Bucket: target.bucket }));
  });

  client.destroy();
  return checks;
}
