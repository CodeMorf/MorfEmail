import { spawn } from 'node:child_process';
import { existsSync, unlinkSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const runtime = path.resolve(process.env.MORFEMAIL_RUNTIME_ROOT || 'src-tauri/resources/runtime');
const dbPath = path.join(os.tmpdir(), 'morfemail-runtime-smoke.db');
const child = spawn(path.join(runtime, 'node.exe'), ['server.cjs'], {
  cwd: runtime,
  env: {
    ...process.env,
    MORFEMAIL_API_PORT: '3199',
    MORFEMAIL_DB_PATH: dbPath,
    PLAYWRIGHT_BROWSERS_PATH: path.join(runtime, 'ms-playwright'),
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let stderr = '';
let stdout = '';
child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

try {
  let healthy = false;
  for (let attempt = 0; attempt < 60 && !healthy; attempt += 1) {
    try {
      const response = await fetch('http://127.0.0.1:3199/api/health');
      healthy = response.ok;
      if (healthy) console.log(await response.text());
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  if (!healthy) throw new Error(`El runtime incluido no respondió /api/health. salida=${stdout.trim()} error=${stderr.trim()} código=${child.exitCode}`);
} finally {
  if (child.exitCode === null) {
    child.kill();
    await new Promise((resolve) => child.once('exit', resolve));
  }
  for (const suffix of ['', '-wal', '-shm']) {
    const file = `${dbPath}${suffix}`;
    if (existsSync(file)) unlinkSync(file);
  }
}
