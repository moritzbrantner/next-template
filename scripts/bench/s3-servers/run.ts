/**
 * S3-compatible server benchmark for replacing MinIO in docker-compose.yml.
 *
 *   bun scripts/bench/s3-servers/run.ts [--runs 3] [--servers seaweedfs,rustfs,garage] [--quick] [--out dir]
 *   bun scripts/bench/s3-servers/run.ts --from results/<date>/raw.json   # re-render summary.md
 *
 * Runs one server container at a time, rounds interleaved (A B C, A B C, ...),
 * each on a fresh named volume, and writes raw.json + summary.md.
 * See scripts/bench/s3-servers/README.md for methodology.
 */
import {
  CreateBucketCommand,
  GetObjectCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';

import { createClient, drain, type S3Target } from './client';
import { publicReadPolicy, runCompat, type CompatCheck } from './compat';
import {
  BUCKET,
  docker,
  DOCKER,
  EXCLUDED,
  HOST_PORTS,
  REGION,
  SERVERS,
  type ServerContext,
  type ServerDef,
} from './servers';
import {
  DEFAULT_WORKLOAD,
  percentile,
  runWorkload,
  type PhaseResult,
  type WorkloadConfig,
} from './workload';

type RunResult = {
  server: string;
  round: number;
  portUpMs: number;
  healthMs: number;
  bootstrapMs: number;
  usableMs: number;
  stopMs: number;
  idleRssMiB: number;
  peakRssMiB: number;
  phases: PhaseResult[];
  compat: CompatCheck[];
};

const benchDir = path.dirname(new URL(import.meta.url).pathname);

function parseArgs() {
  const args = process.argv.slice(2);
  const value = (flag: string) => {
    const index = args.indexOf(flag);
    return index >= 0 ? args[index + 1] : undefined;
  };
  const quick = args.includes('--quick');
  const runs = Number(value('--runs') ?? (quick ? 1 : 3));
  const ids = value('--servers')?.split(',') ?? SERVERS.map((s) => s.id);
  const servers = ids.map((id) => {
    const server = SERVERS.find((s) => s.id === id);
    if (!server) {
      throw new Error(`Unknown server ${id}`);
    }
    return server;
  });
  const out =
    value('--out') ??
    path.join(
      benchDir,
      'results',
      quick ? 'quick' : new Date().toISOString().slice(0, 10),
    );
  const workload: WorkloadConfig = quick
    ? {
        ...DEFAULT_WORKLOAD,
        small4k: 200,
        medium256k: 50,
        large64m: 2,
        listRepeats: 3,
      }
    : DEFAULT_WORKLOAD;
  return { runs, servers, out, workload, quick };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function waitFor(
  label: string,
  probe: () => Promise<boolean>,
  timeoutMs = 120_000,
  intervalMs = 50,
) {
  const deadline = performance.now() + timeoutMs;
  let lastError: unknown;
  while (performance.now() < deadline) {
    try {
      if (await probe()) {
        return;
      }
    } catch (error) {
      lastError = error;
    }
    await sleep(intervalMs);
  }
  throw new Error(`Timed out waiting for ${label}: ${String(lastError)}`);
}

async function retry<T>(fn: () => Promise<T>, timeoutMs = 60_000) {
  const deadline = performance.now() + timeoutMs;
  for (;;) {
    try {
      return await fn();
    } catch (error) {
      if (performance.now() > deadline) {
        throw error;
      }
      await sleep(100);
    }
  }
}

/** Sum of VmRSS / VmHWM (KiB) over the container's process tree, read from the host /proc. */
function processTreeMemory(rootPid: number) {
  let rss = 0;
  let hwm = 0;
  const stack = [rootPid];
  const seen = new Set<number>();
  while (stack.length > 0) {
    const pid = stack.pop() as number;
    if (seen.has(pid)) {
      continue;
    }
    seen.add(pid);
    try {
      const status = readFileSync(`/proc/${pid}/status`, 'utf8');
      rss += Number(/VmRSS:\s+(\d+)/u.exec(status)?.[1] ?? 0);
      hwm += Number(/VmHWM:\s+(\d+)/u.exec(status)?.[1] ?? 0);
      for (const tid of readdirSync(`/proc/${pid}/task`)) {
        const children = readFileSync(
          `/proc/${pid}/task/${tid}/children`,
          'utf8',
        )
          .trim()
          .split(/\s+/u)
          .filter(Boolean)
          .map(Number);
        stack.push(...children);
      }
    } catch {
      // Process exited between reads.
    }
  }
  return { rssKiB: rss, hwmKiB: hwm };
}

function containerPid(container: string) {
  const pid = Number(
    docker(['inspect', '--format', '{{.State.Pid}}', container]),
  );
  try {
    readFileSync(`/proc/${pid}/status`, 'utf8');
    return pid;
  } catch {
    throw new Error(
      `Container pid ${pid} is not visible in /proc; run the benchmark on the Docker/Podman host (not Docker Desktop).`,
    );
  }
}

function cleanup(ctx: ServerContext) {
  try {
    docker(['rm', '-f', '-t', '0', ctx.container], { quiet: true });
  } catch {}
  try {
    docker(['volume', 'rm', '-f', ctx.volume], { quiet: true });
  } catch {}
}

function imageSize(image: string) {
  try {
    return Number(docker(['image', 'inspect', '--format', '{{.Size}}', image]));
  } catch {
    docker(['pull', '-q', image]);
    return Number(docker(['image', 'inspect', '--format', '{{.Size}}', image]));
  }
}

async function runOne(
  server: ServerDef,
  round: number,
  workload: WorkloadConfig,
): Promise<RunResult> {
  const ctx: ServerContext = {
    container: `s3-bench-${server.id}`,
    volume: `s3-bench-${server.id}-data`,
    workDir: path.join(os.tmpdir(), 's3-bench', server.id),
  };
  cleanup(ctx);
  docker(['volume', 'create', ctx.volume], { quiet: true });

  const target: S3Target = {
    endpoint: `http://127.0.0.1:${HOST_PORTS.s3}`,
    region: REGION,
    bucket: BUCKET,
    ...server.credentials,
  };

  try {
    const ports = [
      '-p',
      `${HOST_PORTS.s3}:${server.s3ContainerPort}`,
      ...(server.extraPorts ?? []).flatMap(([host, container]) => [
        '-p',
        `${host}:${container}`,
      ]),
    ];
    const args = server
      .runArgs(ctx)
      .map((arg) => (arg === 'IMAGE' ? server.image : arg));

    const t0 = performance.now();
    docker(['run', '-d', '--name', ctx.container, ...ports, ...args], {
      quiet: true,
    });
    await waitFor('S3 port', async () => {
      await fetch(target.endpoint);
      return true;
    });
    const portUpMs = performance.now() - t0;

    const healthy = async () => (await fetch(server.healthUrl)).ok;
    if (!server.preBootstrap) {
      await waitFor('health endpoint', healthy);
    }
    const healthNonBootstrapMs = performance.now() - t0;

    // Bootstrap: what compose's create-bucket job does, plus a first write/read.
    const bootstrapStart = performance.now();
    server.preBootstrap?.(ctx);
    const client = createClient(target, 2);
    await retry(() =>
      client.send(new CreateBucketCommand({ Bucket: target.bucket })),
    );
    if (server.publicRead.viaBucketPolicy) {
      await retry(() =>
        client.send(
          new PutBucketPolicyCommand({
            Bucket: target.bucket,
            Policy: publicReadPolicy(target.bucket),
          }),
        ),
      );
    } else {
      server.postCreateBucket?.(ctx, target.bucket);
    }
    const probe = new Uint8Array(4096).fill(1);
    await retry(async () => {
      await client.send(
        new PutObjectCommand({
          Bucket: target.bucket,
          Key: 'bootstrap-probe',
          Body: probe,
        }),
      );
      const get = await client.send(
        new GetObjectCommand({ Bucket: target.bucket, Key: 'bootstrap-probe' }),
      );
      await drain(get.Body);
      const anon = await fetch(
        `${server.publicRead.publicBaseUrl(target.bucket)}/bootstrap-probe`,
      );
      if (!anon.ok) {
        throw new Error(`anonymous read HTTP ${anon.status}`);
      }
    });
    client.destroy();
    const bootstrapMs = performance.now() - bootstrapStart;
    const usableMs = performance.now() - t0;

    let healthMs = healthNonBootstrapMs;
    if (server.preBootstrap) {
      await waitFor('health endpoint', healthy);
      healthMs = performance.now() - t0;
    }

    const compatBucket = `${BUCKET}-compat`;
    const compat = await runCompat({
      target: { ...target, bucket: compatBucket },
      publicBaseUrl: server.publicRead.publicBaseUrl(compatBucket),
      publicReadViaPolicy: server.publicRead.viaBucketPolicy,
      grantPublicRead: () => server.postCreateBucket?.(ctx, compatBucket),
    });

    const pid = containerPid(ctx.container);
    await sleep(3000);
    const idle = processTreeMemory(pid);

    let peakRssKiB = idle.rssKiB;
    const sampler = setInterval(() => {
      peakRssKiB = Math.max(peakRssKiB, processTreeMemory(pid).rssKiB);
    }, 100);
    const phases = await runWorkload(target, workload);
    clearInterval(sampler);
    const after = processTreeMemory(pid);
    peakRssKiB = Math.max(peakRssKiB, after.rssKiB);

    const stopStart = performance.now();
    docker(['stop', '-t', '15', ctx.container], { quiet: true });
    const stopMs = performance.now() - stopStart;

    return {
      server: server.id,
      round,
      portUpMs: Math.round(portUpMs),
      healthMs: Math.round(healthMs),
      bootstrapMs: Math.round(bootstrapMs),
      usableMs: Math.round(usableMs),
      stopMs: Math.round(stopMs),
      idleRssMiB: Math.round(idle.rssKiB / 1024),
      peakRssMiB: Math.round(peakRssKiB / 1024),
      phases,
      compat,
    };
  } finally {
    cleanup(ctx);
  }
}

function machineContext() {
  const meminfo = readFileSync('/proc/meminfo', 'utf8');
  const sdkPackage = JSON.parse(
    readFileSync(
      path.resolve(
        benchDir,
        '../../../node_modules/@aws-sdk/client-s3/package.json',
      ),
      'utf8',
    ),
  ) as { version: string };
  let dockerVersion = 'unknown';
  try {
    dockerVersion = docker(['--version'], { quiet: true });
  } catch {}
  return {
    date: new Date().toISOString(),
    kernel: readFileSync('/proc/version', 'utf8').trim(),
    cpus: os.cpus().length,
    cpuModel: os.cpus()[0]?.model,
    memTotalGiB: Math.round((os.totalmem() / 1024 ** 3) * 10) / 10,
    memAvailableAtStartGiB:
      Math.round(
        (Number(/MemAvailable:\s+(\d+)/u.exec(meminfo)?.[1] ?? 0) / 1024 ** 2) *
          10,
      ) / 10,
    containerRuntime: `${DOCKER}: ${dockerVersion}`,
    client: `bun ${process.versions.bun ?? 'n/a'} / node-compat ${process.version}, @aws-sdk/client-s3 ${sdkPackage.version}`,
  };
}

const median = (values: number[]) => percentile(values, 50);

function fmt(value: number, digits = 0) {
  return Number.isFinite(value) ? value.toFixed(digits) : 'n/a';
}

function summarize(
  results: RunResult[],
  servers: ServerDef[],
  sizes: Record<string, number>,
  context: ReturnType<typeof machineContext>,
  workload: WorkloadConfig,
  runs: number,
) {
  const by = (id: string) => results.filter((r) => r.server === id);
  const header = `| Metric | ${servers.map((s) => s.name).join(' | ')} |`;
  const divider = `| --- | ${servers.map(() => '---:').join(' | ')} |`;
  const row = (label: string, pick: (runs: RunResult[]) => string) =>
    `| ${label} | ${servers.map((s) => pick(by(s.id))).join(' | ')} |`;
  const med =
    (fn: (r: RunResult) => number, digits = 0) =>
    (rs: RunResult[]) =>
      fmt(median(rs.map(fn)), digits);
  const phase = (name: string, field: keyof PhaseResult) => (r: RunResult) =>
    Number(r.phases.find((p) => p.phase === name)?.[field] ?? Number.NaN);
  const phaseNames = results[0]?.phases.map((p) => p.phase) ?? [];

  const lines = [
    `# S3 server benchmark results`,
    '',
    `Medians over ${runs} interleaved run(s) per server. Generated by \`bun scripts/bench/s3-servers/run.ts\`; raw per-run data in \`raw.json\`.`,
    '',
    '## Machine',
    '',
    ...Object.entries(context).map(([key, value]) => `- ${key}: ${value}`),
    `- workload: ${JSON.stringify(workload)}`,
    '',
    '## Startup and resources',
    '',
    header,
    divider,
    row('Image size (MiB)', (rs) =>
      fmt(sizes[rs[0]?.server ?? ''] / 1024 ** 2),
    ),
    row(
      'Container start → S3 port answers (ms)',
      med((r) => r.portUpMs),
    ),
    row(
      'Container start → health 200 (ms)',
      med((r) => r.healthMs),
    ),
    row(
      'Bucket bootstrap (ms)',
      med((r) => r.bootstrapMs),
    ),
    row(
      'Container start → app-usable (ms)',
      med((r) => r.usableMs),
    ),
    row(
      'docker stop (ms)',
      med((r) => r.stopMs),
    ),
    row(
      'Idle RSS (MiB)',
      med((r) => r.idleRssMiB),
    ),
    row(
      'Peak RSS during workload (MiB)',
      med((r) => r.peakRssMiB),
    ),
    '',
    '## Throughput and latency',
    '',
    header,
    divider,
    ...phaseNames.flatMap((name) => [
      row(
        `${name} ops/s`,
        med(phase(name, 'opsPerSec'), name.includes('64MiB') ? 2 : 0),
      ),
      ...(name.includes('KiB') || name.includes('MiB')
        ? name.startsWith('delete')
          ? []
          : [row(`${name} MiB/s`, med(phase(name, 'mibPerSec'), 1))]
        : []),
      row(`${name} p50 (ms)`, med(phase(name, 'p50Ms'), 1)),
      row(`${name} p99 (ms)`, med(phase(name, 'p99Ms'), 1)),
    ]),
    row('Failed operations (all phases, all runs)', (rs) =>
      String(
        rs.reduce(
          (sum, r) => sum + r.phases.reduce((s, p) => s + p.errors, 0),
          0,
        ),
      ),
    ),
    '',
    '## Compatibility (next-template profile image storage)',
    '',
    header,
    divider,
    ...[...new Set(results.flatMap((r) => r.compat.map((c) => c.name)))].map(
      (name) =>
        row(name, (rs) => {
          const outcomes = rs.map((r) => r.compat.find((c) => c.name === name));
          if (outcomes.every((o) => o === undefined)) {
            return 'n/a';
          }
          const allOk = outcomes.every((o) => o?.ok);
          const anyOk = outcomes.some((o) => o?.ok);
          const detail = outcomes.find((o) => !o?.ok)?.detail ?? '';
          const text = allOk
            ? 'pass'
            : anyOk
              ? `flaky: ${detail}`
              : `FAIL: ${detail}`;
          return text.replace(/\|/gu, '/');
        }),
    ),
    '',
    '## Health endpoints',
    '',
    ...servers.map((s) => `- ${s.name}: \`${s.healthUrl}\``),
    '',
    '## Not benchmarked',
    '',
    ...EXCLUDED.map((e) => `- ${e.name}: ${e.reason}`),
    '',
    '## Server notes',
    '',
    ...servers.flatMap((s) => [
      `### ${s.name}`,
      '',
      `Image: \`${s.image}\``,
      '',
      ...s.notes.map((n) => `- ${n}`),
      '',
    ]),
  ];
  return lines.join('\n');
}

type RawFile = {
  context: ReturnType<typeof machineContext>;
  workload: WorkloadConfig;
  images: Record<string, { image: string; sizeBytes: number }>;
  results: RunResult[];
};

/** `--from <raw.json>` re-renders summary.md next to it without running anything. */
function resummarize(rawPath: string) {
  const raw = JSON.parse(readFileSync(rawPath, 'utf8')) as RawFile;
  const servers = SERVERS.filter((s) => s.id in raw.images);
  const sizes = Object.fromEntries(
    Object.entries(raw.images).map(([id, v]) => [id, v.sizeBytes]),
  );
  const runs = Math.max(...raw.results.map((r) => r.round));
  writeFileSync(
    path.join(path.dirname(rawPath), 'summary.md'),
    summarize(raw.results, servers, sizes, raw.context, raw.workload, runs),
  );
}

async function main() {
  const fromIndex = process.argv.indexOf('--from');
  if (fromIndex >= 0) {
    resummarize(path.resolve(process.argv[fromIndex + 1]));
    return;
  }
  const { runs, servers, out, workload } = parseArgs();
  const context = machineContext();
  if (context.memAvailableAtStartGiB < 3) {
    throw new Error(
      `Only ${context.memAvailableAtStartGiB} GiB memory available; need at least 3 GiB.`,
    );
  }

  const sizes: Record<string, number> = {};
  for (const server of servers) {
    sizes[server.id] = imageSize(server.image);
  }

  const results: RunResult[] = [];
  for (let round = 1; round <= runs; round += 1) {
    for (const server of servers) {
      console.log(`[round ${round}/${runs}] ${server.name} ...`);
      const result = await runOne(server, round, workload);
      results.push(result);
      const failed = result.compat.filter((c) => !c.ok).map((c) => c.name);
      console.log(
        `  usable ${result.usableMs} ms, idle ${result.idleRssMiB} MiB, peak ${result.peakRssMiB} MiB, compat failures: ${failed.join('; ') || 'none'}`,
      );
      for (const p of result.phases) {
        console.log(
          `  ${p.phase.padEnd(18)} ${String(p.opsPerSec).padStart(9)} ops/s ${String(p.mibPerSec).padStart(8)} MiB/s p50 ${p.p50Ms} p99 ${p.p99Ms}${p.errors ? ` errors ${p.errors}: ${p.firstError}` : ''}`,
        );
      }
    }
  }

  mkdirSync(out, { recursive: true });
  writeFileSync(
    path.join(out, 'raw.json'),
    `${JSON.stringify(
      {
        context,
        workload,
        images: Object.fromEntries(
          servers.map((s) => [
            s.id,
            { image: s.image, sizeBytes: sizes[s.id] },
          ]),
        ),
        results,
      },
      null,
      2,
    )}\n`,
  );
  writeFileSync(
    path.join(out, 'summary.md'),
    summarize(results, servers, sizes, context, workload, runs),
  );
  console.log(`Wrote ${out}/raw.json and summary.md`);
}

await main();
