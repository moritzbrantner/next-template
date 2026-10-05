import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export const DOCKER = process.env.S3_BENCH_DOCKER ?? 'docker';
export const BUCKET = 'profile-images';
export const REGION = 'us-east-1';

/** Host ports used for every candidate so the client config stays identical. */
export const HOST_PORTS = { s3: 19000, web: 19002, admin: 19003 } as const;

export type PublicRead = {
  /** What PROFILE_IMAGE_PUBLIC_BASE_URL would be for this server. */
  publicBaseUrl: (bucket: string) => string;
  /** true: grant anonymous read with PutBucketPolicy (like `mc anonymous set download`). */
  viaBucketPolicy: boolean;
};

export type ServerContext = {
  container: string;
  volume: string;
  workDir: string;
};

export type ServerDef = {
  id: string;
  name: string;
  /** Pinned by tag and digest. */
  image: string;
  s3ContainerPort: number;
  /** Extra `-p host:container` mappings besides the S3 port. */
  extraPorts?: Array<[number, number]>;
  /** Health endpoint as a full host URL; the one compose/CI would poll. */
  healthUrl: string;
  credentials: { accessKeyId: string; secretAccessKey: string };
  runArgs: (ctx: ServerContext) => string[];
  /** Server-side setup that must happen before S3 calls work (Garage layout/keys). */
  preBootstrap?: (ctx: ServerContext) => void;
  /** Server-side public-read setup when it is not done via bucket policy. */
  postCreateBucket?: (ctx: ServerContext, bucket: string) => void;
  publicRead: PublicRead;
  notes: string[];
};

export function docker(args: string[], options: { quiet?: boolean } = {}) {
  return execFileSync(DOCKER, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', options.quiet ? 'ignore' : 'pipe'],
  }).trim();
}

function garageExec(ctx: ServerContext, args: string[]) {
  return docker(['exec', ctx.container, '/garage', ...args], { quiet: true });
}

// Garage key ids must look like GK + 24 hex chars; secrets are 64 hex chars.
const GARAGE_KEY_ID = 'GK0123456789abcdef01234567';
const GARAGE_SECRET =
  '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

const s3Base = `http://127.0.0.1:${HOST_PORTS.s3}`;

export const SERVERS: ServerDef[] = [
  {
    id: 'seaweedfs',
    name: 'SeaweedFS 4.48',
    image:
      'docker.io/chrislusf/seaweedfs:4.48@sha256:4e61d15fd35994cb1e43e1e553dff106794841fd9a99ade2fc8c8bfce4d7872d',
    s3ContainerPort: 8333,
    healthUrl: `${s3Base}/healthz`,
    credentials: { accessKeyId: 'minioadmin', secretAccessKey: 'minioadmin' },
    runArgs: (ctx) => [
      '-e',
      'AWS_ACCESS_KEY_ID=minioadmin',
      '-e',
      'AWS_SECRET_ACCESS_KEY=minioadmin',
      '-v',
      `${ctx.volume}:/data`,
      'IMAGE',
      'server',
      '-dir=/data',
      '-ip.bind=0.0.0.0',
      '-master.telemetry=false',
      '-s3',
      '-s3.port=8333',
    ],
    publicRead: {
      publicBaseUrl: (bucket) => `${s3Base}/${bucket}`,
      viaBucketPolicy: true,
    },
    notes: [
      '`weed server -s3` runs master + volume + filer + S3 in one process; admin credentials come from AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY.',
      '`-ip.bind=0.0.0.0` is required, otherwise the S3 port only listens on the container IP and is unreachable through a published port.',
    ],
  },
  {
    id: 'rustfs',
    name: 'RustFS 1.0.1',
    image:
      'docker.io/rustfs/rustfs:1.0.1@sha256:1803faef57627e2d9c2e7d89d655d712ddded5389040054987163043fecb6a3c',
    s3ContainerPort: 9000,
    healthUrl: `${s3Base}/health`,
    credentials: { accessKeyId: 'minioadmin', secretAccessKey: 'minioadmin' },
    runArgs: (ctx) => [
      '-e',
      'RUSTFS_ACCESS_KEY=minioadmin',
      '-e',
      'RUSTFS_SECRET_KEY=minioadmin',
      '-e',
      'RUSTFS_VOLUMES=/data',
      '-v',
      `${ctx.volume}:/data`,
      'IMAGE',
    ],
    publicRead: {
      publicBaseUrl: (bucket) => `${s3Base}/${bucket}`,
      viaBucketPolicy: true,
    },
    notes: [
      'Drop-in for MinIO: same port (9000), same env-style root credentials, and it also answers `/minio/health/live`.',
    ],
  },
  {
    id: 'garage',
    name: 'Garage v2.4.1',
    image:
      'docker.io/dxflrs/garage:v2.4.1@sha256:9c96caa2612d3411acc5b0e6701fb238dbfba33e533a6d7d3d811a4b12d0d020',
    s3ContainerPort: 3900,
    extraPorts: [
      [HOST_PORTS.web, 3902],
      [HOST_PORTS.admin, 3903],
    ],
    healthUrl: `http://127.0.0.1:${HOST_PORTS.admin}/health`,
    credentials: {
      accessKeyId: GARAGE_KEY_ID,
      secretAccessKey: GARAGE_SECRET,
    },
    runArgs: (ctx) => {
      const configPath = path.join(ctx.workDir, 'garage.toml');
      mkdirSync(ctx.workDir, { recursive: true });
      writeFileSync(
        configPath,
        [
          'metadata_dir = "/var/lib/garage/meta"',
          'data_dir = "/var/lib/garage/data"',
          'db_engine = "lmdb"',
          'replication_factor = 1',
          'rpc_bind_addr = "[::]:3901"',
          'rpc_public_addr = "127.0.0.1:3901"',
          `rpc_secret = "${GARAGE_SECRET}"`,
          '',
          '[s3_api]',
          `s3_region = "${REGION}"`,
          'api_bind_addr = "[::]:3900"',
          'root_domain = ".s3.garage.localhost"',
          '',
          '[s3_web]',
          'bind_addr = "[::]:3902"',
          'root_domain = ".web.garage.localhost"',
          '',
          '[admin]',
          'api_bind_addr = "[::]:3903"',
          'admin_token = "bench-admin-token"',
          '',
        ].join('\n'),
      );
      return [
        '-v',
        `${configPath}:/etc/garage.toml:ro`,
        '-v',
        `${ctx.volume}:/var/lib/garage`,
        'IMAGE',
      ];
    },
    preBootstrap: (ctx) => {
      const nodeId = garageExec(ctx, ['node', 'id', '-q']).split('@')[0];
      garageExec(ctx, ['layout', 'assign', '-z', 'dc1', '-c', '10G', nodeId]);
      garageExec(ctx, ['layout', 'apply', '--version', '1']);
      garageExec(ctx, [
        'key',
        'import',
        '--yes',
        '-n',
        'bench',
        GARAGE_KEY_ID,
        GARAGE_SECRET,
      ]);
      garageExec(ctx, ['key', 'allow', '--create-bucket', 'bench']);
    },
    postCreateBucket: (ctx, bucket) => {
      // S3 CreateBucket only creates a key-local alias; the website endpoint
      // resolves global aliases, so alias the bucket globally first.
      const line = garageExec(ctx, ['bucket', 'list'])
        .split('\n')
        .find((entry) =>
          new RegExp(`:${bucket}(\\s|$)`, 'u').test(entry.trim()),
        );
      const bucketId = line?.trim().split(/\s+/u)[0];
      if (!bucketId) {
        throw new Error(`Garage bucket ${bucket} not found`);
      }
      garageExec(ctx, ['bucket', 'alias', bucketId, bucket]);
      garageExec(ctx, ['bucket', 'website', '--allow', bucket]);
    },
    publicRead: {
      // Garage has no bucket policies; anonymous reads only go through the
      // website endpoint, addressed by virtual host.
      publicBaseUrl: (bucket) =>
        `http://${bucket}.web.garage.localhost:${HOST_PORTS.web}`,
      viaBucketPolicy: false,
    },
    notes: [
      'Needs a config file plus a one-time `layout assign/apply`, `key import` and `key allow --create-bucket` before any S3 call works (all counted in bootstrap time).',
      'Access key ids must have the form `GK<24 hex>`; `minioadmin` style credentials are rejected.',
      'No bucket policies: public reads need a global bucket alias (S3 CreateBucket only makes a key-local one), `garage bucket website --allow`, and a separate web port addressed by virtual host (`<bucket>.web.<root_domain>`), so PROFILE_IMAGE_PUBLIC_BASE_URL and next.config remotePatterns change shape.',
      'Health is on the admin port (`/health`) and only turns 200 after the layout is applied.',
    ],
  },
];

export const EXCLUDED = [
  {
    name: 'LocalStack 2026.09.0',
    reason:
      'Exits with code 55 ("License activation failed") unless LOCALSTACK_AUTH_TOKEN is set; not usable as an anonymous CI/dev dependency.',
  },
];
