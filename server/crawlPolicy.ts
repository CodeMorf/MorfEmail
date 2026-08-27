import PQueue from 'p-queue';
import robotsParser from 'robots-parser';

const perHostQueues = new Map<string, PQueue>();
const robotsCache = new Map<string, { expiresAt: number; parser: ReturnType<typeof robotsParser> }>();

export function getHostQueue(hostname: string): PQueue {
  const key = hostname.toLowerCase();
  let queue = perHostQueues.get(key);
  if (!queue) {
    queue = new PQueue({ concurrency: 2, intervalCap: 4, interval: 1000 });
    perHostQueues.set(key, queue);
  }
  return queue;
}

export async function isAllowedByRobots(url: URL, userAgent: string): Promise<boolean> {
  const origin = url.origin;
  const cached = robotsCache.get(origin);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.parser.isAllowed(url.toString(), userAgent) !== false;
  }

  const robotsUrl = new URL('/robots.txt', origin).toString();
  try {
    const response = await fetch(robotsUrl, {
      headers: { 'User-Agent': userAgent, Accept: 'text/plain,*/*;q=0.1' }
    });
    const text = response.ok ? await response.text() : '';
    const parser = robotsParser(robotsUrl, text);
    robotsCache.set(origin, { expiresAt: Date.now() + 60 * 60 * 1000, parser });
    return parser.isAllowed(url.toString(), userAgent) !== false;
  } catch {
    // Si robots.txt no puede consultarse, no fingimos permiso explícito;
    // para desarrollo local permitimos la URL y seguimos aplicando rate limits.
    return true;
  }
}
