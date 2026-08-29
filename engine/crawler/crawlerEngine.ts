/**
 * CrawlerEngine - adaptador del motor local.
 *
 * El proceso de crawling vive en Node para que Crawlee, better-sqlite3 y
 * Playwright no se empaqueten dentro del navegador. Este adaptador mantiene
 * la API de eventos que usa la UI y consume el estado del job local.
 */

import type { CrawlMode, CrawlStatus, CrawlStatistics, CrawlLogEntry, CrawlerConfig, DiscoveryQuery, NormalizedLead } from '../types';
import { localApiUrl } from '../../src/services/localApi';

export type StatsListener = (stats: CrawlStatistics) => void;
export type LogListener = (log: CrawlLogEntry) => void;
export type LeadListener = (lead: NormalizedLead) => void;
export type StatusListener = (status: CrawlStatus) => void;

interface RemoteSnapshot {
  id: string;
  searchId: string;
  status: Exclude<CrawlStatus, 'idle'>;
  stats: CrawlStatistics;
  logs: CrawlLogEntry[];
  leads: NormalizedLead[];
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${globalThis.crypto?.randomUUID?.() || Date.now().toString(36)}`;
}

export class CrawlerEngine {
  private status: CrawlStatus = 'idle';
  private config: CrawlerConfig;
  private remoteJobId: string | null = null;
  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  private polling = false;
  private stats: CrawlStatistics = {
    pagesAnalyzed: 0,
    businessesFound: 0,
    websitesDiscovered: 0,
    emailsFound: 0,
    phonesFound: 0,
    whatsappFound: 0,
    restrictedCount: 0,
    errorsCount: 0,
    speedPagesPerMin: 0,
    elapsedTimeSec: 0,
    activeWorkers: 0,
    maxWorkers: 8
  };
  private logs: CrawlLogEntry[] = [];
  private discoveredLeads: NormalizedLead[] = [];
  private readonly statsListeners: StatsListener[] = [];
  private readonly logListeners: LogListener[] = [];
  private readonly leadListeners: LeadListener[] = [];
  private readonly statusListeners: StatusListener[] = [];

  constructor(config?: Partial<CrawlerConfig>) {
    this.config = {
      mode: config?.mode || 'auto',
      maxConcurrency: Math.min(12, Math.max(1, config?.maxConcurrency || 8)),
      browserConcurrency: Math.min(2, Math.max(1, config?.browserConcurrency || 2)),
      headless: config?.headless ?? true,
      requestTimeoutMs: config?.requestTimeoutMs || 12000,
      maxRetries: config?.maxRetries ?? 2,
      rateLimitPerDomainMs: config?.rateLimitPerDomainMs || 800,
      respectRobotsTxt: config?.respectRobotsTxt ?? true,
      crawlDepth: config?.crawlDepth || 2,
      searchId: config?.searchId
    };
  }

  public async start(query: DiscoveryQuery, customConfig?: Partial<CrawlerConfig>): Promise<void> {
    if (this.status === 'running' || this.status === 'queued') return;
    this.config = { ...this.config, ...customConfig };
    this.clearPolling();
    this.logs = [];
    this.discoveredLeads = [];
    this.stats = {
      pagesAnalyzed: 0,
      businessesFound: 0,
      websitesDiscovered: 0,
      emailsFound: 0,
      phonesFound: 0,
      whatsappFound: 0,
      restrictedCount: 0,
      errorsCount: 0,
      speedPagesPerMin: 0,
      elapsedTimeSec: 0,
      activeWorkers: 0,
      maxWorkers: this.config.maxConcurrency
    };
    this.setStatus('queued');

    const response = await fetch(localApiUrl('/api/crawl/start'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ searchId: this.config.searchId, query, config: this.config })
    });
    const payload = (await response.json().catch(() => ({}))) as { id?: string; error?: string };
    if (!response.ok || !payload.id) {
      this.setStatus('failed');
      throw new Error(payload.error || `No se pudo iniciar el crawler local (HTTP ${response.status})`);
    }
    this.remoteJobId = payload.id;
    await this.pollOnce();
  }

  public pause(): void { void this.control('pause'); }
  public resume(): void { void this.control('resume'); }
  public stop(): void { void this.control('stop'); }

  public addUrls(_urls: string[], _category?: string): number {
    // Las búsquedas actuales nacen de discovery o TARGET DOMAIN. Mantener
    // este método evita romper consumidores antiguos, pero no crea URLs a
    // ciegas ni mantiene una cola paralela fuera de Crawlee.
    return 0;
  }

  public getStatistics(): CrawlStatistics { return { ...this.stats }; }
  public getStatus(): CrawlStatus { return this.status; }
  public getDiscoveredLeads(): NormalizedLead[] { return [...this.discoveredLeads]; }

  private async control(action: 'pause' | 'resume' | 'stop'): Promise<void> {
    if (!this.remoteJobId) return;
    await fetch(localApiUrl(`/api/crawl/${this.remoteJobId}/${action}`), { method: 'POST' }).catch(() => undefined);
    await this.pollOnce();
  }

  private async pollOnce(): Promise<void> {
    if (!this.remoteJobId || this.polling) return;
    this.polling = true;
    try {
      const response = await fetch(localApiUrl(`/api/crawl/${this.remoteJobId}/status`));
      if (!response.ok) throw new Error(`Estado del crawler HTTP ${response.status}`);
      const snapshot = (await response.json()) as RemoteSnapshot;
      this.applySnapshot(snapshot);
      if (!['completed', 'cancelled', 'failed'].includes(snapshot.status)) {
        this.pollTimer = setTimeout(() => void this.pollOnce(), 500);
      } else {
        this.remoteJobId = null;
      }
    } catch (error) {
      this.addLog({ id: makeId('log'), timestamp: new Date().toLocaleTimeString(), url: 'system://client', domain: 'client.morfemail.internal', status: 'error', message: error instanceof Error ? error.message : String(error) });
      this.setStatus('failed');
    } finally {
      this.polling = false;
    }
  }

  private applySnapshot(snapshot: RemoteSnapshot): void {
    this.stats = { ...snapshot.stats };
    this.notifyStats();
    const knownLogs = new Set(this.logs.map((item) => item.id));
    const newLogs = snapshot.logs.filter((item) => !knownLogs.has(item.id)).reverse();
    this.logs = snapshot.logs;
    for (const item of newLogs) this.notifyLog(item);
    const knownLeads = new Set(this.discoveredLeads.map((item) => item.id));
    this.discoveredLeads = snapshot.leads;
    for (const lead of snapshot.leads.filter((item) => !knownLeads.has(item.id))) this.notifyLead(lead);
    this.setStatus(snapshot.status);
  }

  private clearPolling(): void {
    if (this.pollTimer) clearTimeout(this.pollTimer);
    this.pollTimer = null;
    this.remoteJobId = null;
    this.polling = false;
  }

  private setStatus(status: CrawlStatus): void {
    this.status = status;
    for (const listener of this.statusListeners) listener(status);
  }

  private addLog(entry: CrawlLogEntry): void {
    this.logs.unshift(entry);
    this.notifyLog(entry);
  }

  private notifyStats(): void { for (const listener of this.statsListeners) listener({ ...this.stats }); }
  private notifyLog(logEntry: CrawlLogEntry): void { for (const listener of this.logListeners) listener(logEntry); }
  private notifyLead(lead: NormalizedLead): void { for (const listener of this.leadListeners) listener(lead); }

  public onStatsUpdate(cb: StatsListener): () => void { this.statsListeners.push(cb); cb({ ...this.stats }); return () => this.remove(this.statsListeners, cb); }
  public onLog(cb: LogListener): () => void { this.logListeners.push(cb); for (const item of [...this.logs].reverse()) cb(item); return () => this.remove(this.logListeners, cb); }
  public onLeadDiscovered(cb: LeadListener): () => void { this.leadListeners.push(cb); for (const lead of this.discoveredLeads) cb(lead); return () => this.remove(this.leadListeners, cb); }
  public onStatusChange(cb: StatusListener): () => void { this.statusListeners.push(cb); cb(this.status); return () => this.remove(this.statusListeners, cb); }

  private remove<T>(listeners: T[], callback: T): void {
    const index = listeners.indexOf(callback);
    if (index >= 0) listeners.splice(index, 1);
  }
}
