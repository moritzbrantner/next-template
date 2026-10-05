# S3-compatible server benchmark

Picks the replacement for MinIO in `docker-compose.yml` (issue #115). The `minio/minio` image is no longer pullable from Docker Hub and `quay.io/minio/*` requires a login.

```bash
bun run bench:s3-servers                      # 3 interleaved rounds, all servers
bun run bench:s3-servers -- --quick           # 1 small round, smoke test
bun run bench:s3-servers -- --servers rustfs --runs 5 --out /tmp/s3-bench
```

Requirements: Docker or Podman on the same host as the benchmark (the runner reads container process RSS from the host `/proc`, so Docker Desktop VMs are not supported), Bun, `bun install`, at least 3 GiB available memory and ~1 GiB free disk. Set `S3_BENCH_DOCKER=podman` to call Podman directly. Host ports 19000, 19002 and 19003 must be free.

## Candidates

| Server    | Image (pinned by tag and digest in `servers.ts`) | Run as                                                    |
| --------- | ------------------------------------------------ | --------------------------------------------------------- |
| SeaweedFS | `chrislusf/seaweedfs:4.48`                       | `weed server -s3` (master, volume, filer and S3 together) |
| RustFS    | `rustfs/rustfs:1.0.1`                            | default single-node, single-volume entrypoint             |
| Garage    | `dxflrs/garage:v2.4.1`                           | single node, `replication_factor = 1`, LMDB metadata      |

LocalStack (`localstack/localstack:2026.09.0`) was meant as a reference but exits with "License activation failed" unless `LOCALSTACK_AUTH_TOKEN` is set, so it cannot be an anonymous dev/CI dependency and is not benchmarked.

## Method

- One server container at a time, each run on a fresh named volume (local disk), removed afterwards. Rounds are interleaved (SeaweedFS, RustFS, Garage, then again) so drift on a shared machine hits every server equally. Default 3 rounds, summary values are medians.
- Client: the app's own `@aws-sdk/client-s3`, path-style, run by Bun on the host. The bench does not depend on any MinIO image or tool (no `mc`, no `warp`). Payloads are random bytes, so servers that compress get no advantage.
- Startup: wall time from `docker run -d` until the S3 port answers any HTTP request, until the server's health endpoint returns 200, and until the bucket is "app-usable". App-usable means what the compose `minio-create-bucket` job does (create bucket, grant anonymous read), plus a first signed PUT/GET and an anonymous GET from the public base URL. For Garage this includes the layout and key setup it needs before any S3 call works.
- Workload (after a 64-object warm-up): PUT then GET of 2000 × 4 KiB and 400 × 256 KiB objects at concurrency 8, and 8 × 64 MiB at concurrency 4; full `ListObjectsV2` pagination over the 2000 keys, 20 times sequentially; `DeleteObject` of the 2000 small keys at concurrency 8. Reported: ops/s, MiB/s, p50 and p99 latency.
- Memory: summed `VmRSS` of the container's process tree, idle (3 s after bootstrap) and peak (sampled every 100 ms during the workload). Image size from `docker image inspect`.
- Compatibility pass (`compat.ts`), on a separate fresh bucket per run, mirroring what next-template actually does: bucket creation and idempotent re-creation, public-read bucket policy (the `mc anonymous set download` equivalent), `PutObject` with `ContentType`, `CacheControl`, `ContentDisposition` and user metadata as in `src/profile/object-storage.ts`, `HeadObject` metadata round-trip, anonymous GET through the current path-style `PROFILE_IMAGE_PUBLIC_BASE_URL` shape and through the server's own public URL with header checks, anonymous PUT rejected, `DeleteObject` (also for a missing key), bucket deletion. The app uses no presigned URLs, multipart uploads or listing, so those are not part of the pass.

Numbers come from a shared developer machine (WSL2), so absolute values are indicative; compare servers against each other, not against production hardware.

## Results

See [`results/2026-10-05/summary.md`](results/2026-10-05/summary.md) for the full tables and machine context, and `raw.json` next to it for per-run data.

Machine: WSL2 (kernel 6.18), Intel Core Ultra 7 258V, 8 vCPUs, 15.4 GiB RAM, rootless Podman 5.7.0 via the `docker` CLI shim, Bun 1.4.2, `@aws-sdk/client-s3` 3.1050.0. Medians of 3 interleaved runs, 0 failed operations.

| Metric (median of 3)                   |        SeaweedFS 4.48 |                         RustFS 1.0.1 |                                Garage v2.4.1 |
| -------------------------------------- | --------------------: | -----------------------------------: | -------------------------------------------: |
| `docker run` → app-usable bucket       |              8 381 ms |                           **464 ms** |                                     2 676 ms |
| `docker stop`                          |        15 318 ms (\*) |                           **333 ms** |                           10 290 ms (\*\*\*) |
| Idle / peak RSS                        |       151 / 1 223 MiB |                        199 / 375 MiB |                              **35 / 71 MiB** |
| Image size                             |               505 MiB |                              278 MiB |                                   **68 MiB** |
| PUT 256 KiB (profile image), p50 / p99 |     **6.4 / 13.7 ms** |                       19.6 / 33.4 ms |                                9.9 / 19.2 ms |
| GET 256 KiB, p50 / p99                 |     **7.0 / 16.2 ms** |                        7.4 / 16.7 ms |                                9.7 / 21.8 ms |
| PUT / GET 4 KiB, ops/s                 | **2 406** / **2 708** |                          584 / 2 639 |                           1 240 / 176 (\*\*) |
| PUT / GET 64 MiB, MiB/s                |             307 / 396 |                        **420 / 560** |                                    310 / 418 |
| LIST 2000 keys (full pagination), p50  |           **35.7 ms** |                             285.6 ms |                                      39.0 ms |
| DELETE 4 KiB, p50                      |            **2.1 ms** |                               7.3 ms |                                       2.6 ms |
| Compatibility pass                     |              all pass |                             all pass | no bucket policy, no path-style public reads |
| Health endpoint                        |            `/healthz` | `/health`, also `/minio/health/live` |                         admin port `/health` |

(\*) Ignores SIGTERM until the stop timeout (15 s here, Compose default 10 s) and gets SIGKILLed.
(\*\*) Garage answers small GETs in a constant ~44 ms (256 KiB GETs are unaffected), which looks like a Nagle/delayed-ACK interaction; reproducible in all runs.
(\*\*\*) Takes ~10 s to exit after SIGTERM, i.e. about Compose's default grace period.

### Reading

- **SeaweedFS** has the best steady-state throughput for small and profile-image-sized objects (PUT 3× RustFS), and the fastest LIST/DELETE. It costs 3.7–8.4 s to become usable (the S3 gateway answers before the filer accepts `CreateBucket`), 15 s to stop, and ~1.2 GiB peak RSS under this load. Needs `-ip.bind=0.0.0.0`, port 8333 and `/healthz` instead of `/minio/health/live`.
- **RustFS** is the closest to a drop-in MinIO replacement: port 9000, root credentials via env, `/minio/health/live` still works, bucket policies work, usable in under 0.5 s and stops in 0.3 s, 375 MiB peak. Its weak spots are small-object writes (13–20 ms p50) and LIST (~0.3 s for 2000 keys); the app never lists, and a 20 ms profile-image upload is not user-visible. It is a young project (1.0.0 shipped 2026-09-16).
- **Garage** is the leanest by far, but it cannot do what the compose stack does today: no `PutBucketPolicy`, anonymous reads only through a separate virtual-host web endpoint (changes `PROFILE_IMAGE_PUBLIC_BASE_URL` and `next.config` image patterns), `GK…`-format keys, and a layout/key bootstrap step. Small GETs are slow (see above).

The `minio-create-bucket` job (`quay.io/minio/mc`, also login-gated) was replaced by `rustfs-create-bucket`, a pinned `amazon/aws-cli` job that applies the same policy as `publicReadPolicy` in `compat.ts` (#114).
