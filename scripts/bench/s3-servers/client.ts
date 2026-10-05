import { S3Client } from '@aws-sdk/client-s3';

export type S3Target = {
  /** S3 API endpoint reachable from the host, e.g. http://127.0.0.1:19000 */
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
};

/**
 * Same client shape as src/profile/object-storage.ts: path-style addressing,
 * static credentials, explicit endpoint.
 */
export function createClient(target: S3Target, maxSockets = 16) {
  return new S3Client({
    region: target.region,
    endpoint: target.endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId: target.accessKeyId,
      secretAccessKey: target.secretAccessKey,
    },
    maxAttempts: 1,
    requestHandler: {
      httpAgent: { maxSockets, keepAlive: true },
      requestTimeout: 120_000,
    },
  });
}

export async function drain(body: unknown) {
  if (!body) {
    return 0;
  }

  const bytes = await (
    body as { transformToByteArray: () => Promise<Uint8Array> }
  ).transformToByteArray();
  return bytes.byteLength;
}
