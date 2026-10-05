import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { randomFillSync } from 'node:crypto';
import { performance } from 'node:perf_hooks';

import { createClient, drain, type S3Target } from './client';

export type PhaseResult = {
  phase: string;
  ops: number;
  errors: number;
  firstError?: string;
  concurrency: number;
  bytes: number;
  wallMs: number;
  opsPerSec: number;
  mibPerSec: number;
  p50Ms: number;
  p99Ms: number;
};

export type WorkloadConfig = {
  small4k: number;
  medium256k: number;
  large64m: number;
  smallConcurrency: number;
  largeConcurrency: number;
  listRepeats: number;
};

export const DEFAULT_WORKLOAD: WorkloadConfig = {
  small4k: 2000,
  medium256k: 400,
  large64m: 8,
  smallConcurrency: 8,
  largeConcurrency: 4,
  listRepeats: 20,
};

export function percentile(values: number[], p: number) {
  if (values.length === 0) {
    return Number.NaN;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1),
  );
  return sorted[index];
}

/** Incompressible payload so servers that compress do not get a free ride. */
function payload(size: number) {
  return randomFillSync(new Uint8Array(size));
}

async function runPhase(
  phase: string,
  count: number,
  concurrency: number,
  bytesPerOp: number,
  op: (index: number) => Promise<void>,
): Promise<PhaseResult> {
  const latencies: number[] = [];
  let errors = 0;
  let firstError: string | undefined;
  let next = 0;
  const started = performance.now();

  async function worker() {
    while (next < count) {
      const index = next;
      next += 1;
      const opStarted = performance.now();
      try {
        await op(index);
        latencies.push(performance.now() - opStarted);
      } catch (error) {
        errors += 1;
        firstError ??= String((error as Error).message ?? error).slice(0, 200);
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  const wallMs = performance.now() - started;
  const ok = latencies.length;

  return {
    phase,
    ops: ok,
    errors,
    ...(firstError ? { firstError } : {}),
    concurrency,
    bytes: ok * bytesPerOp,
    wallMs: round(wallMs),
    opsPerSec: round((ok / wallMs) * 1000),
    mibPerSec: round((ok * bytesPerOp) / (1024 * 1024) / (wallMs / 1000)),
    p50Ms: round(percentile(latencies, 50)),
    p99Ms: round(percentile(latencies, 99)),
  };
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

/**
 * PUT/GET for 4 KiB, 256 KiB (profile-image sized) and 64 MiB objects, then
 * LIST (full ListObjectsV2 pagination over the 4 KiB prefix) and DELETE.
 */
export async function runWorkload(
  target: S3Target,
  config: WorkloadConfig = DEFAULT_WORKLOAD,
) {
  const client = createClient(
    target,
    Math.max(config.smallConcurrency, config.largeConcurrency),
  );
  const results: PhaseResult[] = [];
  const bucket = target.bucket;

  // Warm-up so connection setup and lazy server allocation are not measured.
  const warm = payload(4096);
  await runPhase('warmup', 64, config.smallConcurrency, 4096, async (i) => {
    await client.send(
      new PutObjectCommand({ Bucket: bucket, Key: `warmup/${i}`, Body: warm }),
    );
  });

  const sizes = [
    { label: '4KiB', size: 4096, count: config.small4k, c: 'small' },
    { label: '256KiB', size: 256 * 1024, count: config.medium256k, c: 'small' },
    {
      label: '64MiB',
      size: 64 * 1024 * 1024,
      count: config.large64m,
      c: 'large',
    },
  ] as const;

  for (const { label, size, count, c } of sizes) {
    const concurrency =
      c === 'small' ? config.smallConcurrency : config.largeConcurrency;
    const body = payload(size);
    const prefix = `bench-${label}/`;

    results.push(
      await runPhase(`put ${label}`, count, concurrency, size, async (i) => {
        await client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: `${prefix}${String(i).padStart(6, '0')}`,
            Body: body,
            ContentType: 'application/octet-stream',
          }),
        );
      }),
    );

    results.push(
      await runPhase(`get ${label}`, count, concurrency, size, async (i) => {
        const response = await client.send(
          new GetObjectCommand({
            Bucket: bucket,
            Key: `${prefix}${String(i).padStart(6, '0')}`,
          }),
        );
        const length = await drain(response.Body);
        if (length !== size) {
          throw new Error(`short read ${length}/${size}`);
        }
      }),
    );
  }

  results.push(
    await runPhase(
      `list ${config.small4k} keys`,
      config.listRepeats,
      1,
      0,
      async () => {
        let token: string | undefined;
        let seen = 0;
        do {
          const page = await client.send(
            new ListObjectsV2Command({
              Bucket: bucket,
              Prefix: 'bench-4KiB/',
              ContinuationToken: token,
            }),
          );
          seen += page.KeyCount ?? page.Contents?.length ?? 0;
          token = page.IsTruncated ? page.NextContinuationToken : undefined;
        } while (token);
        if (seen !== config.small4k) {
          throw new Error(`listed ${seen}/${config.small4k}`);
        }
      },
    ),
  );

  results.push(
    await runPhase(
      'delete 4KiB',
      config.small4k,
      config.smallConcurrency,
      0,
      async (i) => {
        await client.send(
          new DeleteObjectCommand({
            Bucket: bucket,
            Key: `bench-4KiB/${String(i).padStart(6, '0')}`,
          }),
        );
      },
    ),
  );

  // Unmeasured cleanup of the remaining prefixes.
  const leftovers = [
    ...Array.from({ length: 64 }, (_, i) => `warmup/${i}`),
    ...Array.from(
      { length: config.medium256k },
      (_, i) => `bench-256KiB/${String(i).padStart(6, '0')}`,
    ),
    ...Array.from(
      { length: config.large64m },
      (_, i) => `bench-64MiB/${String(i).padStart(6, '0')}`,
    ),
  ];
  await runPhase(
    'cleanup',
    leftovers.length,
    config.smallConcurrency,
    0,
    async (i) => {
      await client.send(
        new DeleteObjectCommand({ Bucket: bucket, Key: leftovers[i] }),
      );
    },
  );

  client.destroy();
  return results;
}
