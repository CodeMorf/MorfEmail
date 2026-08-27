/**
 * CrawlerEngine - MorfEmail Unified Crawling Orchestrator
 * Abstracción principal para Crawlee, Playwright, Cheerio y MorfExtractor.
 */

import {
  CrawlMode,
  CrawlStatus,
  CrawlStatistics,
  CrawlLogEntry,
  CrawlerConfig,
  DiscoveryQuery,
  NormalizedLead,
  RawExtractedData
} from '../types';
import { RequestQueue } from './requestQueue';
import { HttpCrawler } from './httpCrawler';
import { BrowserCrawler } from './browserCrawler';
import { PublicDirectoryProvider } from '../discovery/publicDirectoryProvider';
import { DeduplicationEngine } from '../normalization/deduplicationEngine';
import { UrlNormalizer } from '../normalization/urlNormalizer';

export type StatsListener = (stats: CrawlStatistics) => void;
export type LogListener = (log: CrawlLogEntry) => void;
export type LeadListener = (lead: NormalizedLead) => void;
export type StatusListener = (status: CrawlStatus) => void;

export class CrawlerEngine {
  private status: CrawlStatus = 'idle';
  private config: CrawlerConfig;
  private queue = new RequestQueue();
  private browserCrawler: BrowserCrawler;
  private deduplicator = new DeduplicationEngine();
  private discoveryProvider = new PublicDirectoryProvider();

  // Estadísticas en tiempo real
  private stats: CrawlStatistics = {
    pagesAnalyzed: 0,
    businessesFound: 0,
    emailsFound: 0,
    phonesFound: 0,
    whatsappFound: 0,
    errorsCount: 0,
    speedPagesPerMin: 0,
    elapsedTimeSec: 0,
    activeWorkers: 0,
    maxWorkers: 8
  };

  private timerInterval: any = null;
  private workerLoopRunning = false;
  private discoveredLeads: NormalizedLead[] = [];

  // Listeners
  private statsListeners: StatsListener[] = [];
  private logListeners: LogListener[] = [];
  private leadListeners: LeadListener[] = [];
  private statusListeners: StatusListener[] = [];

  constructor(config?: Partial<CrawlerConfig>) {
    this.config = {
      mode: config?.mode || 'auto',
      maxConcurrency: config?.maxConcurrency || 8,
      browserConcurrency: config?.browserConcurrency || 2,
      headless: config?.headless ?? true,
      requestTimeoutMs: config?.requestTimeoutMs || 8000,
      maxRetries: config?.maxRetries || 2,
      rateLimitPerDomainMs: config?.rateLimitPerDomainMs || 600,
      respectRobotsTxt: config?.respectRobotsTxt ?? true,
      crawlDepth: config?.crawlDepth || 2
    };

    this.browserCrawler = new BrowserCrawler({
      headless: this.config.headless,
      timeoutMs: 15000
    });
  }

  /**
   * Inicia una nueva búsqueda y proceso de crawling.
   */
  public async start(query: DiscoveryQuery, customConfig?: Partial<CrawlerConfig>): Promise<void> {
    if (this.status === 'running') return;

    if (customConfig) {
      this.config = { ...this.config, ...customConfig };
      this.browserCrawler.setHeadless(this.config.headless);
    }

    this.setStatus('queued');
    this.resetStatistics();
    this.queue.clear();
    this.discoveredLeads = [];

    this.addLog({
      url: 'system://discovery',
      domain: 'discovery.morfemail.internal',
      status: 'analyzing',
      message: `Iniciando descubrimiento B2B en ${query.city}, ${query.country} para categoría "${query.category}"...`
    });

    try {
      // 1. Descubrimiento de semillas objetivo
      const seeds = await this.discoveryProvider.search(query);
      for (const seed of seeds) {
        this.queue.add({
          url: seed.websiteUrl,
          depth: 1,
          maxDepth: this.config.crawlDepth,
          category: query.category,
          city: query.city,
          country: query.country
        });
      }

      this.addLog({
        url: 'system://queue',
        domain: 'queue.morfemail.internal',
        status: 'success',
        message: `${seeds.length} dominios y empresas objetivo agregadas a la cola de extracción.`
      });

      this.setStatus('running');
      this.startTimer();
      this.runWorkerLoop();
    } catch (err: any) {
      this.setStatus('failed');
      this.addLog({
        url: 'system://error',
        domain: 'error.morfemail.internal',
        status: 'error',
        message: `Error al iniciar búsqueda: ${err.message}`
      });
    }
  }

  /**
   * Pausa la extracción de nuevas URLs de la cola.
   */
  public pause(): void {
    if (this.status === 'running') {
      this.setStatus('paused');
      this.addLog({
        url: 'system://pause',
        domain: 'crawler.internal',
        status: 'warning',
        message: 'Búsqueda pausada por el usuario. Las tareas en curso finalizarán con seguridad.'
      });
    }
  }

  /**
   * Reanuda una búsqueda pausada.
   */
  public resume(): void {
    if (this.status === 'paused') {
      this.setStatus('running');
      this.addLog({
        url: 'system://resume',
        domain: 'crawler.internal',
        status: 'success',
        message: 'Búsqueda reanudada. Procesando cola pendiente...'
      });
      this.runWorkerLoop();
    }
  }

  /**
   * Detiene y cancela la búsqueda actual guardando el progreso.
   */
  public stop(): void {
    if (this.status === 'running' || this.status === 'paused' || this.status === 'queued') {
      this.setStatus('cancelled');
      this.stopTimer();
      this.addLog({
        url: 'system://stop',
        domain: 'crawler.internal',
        status: 'warning',
        message: `Búsqueda detenida por el usuario. Se extrajeron ${this.stats.businessesFound} prospectos.`
      });
    }
  }

  /**
   * Agrega URLs manualmente a la cola de crawling activa.
   */
  public addUrls(urls: string[], category?: string): number {
    const added = this.queue.addBatch(
      urls.map((u) => ({
        url: u,
        depth: 1,
        maxDepth: this.config.crawlDepth,
        category
      }))
    );

    if (added > 0 && this.status === 'running' && !this.workerLoopRunning) {
      this.runWorkerLoop();
    }

    return added;
  }

  /**
   * Retorna el progreso actual y estadísticas.
   */
  public getStatistics(): CrawlStatistics {
    return { ...this.stats };
  }

  public getStatus(): CrawlStatus {
    return this.status;
  }

  public getDiscoveredLeads(): NormalizedLead[] {
    return [...this.discoveredLeads];
  }

  /**
   * Bucle asíncrono concurrente de trabajadores.
   */
  private async runWorkerLoop(): Promise<void> {
    if (this.workerLoopRunning) return;
    this.workerLoopRunning = true;

    const maxConcurrent = this.config.maxConcurrency;

    while (this.status === 'running' && (this.queue.size() > 0 || this.queue.inProgressCount() > 0)) {
      if (this.stats.activeWorkers < maxConcurrent && this.queue.size() > 0) {
        const req = this.queue.getNext(this.config.rateLimitPerDomainMs);
        if (req) {
          this.stats.activeWorkers++;
          this.stats.currentUrl = req.url;
          this.notifyStats();

          // Ejecutar tarea de extracción en background concurrente
          this.processRequest(req)
            .catch((e) => {
              this.stats.errorsCount++;
              this.addLog({
                url: req.url,
                domain: req.domain,
                status: 'error',
                message: `Error al procesar: ${e.message}`
              });
            })
            .finally(() => {
              this.stats.activeWorkers = Math.max(0, this.stats.activeWorkers - 1);
              this.notifyStats();
            });
        }
      }

      await new Promise((r) => setTimeout(r, 80));
    }

    this.workerLoopRunning = false;

    if (this.status === 'running' && this.queue.size() === 0 && this.queue.inProgressCount() === 0) {
      this.setStatus('completed');
      this.stopTimer();
      this.addLog({
        url: 'system://completed',
        domain: 'crawler.internal',
        status: 'success',
        message: `Extracción finalizada con éxito. ${this.stats.businessesFound} empresas y ${this.stats.emailsFound} correos verificados.`
      });
    }
  }

  private async processRequest(req: any): Promise<void> {
    this.addLog({
      url: req.url,
      domain: req.domain,
      status: 'analyzing',
      message: `Analizando ${req.url}...`
    });

    let extracted: RawExtractedData | null = null;
    let usedParser: 'cheerio' | 'playwright' = 'cheerio';

    // 1. Ejecutar según modo de crawling
    if (this.config.mode === 'browser' || req.forceBrowser) {
      usedParser = 'playwright';
      extracted = await this.browserCrawler.renderAndExtract(req.url, {
        category: req.category,
        city: req.city,
        country: req.country
      });
    } else {
      // FAST o AUTO: Intentar HTTP + Cheerio primero
      try {
        const httpResult = await HttpCrawler.fetchAndExtract(req.url, {
          timeoutMs: this.config.requestTimeoutMs,
          category: req.category,
          city: req.city,
          country: req.country
        });

        if (this.config.mode === 'auto' && httpResult.isDynamicCandidate) {
          // Fallback a Playwright Chromium si es una SPA sin contenido renderizado
          usedParser = 'playwright';
          extracted = await this.browserCrawler.renderAndExtract(req.url, {
            category: req.category,
            city: req.city,
            country: req.country
          });
        } else {
          extracted = httpResult.data;
        }
      } catch (err: any) {
        // Si HTTP simple falla y estamos en AUTO, intentar Playwright
        if (this.config.mode === 'auto') {
          usedParser = 'playwright';
          extracted = await this.browserCrawler.renderAndExtract(req.url, {
            category: req.category,
            city: req.city,
            country: req.country
          });
        } else {
          throw err;
        }
      }
    }

    this.queue.markCompleted(req);
    this.stats.pagesAnalyzed++;

    if (!extracted) return;

    // 2. Si tiene páginas secundarias (/contacto o /about) y no hemos alcanzado maxDepth
    if (req.depth < req.maxDepth && extracted.contactPageUrls && extracted.contactPageUrls.length > 0) {
      for (const subUrl of extracted.contactPageUrls) {
        this.queue.add({
          url: subUrl,
          depth: req.depth + 1,
          maxDepth: req.maxDepth,
          parentUrl: req.url,
          category: req.category,
          city: req.city,
          country: req.country
        });
      }
    }

    // 3. Normalizar y verificar si es un lead válido
    const lead = this.normalizeToLead(extracted, req);

    // 4. Deduplicación
    const dupCheck = this.deduplicator.checkDuplicate(lead);
    if (dupCheck.isDuplicate) {
      this.addLog({
        url: req.url,
        domain: req.domain,
        status: 'skipped',
        message: `Omitido (Duplicado detectado por ${dupCheck.matchedBy})`
      });
      return;
    }

    // Registrar lead
    this.deduplicator.registerLead(lead);
    this.discoveredLeads.push(lead);

    // Actualizar contadores
    this.stats.businessesFound++;
    if (lead.email) this.stats.emailsFound++;
    if (lead.phone) this.stats.phonesFound++;
    if (lead.whatsapp) this.stats.whatsappFound++;

    this.addLog({
      url: req.url,
      domain: req.domain,
      status: 'success',
      message: `Encontrado: ${lead.businessName} (${lead.email || 'Sin email'} · ${lead.phone || 'Sin tel'})`,
      details: {
        emails: extracted.emails.length,
        phones: extracted.phones.length,
        whatsapp: !!extracted.whatsapp,
        socials: Object.keys(extracted.socials).length,
        parser: usedParser
      }
    });

    this.notifyLead(lead);
    this.notifyStats();
  }

  private normalizeToLead(raw: RawExtractedData, req: any): NormalizedLead {
    const primaryEmail = raw.emails[0] || '';
    const primaryPhone = raw.phones[0]?.formattedNumber || '';

    return {
      id: `lead-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      businessName: raw.businessName || raw.domain,
      category: raw.category || req.category || 'General',
      website: raw.url,
      domain: raw.domain,
      email: primaryEmail,
      emailStatus: primaryEmail ? 'valid' : 'unverified',
      additionalEmails: raw.emails.slice(1),
      phone: primaryPhone,
      additionalPhones: raw.phones.slice(1).map((p) => p.formattedNumber),
      whatsapp: raw.whatsapp,
      address: raw.address?.formattedAddress || raw.address?.street || '',
      city: raw.address?.city || req.city || 'Santo Domingo',
      region: raw.address?.region || req.state || '',
      postalCode: raw.address?.postalCode || '',
      country: raw.address?.country || req.country || 'República Dominicana',
      countryCode: req.countryCode || 'DO',
      facebook: raw.socials.facebook,
      instagram: raw.socials.instagram,
      linkedin: raw.socials.linkedin,
      twitter: raw.socials.twitter,
      tiktok: raw.socials.tiktok,
      youtube: raw.socials.youtube,
      sourceUrl: raw.url,
      discoveredAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      confidenceScore: raw.confidenceScore
    };
  }

  private startTimer(): void {
    this.stopTimer();
    const startTime = Date.now();
    this.timerInterval = setInterval(() => {
      this.stats.elapsedTimeSec = Math.floor((Date.now() - startTime) / 1000);
      if (this.stats.elapsedTimeSec > 0) {
        this.stats.speedPagesPerMin = Math.round((this.stats.pagesAnalyzed / this.stats.elapsedTimeSec) * 60);
      }
      this.notifyStats();
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private resetStatistics(): void {
    this.stats = {
      pagesAnalyzed: 0,
      businessesFound: 0,
      emailsFound: 0,
      phonesFound: 0,
      whatsappFound: 0,
      errorsCount: 0,
      speedPagesPerMin: 0,
      elapsedTimeSec: 0,
      activeWorkers: 0,
      maxWorkers: this.config.maxConcurrency
    };
    this.notifyStats();
  }

  private setStatus(status: CrawlStatus): void {
    this.status = status;
    for (const listener of this.statusListeners) {
      listener(status);
    }
  }

  private addLog(entry: Omit<CrawlLogEntry, 'id' | 'timestamp'>): void {
    const fullLog: CrawlLogEntry = {
      ...entry,
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toLocaleTimeString()
    };
    for (const listener of this.logListeners) {
      listener(fullLog);
    }
  }

  private notifyStats(): void {
    const copy = { ...this.stats };
    for (const listener of this.statsListeners) {
      listener(copy);
    }
  }

  private notifyLead(lead: NormalizedLead): void {
    for (const listener of this.leadListeners) {
      listener(lead);
    }
  }

  // Event subscription methods
  public onStatsUpdate(cb: StatsListener): () => void {
    this.statsListeners.push(cb);
    return () => (this.statsListeners = this.statsListeners.filter((l) => l !== cb));
  }

  public onLog(cb: LogListener): () => void {
    this.logListeners.push(cb);
    return () => (this.logListeners = this.logListeners.filter((l) => l !== cb));
  }

  public onLeadDiscovered(cb: LeadListener): () => void {
    this.leadListeners.push(cb);
    return () => (this.leadListeners = this.leadListeners.filter((l) => l !== cb));
  }

  public onStatusChange(cb: StatusListener): () => void {
    this.statusListeners.push(cb);
    return () => (this.statusListeners = this.statusListeners.filter((l) => l !== cb));
  }
}
