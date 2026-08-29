const DEFAULT_LOCAL_API_BASE = 'http://127.0.0.1:3100';

function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export function localApiUrl(path: string): string {
  const base = isTauriRuntime()
    ? String(import.meta.env.VITE_MORFEMAIL_LOCAL_API_URL || DEFAULT_LOCAL_API_BASE).replace(/\/$/, '')
    : '';
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export async function waitForLocalApi(timeoutMs = 20000): Promise<void> {
  if (!isTauriRuntime()) return;
  const deadline = Date.now() + timeoutMs;
  let lastError = 'El motor local todavía no responde.';
  while (Date.now() < deadline) {
    try {
      const response = await fetch(localApiUrl('/api/health'), { cache: 'no-store' });
      if (response.ok) return;
      lastError = `El motor local respondió HTTP ${response.status}.`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => window.setTimeout(resolve, 500));
  }
  throw new Error(lastError);
}
