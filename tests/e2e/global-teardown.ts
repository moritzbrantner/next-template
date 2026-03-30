import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, '../..');
const bootstrapScript = path.join(appRoot, 'scripts/ci/bootstrap-e2e-db.sh');

async function globalTeardown() {
  execFileSync('bash', [bootstrapScript, '--teardown'], {
    cwd: appRoot,
    env: process.env,
    stdio: 'inherit',
  });
}

export default globalTeardown;