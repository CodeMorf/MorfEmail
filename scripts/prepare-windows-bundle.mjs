import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const runtime = path.join(root, 'src-tauri', 'resources', 'runtime');
const playwrightRoot = path.join(process.env.LOCALAPPDATA || '', 'ms-playwright');

if (!fs.existsSync(path.join(root, 'dist', 'server.cjs'))) {
  throw new Error('Falta dist/server.cjs. Ejecuta npm run build:server antes de preparar Windows.');
}
if (!fs.existsSync(path.join(root, 'node_modules'))) throw new Error('Falta node_modules. Ejecuta npm install antes de preparar Windows.');

fs.rmSync(runtime, { recursive: true, force: true });
fs.mkdirSync(runtime, { recursive: true });
fs.copyFileSync(path.join(root, 'dist', 'server.cjs'), path.join(runtime, 'server.cjs'));
fs.copyFileSync(process.execPath, path.join(runtime, 'node.exe'));

// The server bundle contains the crawler and billing dependencies. Only these
// packages remain external because they include native binaries or dynamic
// runtime assets; keeping the runtime focused makes the Windows installer
// smaller and avoids shipping Vite/test tooling to customers.
const runtimePackage = {
  name: 'morfemail-windows-runtime',
  private: true,
  dependencies: {
    'better-sqlite3': '13.0.3',
    jsdom: '26.1.0',
    jquery: '3.7.1',
    playwright: '1.62.1'
  }
};
fs.writeFileSync(path.join(runtime, 'package.json'), `${JSON.stringify(runtimePackage, null, 2)}\n`);
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const install = spawnSync(npmCommand, ['install', '--omit=dev', '--no-package-lock'], {
  cwd: runtime,
  stdio: 'inherit',
  shell: process.platform === 'win32'
});
if (install.error || install.status !== 0) {
  const detail = install.error?.message || `código ${install.status}, señal ${install.signal || 'desconocida'}`;
  throw new Error(`No se pudieron instalar las dependencias mínimas del runtime (${detail}).`);
}

if (fs.existsSync(playwrightRoot)) {
  const chromiumDirs = fs.readdirSync(playwrightRoot)
    .filter((name) => /^chromium-\d+$/.test(name))
    .sort()
    .reverse();
  const chromiumDir = chromiumDirs[0];
  if (chromiumDir) {
    fs.cpSync(path.join(playwrightRoot, chromiumDir), path.join(runtime, 'ms-playwright', chromiumDir), { recursive: true, dereference: true });
  }
}

const required = [
  path.join(runtime, 'node.exe'),
  path.join(runtime, 'server.cjs'),
  path.join(runtime, 'node_modules', 'better-sqlite3'),
  path.join(runtime, 'node_modules', 'jsdom'),
  path.join(runtime, 'node_modules', 'playwright')
];
const missing = required.filter((entry) => !fs.existsSync(entry));
if (missing.length > 0) throw new Error(`El runtime Windows quedó incompleto: ${missing.join(', ')}`);

const size = (directory) => {
  let total = 0;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    total += entry.isDirectory() ? size(full) : fs.statSync(full).size;
  }
  return total;
};

console.log(JSON.stringify({
  runtime,
  node: process.execPath,
  runtimeSizeMb: Math.round(size(runtime) / 1024 / 1024),
  chromiumIncluded: fs.existsSync(path.join(runtime, 'ms-playwright'))
}));
