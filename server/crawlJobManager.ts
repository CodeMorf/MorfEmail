import { CheerioCrawler, RequestQueue } from 'crawlee';
import PQueue from 'p-queue';
import { getDomain } from 'tldts';
import { randomUUID } from 'node:crypto';
import { MorfExtractor } from '../engine/extraction/morfExtractor';
import { PhoneExtractor } from '../engine/extraction/phoneExtractor';
import type { CrawlLogEntry, CrawlMode, CrawlStatistics, DiscoveryQuery, NormalizedLead } from '../engine/types';
import { getHostQueue, isAllowedByRobots } from './crawlPolicy';
import { LocalDb } from './localDb';

const API_PORT = Number(process.env.MORFEMAIL_API_PORT || 3100);
const USER_AGENT = process.env.MORFEMAIL_USER_AGENT || 'MorfEmail-LocalDev/2.0 (+https://codemorf.tech)';
const jobs = new Map<string, CrawlJob>();
const renderQueue = new PQueue({ concurrency: 2, intervalCap: 2, interval: 1000 });

interface CrawlUserData {
  searchId: string;
  depth: number;
  maxDepth: number;
  category: string;
  city: string;
  state?: string;
  country: string;
  countryCode: string;
  businessName?: string;
  source?: string;
  sourceUrl?: string;
  estimatedAddress?: string;
  estimatedPhone?: string;
  estimatedEmail?: string;
  estimatedWhatsapp?: string;
  osmType?: string;
  osmId?: string;
}

export interface CrawlJobConfig {
  mode: CrawlMode;
  maxConcurrency: number;
  browserConcurrency: number;
  headless: boolean;
  requestTimeoutMs: number;
  maxRetries: number;
  rateLimitPerDomainMs: number;
  respectRobotsTxt: boolean;
  crawlDepth: number;
}

export interface CrawlJobSnapshot {
  id: string;
  searchId: string;
  status: 'queued' | 'running' | 'paused' | 'completed' | 'cancelled' | 'failed';
  stats: CrawlStatistics;
  logs: CrawlLogEntry[];
  leads: NormalizedLead[];
}

interface CrawlJob extends CrawlJobSnapshot {
  config: CrawlJobConfig;
  crawler: CheerioCrawler | null;
  requestQueue: RequestQueue | null;
  paused: boolean;
  cancelled: boolean;
  startedAt: number;
  db: LocalDb;
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${randomUUID().slice(0, 8)}`;
}

function canonicalDomain(rawUrl: string): string {
  try {
    const hostname = new URL(rawUrl).hostname.toLowerCase().replace(/^www\./, '');
    return getDomain(hostname, { allowPrivateDomains: true }) || hostname;
  } catch {
    return '';
  }
}

function normalizeUrl(rawUrl: string): string {
  const url = new URL(rawUrl);
  url.hash = '';
  return url.toString().replace(/\/$/, '');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function log(job: CrawlJob, entry: Omit<CrawlLogEntry, 'id' | 'timestamp'>): void {
  const full: CrawlLogEntry = {
    ...entry,
    id: makeId('log'),
    timestamp: new Date().toLocaleTimeString()
  };
  job.logs.unshift(full);
  job.logs = job.logs.slice(0, 100);
  job.db.recordCrawlEvent({
    searchId: job.searchId,
    url: entry.url,
    domain: entry.domain,
    status: entry.status,
    message: entry.message,
    parser: entry.details?.parser,
    durationMs: 0
  });
}

function setStatus(job: CrawlJob, status: CrawlJobSnapshot['status']): void {
  job.status = status;
  job.db.updateSearch(job.searchId, {
    status,
    leads_found: job.stats.businessesFound,
    duration_sec: job.stats.elapsedTimeSec,
    updated_at: new Date().toISOString()
  });
}

function updateTime(job: CrawlJob): void {
  if (['completed', 'cancelled', 'failed'].includes(job.status)) return;
  job.stats.elapsedTimeSec = Math.floor((Date.now() - job.startedAt) / 1000);
  if (job.stats.elapsedTimeSec > 0) {
    job.stats.speedPagesPerMin = Math.round((job.stats.pagesAnalyzed / job.stats.elapsedTimeSec) * 60);
  }
}

async function waitIfPaused(job: CrawlJob): Promise<void> {
  while (job.paused && !job.cancelled) await sleep(100);
}

function buildLead(raw: ReturnType<typeof MorfExtractor.extractFromHtml>, userData: CrawlUserData, url: string): NormalizedLead | null {
  const businessName = userData.businessName?.trim() || raw.businessName?.trim();
  if (!businessName) return null;
  const now = new Date().toISOString();
  const primaryEmail = raw.emails[0] || userData.estimatedEmail?.trim() || '';
  const estimatedPhones = PhoneExtractor.extract(userData.estimatedPhone || '', userData.countryCode);
  const primaryPhone = raw.phones[0]?.formattedNumber || estimatedPhones[0]?.formattedNumber || userData.estimatedPhone?.trim() || '';
  const additionalPhones = [
    ...raw.phones.slice(1).map((phone) => phone.formattedNumber),
    ...estimatedPhones.slice(raw.phones.length > 0 ? 0 : 1).map((phone) => phone.formattedNumber)
  ].filter((phone, index, values) => values.indexOf(phone) === index && phone !== primaryPhone);
  const address = raw.address?.formattedAddress || raw.address?.street || userData.estimatedAddress?.trim() || '';
  const sourceUrl = userData.sourceUrl || url;
  return {
    id: makeId('lead'),
    businessName,
    category: userData.category,
    website: url,
    domain: canonicalDomain(url),
    email: primaryEmail,
    emailStatus: 'unverified',
    additionalEmails: raw.emails.slice(1),
    phone: primaryPhone,
    additionalPhones,
    whatsapp: raw.whatsapp || userData.estimatedWhatsapp?.trim() || undefined,
    address,
    city: raw.address?.city || userData.city || '',
    region: raw.address?.region || userData.state || '',
    postalCode: raw.address?.postalCode || '',
    country: raw.address?.country || userData.country,
    countryCode: userData.countryCode,
    facebook: raw.socials.facebook,
    instagram: raw.socials.instagram,
    linkedin: raw.socials.linkedin,
    twitter: raw.socials.twitter,
    tiktok: raw.socials.tiktok,
    youtube: raw.socials.youtube,
    sourceUrl,
    discoveredAt: now,
    updatedAt: now,
    confidenceScore: Math.max(raw.confidenceScore, primaryEmail || primaryPhone || address ? 45 : 30),
    notes: userData.source ? `Fuente de discovery: ${userData.source}` : undefined
  };
}

function discoverySourceUrl(seed: Record<string, unknown>): string {
  const type = String(seed.osmType || '').trim();
  const id = String(seed.osmId || '').trim();
  if (['node', 'way', 'relation'].includes(type) && id) return `https://www.openstreetmap.org/${type}/${id}`;
  return String(seed.source || 'https://www.openstreetmap.org/');
}

function buildDiscoveryLead(seed: Record<string, unknown>, query: DiscoveryQuery): NormalizedLead | null {
  const businessName = String(seed.title || '').trim();
  if (!businessName) return null;
  const sourceUrl = discoverySourceUrl(seed);
  const phone = PhoneExtractor.extract(String(seed.estimatedPhone || ''), query.countryCode)[0]?.formattedNumber || String(seed.estimatedPhone || '').trim();
  const email = String(seed.estimatedEmail || '').trim();
  const whatsapp = String(seed.estimatedWhatsapp || '').trim();
  const address = String(seed.estimatedAddress || '').trim();
  const now = new Date().toISOString();
  const contactCount = [phone, email, whatsapp].filter(Boolean).length;
  return {
    id: makeId('lead'),
    businessName,
    category: String(seed.category || query.category),
    website: '',
    domain: '',
    email,
    emailStatus: 'unverified',
    phone,
    additionalPhones: [],
    whatsapp: whatsapp || undefined,
    address,
    city: String(seed.city || query.city || ''),
    region: query.state || '',
    postalCode: '',
    country: String(seed.country || query.country),
    countryCode: query.countryCode,
    sourceUrl,
    discoveredAt: now,
    updatedAt: now,
    confidenceScore: Math.min(70, 40 + (address ? 10 : 0) + contactCount * 7),
    notes: `Fuente de discovery: ${String(seed.source || 'OpenStreetMap')}. Datos públicos iniciales sin validar por email o llamada.`
  };
}

function registerLead(job: CrawlJob, lead: NormalizedLead, details: Record<string, unknown> = {}): boolean {
  const normalizedName = lead.businessName.trim().toLowerCase();
  const normalizedAddress = lead.address.trim().toLowerCase();
  const duplicate = job.leads.some((existing) => {
    const sameDomain = Boolean(lead.domain) && Boolean(existing.domain) && existing.domain === lead.domain;
    const sameEmail = Boolean(lead.email) && Boolean(existing.email) && existing.email.toLowerCase() === lead.email.toLowerCase();
    const samePhone = Boolean(lead.phone) && Boolean(existing.phone) && existing.phone === lead.phone;
    const samePlace = normalizedName && existing.businessName.trim().toLowerCase() === normalizedName &&
      normalizedAddress && existing.address.trim().toLowerCase() === normalizedAddress;
    return sameDomain || sameEmail || samePhone || samePlace;
  });
  if (duplicate) return false;

  job.leads.push(lead);
  job.stats.businessesFound++;
  if (lead.email) job.stats.emailsFound++;
  if (lead.phone) job.stats.phonesFound++;
  if (lead.whatsapp) job.stats.whatsappFound++;
  job.db.upsertLead(lead, job.searchId);
  log(job, {
    url: lead.sourceUrl,
    domain: lead.domain || 'osm.morfemail.internal',
    status: 'success',
    message: `Encontrado: ${lead.businessName} (${lead.email || 'Sin email'} · ${lead.phone || 'Sin teléfono'})`,
    details: details as CrawlLogEntry['details']
  });
  return true;
}

async function renderWithPlaywright(url: string, timeoutMs: number, headless: boolean): Promise<{ html: string; finalUrl: string; statusCode: number }> {
  const response = await fetch(`http://127.0.0.1:${API_PORT}/api/render-page`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, timeoutMs, headless })
  });
  const payload = (await response.json().catch(() => ({}))) as { html?: string; finalUrl?: string; statusCode?: number; error?: string };
  if (!response.ok) throw new Error(payload.error || `Playwright local respondió HTTP ${response.status}`);
  return { html: String(payload.html || ''), finalUrl: String(payload.finalUrl || url), statusCode: Number(payload.statusCode || 0) };
}

async function discoverSeeds(query: DiscoveryQuery): Promise<Array<Record<string, unknown>>> {
  if (query.targetDomain) {
    const clean = query.targetDomain.trim();
    const url = /^https?:\/\//i.test(clean) ? clean : `https://${clean}`;
    return [{ title: new URL(url).hostname, websiteUrl: url, domain: canonicalDomain(url), source: 'Dominio proporcionado por el usuario' }];
  }
  const response = await fetch(`http://127.0.0.1:${API_PORT}/api/discovery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(query)
  });
  const payload = (await response.json().catch(() => ({}))) as { results?: Array<Record<string, unknown>>; error?: string };
  if (!response.ok) throw new Error(payload.error || `Discovery local respondió HTTP ${response.status}`);
  return Array.isArray(payload.results) ? payload.results : [];
}

async function runJob(job: CrawlJob, query: DiscoveryQuery): Promise<void> {
  try {
    log(job, { url: 'system://discovery', domain: 'discovery.morfemail.internal', status: 'analyzing', message: `Consultando OpenStreetMap / Overpass para ${query.category} en ${query.city}, ${query.country}...` });
    const seeds = await discoverSeeds(query);
    job.stats.websitesDiscovered = seeds.filter((seed) => Boolean(seed.websiteUrl)).length;
    const requestQueue = await RequestQueue.open(`morfemail-${job.id}`);
    job.requestQueue = requestQueue;

    for (const seed of seeds) {
      const rawUrl = String(seed.websiteUrl || '');
      if (!rawUrl) {
        const lead = buildDiscoveryLead(seed, query);
        if (lead) {
          if (!registerLead(job, lead, { emails: lead.email ? 1 : 0, phones: lead.phone ? 1 : 0, whatsapp: Boolean(lead.whatsapp), socials: 0, statusCode: 200, parser: 'cheerio' })) {
            log(job, { url: lead.sourceUrl, domain: 'osm.morfemail.internal', status: 'skipped', message: `Negocio omitido por duplicación de empresa/datos: ${lead.businessName}.` });
          }
        }
        continue;
      }
      let url: string;
      try { url = normalizeUrl(rawUrl); } catch { continue; }
      const userData: CrawlUserData = {
        searchId: job.searchId,
        depth: 1,
        maxDepth: job.config.crawlDepth,
        category: String(seed.category || query.category),
        city: String(seed.city || query.city || ''),
        state: query.state,
        country: String(seed.country || query.country),
        countryCode: query.countryCode,
        businessName: seed.title ? String(seed.title) : undefined,
        source: seed.source ? String(seed.source) : undefined,
        sourceUrl: url,
        estimatedAddress: seed.estimatedAddress ? String(seed.estimatedAddress) : undefined,
        estimatedPhone: seed.estimatedPhone ? String(seed.estimatedPhone) : undefined,
        estimatedEmail: seed.estimatedEmail ? String(seed.estimatedEmail) : undefined,
        estimatedWhatsapp: seed.estimatedWhatsapp ? String(seed.estimatedWhatsapp) : undefined,
        osmType: seed.osmType ? String(seed.osmType) : undefined,
        osmId: seed.osmId ? String(seed.osmId) : undefined
      };
      await requestQueue.addRequest({ url, userData });
      job.db.upsertCrawlUrl({ id: makeId('crawl'), searchId: job.searchId, url, domain: canonicalDomain(url), depth: 1, maxDepth: job.config.crawlDepth, status: 'pending' });
    }

    log(job, { url: 'system://queue', domain: 'queue.morfemail.internal', status: 'success', message: `${seeds.length} negocios descubiertos; ${job.stats.websitesDiscovered} sitios web públicos agregados a Crawlee RequestQueue y ${job.stats.businessesFound} fichas públicas guardadas directamente.` });
    setStatus(job, 'running');
    job.startedAt = Date.now();

    const crawler = new CheerioCrawler({
      requestQueue,
      maxConcurrency: Math.min(12, Math.max(1, job.config.maxConcurrency)),
      maxRequestRetries: Math.max(0, job.config.maxRetries),
      navigationTimeoutSecs: Math.max(4, Math.ceil(job.config.requestTimeoutMs / 1000)),
      sameDomainDelaySecs: Math.max(0.25, job.config.rateLimitPerDomainMs / 1000),
      maxRequestsPerMinute: 600,
      requestHandlerTimeoutSecs: Math.max(15, Math.ceil(job.config.requestTimeoutMs / 1000) + 10),
      useSessionPool: false,
      preNavigationHooks: [async ({ request }) => {
        if (!job.config.respectRobotsTxt) return;
        const allowed = await isAllowedByRobots(new URL(request.url), USER_AGENT);
        if (!allowed) {
          // CheerioCrawler is an HTTP crawler: skipNavigation is intended for
          // browser crawlers and would still call requestHandler without an
          // HTTP response. Stop here before fetching the target page.
          request.noRetry = true;
          const error = new Error(`ROBOTS_RESTRICTED: ${request.url}`) as Error & { code?: string };
          error.code = 'ROBOTS_RESTRICTED';
          throw error;
        }
      }],
      onSkippedRequest: async ({ url, reason }) => {
        if (reason === 'robotsTxt') {
          job.stats.restrictedCount++;
          job.db.upsertCrawlUrl({ id: makeId('crawl'), searchId: job.searchId, url, domain: canonicalDomain(url), depth: 1, maxDepth: job.config.crawlDepth, status: 'restricted' });
          log(job, { url, domain: canonicalDomain(url), status: 'restricted', message: 'Rastreo omitido: robots.txt restringe a MorfEmail.' });
        }
      },
      failedRequestHandler: async ({ request }, error) => {
        if ((error as Error & { code?: string }).code === 'ROBOTS_RESTRICTED') {
          job.stats.restrictedCount++;
          job.db.upsertCrawlUrl({ id: makeId('crawl'), searchId: job.searchId, url: request.url, domain: canonicalDomain(request.url), depth: Number(request.userData.depth || 1), maxDepth: Number(request.userData.maxDepth || job.config.crawlDepth), retryCount: Number(request.retryCount || 0), status: 'restricted' });
          log(job, { url: request.url, domain: canonicalDomain(request.url), status: 'restricted', message: 'Rastreo omitido: robots.txt restringe a MorfEmail.' });
          return;
        }
        job.stats.errorsCount++;
        job.db.upsertCrawlUrl({ id: makeId('crawl'), searchId: job.searchId, url: request.url, domain: canonicalDomain(request.url), depth: Number(request.userData.depth || 1), maxDepth: Number(request.userData.maxDepth || job.config.crawlDepth), retryCount: Number(request.retryCount || job.config.maxRetries), status: 'failed' });
        log(job, { url: request.url, domain: canonicalDomain(request.url), status: 'error', message: `Falló después de ${job.config.maxRetries} reintentos: ${error.message}` });
      },
      requestHandler: async (context) => {
        job.stats.activeWorkers++;
        try {
          await waitIfPaused(job);
          if (job.cancelled) return;
          const started = Date.now();
        const { request, response, body, $ } = context;
        const userData = request.userData as CrawlUserData;
        const visibleBody = $('body').clone();
        visibleBody.find('script, style, noscript, svg, iframe').remove();
        const bodyText = visibleBody.text().replace(/\s+/g, ' ').trim();
        const pageHtml = String(body || $.html() || '');
        const inlineScripts = $('script').map((_index, element) => $(element).html() || '').get().join('\n');
        const dynamicScript = /(?:fetch\s*\(|axios\.|var\s+data\s*=|window\.__|__NEXT_DATA__)/i.test(`${pageHtml}\n${inlineScripts}`);
        const hasOnlyShellContent = bodyText.length < 120 && $('script').length >= 2 && $('body').find('article, main, table, form, .quote').length === 0;
        const dynamicCandidate = ($('#root, #app, #__next, [data-reactroot]').length > 0 || dynamicScript || hasOnlyShellContent) && bodyText.length < 300;
        let html = pageHtml;
        let finalUrl = request.url;
        let parser: 'cheerio' | 'playwright' = 'cheerio';
        let statusCode = response.statusCode;

        log(job, { url: request.url, domain: canonicalDomain(request.url), status: 'analyzing', message: `HTTP recibido: ${pageHtml.length} bytes, ${$('script').length} scripts, contenido dinámico=${dynamicCandidate}.`, details: { statusCode, parser } });

        if (job.config.mode === 'browser' || (job.config.mode === 'auto' && dynamicCandidate)) {
          const rendered = await renderQueue.add(() => getHostQueue(new URL(request.url).hostname).add(() => renderWithPlaywright(request.url, job.config.requestTimeoutMs, job.config.headless))) as Awaited<ReturnType<typeof renderWithPlaywright>>;
          html = rendered.html;
          finalUrl = rendered.finalUrl;
          statusCode = rendered.statusCode;
          parser = 'playwright';
        }

        const raw = MorfExtractor.extractFromHtml(html, finalUrl, {
          category: userData.category,
          country: userData.country,
          defaultCountryCode: userData.countryCode,
          renderedWith: parser,
          httpStatus: statusCode
        });
        job.stats.pagesAnalyzed++;
        job.db.upsertCrawlUrl({ id: makeId('crawl'), searchId: job.searchId, url: request.url, domain: canonicalDomain(request.url), depth: Number(userData.depth || 1), maxDepth: Number(userData.maxDepth || job.config.crawlDepth), retryCount: Number(request.retryCount || 0), status: 'completed' });

        if (Number(userData.depth || 1) < Number(userData.maxDepth || job.config.crawlDepth)) {
          const links = [...(raw.contactPageUrls || []), ...(raw.aboutPageUrls || [])];
          for (const link of [...new Set(links)].slice(0, 6)) {
            const subUrl = normalizeUrl(link);
            const subData: CrawlUserData = { ...userData, depth: Number(userData.depth || 1) + 1 };
            await context.addRequests([{ url: subUrl, userData: subData }]);
            job.db.upsertCrawlUrl({ id: makeId('crawl'), searchId: job.searchId, url: subUrl, domain: canonicalDomain(subUrl), depth: subData.depth, maxDepth: subData.maxDepth, parentUrl: request.url, status: 'pending' });
          }
        }

        const lead = buildLead(raw, userData, finalUrl);
        if (lead && !registerLead(job, lead, { emails: raw.emails.length, phones: raw.phones.length, whatsapp: Boolean(raw.whatsapp), socials: Object.keys(raw.socials).length, statusCode, parser })) {
          log(job, { url: finalUrl, domain: canonicalDomain(finalUrl), status: 'skipped', message: 'Página omitida por duplicación de empresa o datos de contacto.', details: { statusCode, parser } });
        } else if (!lead) {
          log(job, { url: finalUrl, domain: canonicalDomain(finalUrl), status: 'skipped', message: 'Página procesada sin nombre empresarial público verificable.', details: { statusCode, parser } });
        }
        log(job, { url: finalUrl, domain: canonicalDomain(finalUrl), status: 'analyzing', message: `Página procesada con ${parser}.`, details: { statusCode, parser } });
        job.stats.currentUrl = finalUrl;
        updateTime(job);
        job.db.updateSearch(job.searchId, { leads_found: job.stats.businessesFound, duration_sec: job.stats.elapsedTimeSec, status: 'running', updated_at: new Date().toISOString() });
          void started;
        } finally {
          job.stats.activeWorkers = Math.max(0, job.stats.activeWorkers - 1);
        }
      }
    });
    job.crawler = crawler;
    await crawler.run();
    updateTime(job);
    if (job.cancelled) setStatus(job, 'cancelled');
    else setStatus(job, 'completed');
    log(job, { url: 'system://completed', domain: 'crawler.internal', status: 'success', message: `Extracción finalizada. ${job.stats.businessesFound} empresas, ${job.stats.emailsFound} emails y ${job.stats.phonesFound} teléfonos.` });
  } catch (error) {
    job.stats.errorsCount++;
    updateTime(job);
    setStatus(job, job.cancelled ? 'cancelled' : 'failed');
    log(job, { url: 'system://error', domain: 'error.morfemail.internal', status: 'error', message: error instanceof Error ? error.message : String(error) });
  } finally {
    job.crawler = null;
  }
}

export class CrawlJobManager {
  public static start(searchId: string, query: DiscoveryQuery, config: CrawlJobConfig): CrawlJobSnapshot {
    const id = makeId('crawl');
    const db = new LocalDb();
    const job: CrawlJob = {
      id, searchId, status: 'queued', config, crawler: null, requestQueue: null, paused: false, cancelled: false,
      startedAt: Date.now(), db,
      stats: { pagesAnalyzed: 0, businessesFound: 0, websitesDiscovered: 0, emailsFound: 0, phonesFound: 0, whatsappFound: 0, restrictedCount: 0, errorsCount: 0, speedPagesPerMin: 0, elapsedTimeSec: 0, activeWorkers: 0, maxWorkers: config.maxConcurrency },
      logs: [], leads: []
    };
    jobs.set(id, job);
    void runJob(job, query);
    return this.snapshot(job);
  }

  public static get(id: string): CrawlJobSnapshot | null {
    const job = jobs.get(id);
    return job ? this.snapshot(job) : null;
  }

  public static pause(id: string): boolean {
    const job = jobs.get(id);
    if (!job || job.status !== 'running') return false;
    job.paused = true;
    setStatus(job, 'paused');
    return true;
  }

  public static resume(id: string): boolean {
    const job = jobs.get(id);
    if (!job || job.status !== 'paused') return false;
    job.paused = false;
    setStatus(job, 'running');
    return true;
  }

  public static stop(id: string): boolean {
    const job = jobs.get(id);
    if (!job || ['completed', 'cancelled', 'failed'].includes(job.status)) return false;
    job.cancelled = true;
    job.paused = false;
    job.crawler?.stop();
    setStatus(job, 'cancelled');
    return true;
  }

  private static snapshot(job: CrawlJob): CrawlJobSnapshot {
    updateTime(job);
    return { id: job.id, searchId: job.searchId, status: job.status, stats: { ...job.stats }, logs: [...job.logs], leads: [...job.leads] };
  }
}
