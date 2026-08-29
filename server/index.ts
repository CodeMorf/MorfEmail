import express from 'express';
import 'dotenv/config';
import { lookup } from 'node:dns/promises';
import net from 'node:net';
import { chromium, type Browser } from 'playwright';
import { WebhookVerificationError } from '@polar-sh/sdk/webhooks';
import { CrawlJobManager } from './crawlJobManager';
import { LocalDb } from './localDb';
import { PolarBillingService } from './polarBilling';
import type { DbExportRecord, DbSearch } from '../engine/database/models';
import type { NormalizedLead } from '../engine/types';

const app = express();
app.use('/api/webhooks/polar', express.raw({ type: 'application/json', limit: '256kb' }));
app.use(express.json({ limit: '256kb' }));
app.use('/api', (req, res, next) => {
  const origin = req.headers.origin;
  const allowed = !origin || origin === 'tauri://localhost' || origin === 'http://tauri.localhost' || origin.startsWith('http://127.0.0.1:') || origin.startsWith('http://localhost:');
  if (!allowed) return res.status(403).json({ error: 'Origen no permitido para el motor local.' });
  if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

const PORT = Number(process.env.MORFEMAIL_API_PORT || 3100);
const USER_AGENT =
  process.env.MORFEMAIL_USER_AGENT ||
  'MorfEmail-LocalDev/2.0 (+https://codemorf.tech; contact: it@codemorf.tech)';
const NOMINATIM_URL = (process.env.MORFEMAIL_NOMINATIM_URL || 'https://nominatim.openstreetmap.org').replace(/\/$/, '');
const OVERPASS_URLS = (process.env.MORFEMAIL_OVERPASS_URLS ||
  'https://overpass-api.de/api/interpreter,https://overpass.private.coffee/api/interpreter')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const MAX_DISCOVERY_RESULTS = 500;
const MAX_HTML_BYTES = 3 * 1024 * 1024;
const geocodeCache = new Map<string, { expiresAt: number; bbox: [number, number, number, number] }>();
const hostLastAccess = new Map<string, number>();
let lastNominatimRequestAt = 0;
let lastOverpassRequestAt = 0;
let browserPromise: Promise<Browser> | null = null;
const localDb = new LocalDb();
const polarBilling = new PolarBillingService();

interface DiscoveryInput {
  country: string;
  countryCode: string;
  state?: string;
  city?: string;
  category: string;
  limit?: number;
  targetDomain?: string;
}

interface OsmElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat?: number; lon?: number };
  tags?: Record<string, string>;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeWebsite(raw?: string): string {
  if (!raw) return '';
  const first = raw.split(/[;,\s]+/).find(Boolean)?.trim() || '';
  if (!first) return '';
  const candidate = /^https?:\/\//i.test(first) ? first : `https://${first}`;
  try {
    const url = new URL(candidate);
    if (!['http:', 'https:'].includes(url.protocol)) return '';
    url.hash = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return '';
  }
}

function canonicalDomain(website: string): string {
  if (!website) return '';
  try {
    return new URL(website).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}

function firstTag(tags: Record<string, string>, keys: string[]): string {
  for (const key of keys) {
    const value = tags[key]?.trim();
    if (value) return value;
  }
  return '';
}

function buildAddress(tags: Record<string, string>): string {
  const street = [tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(' ');
  return [
    street,
    tags['addr:suburb'] || tags['addr:neighbourhood'],
    tags['addr:city'] || tags['addr:town'] || tags['addr:village'],
    tags['addr:state'],
    tags['addr:postcode'],
    tags['addr:country']
  ]
    .filter(Boolean)
    .join(', ');
}

function getCategoryClauses(category: string): string[] {
  const value = category.toLowerCase();

  if (/restaur|restaurant/.test(value)) return ['["amenity"="restaurant"]', '["amenity"="fast_food"]'];
  if (/hotel|alojamiento|lodging/.test(value)) return ['["tourism"="hotel"]', '["tourism"="guest_house"]'];
  if (/abog|lawyer|legal/.test(value)) return ['["office"="lawyer"]'];
  if (/dent|odont/.test(value)) return ['["amenity"="dentist"]', '["healthcare"="dentist"]'];
  if (/inmobil|real estate|estate/.test(value)) return ['["office"="estate_agent"]'];
  if (/constru|builder/.test(value)) return ['["office"="construction_company"]', '["craft"="builder"]'];
  if (/tecnolog|software|informat|\bit\b/.test(value)) return ['["office"="it"]', '["office"="telecommunication"]'];
  if (/ecommerce|e-commerce|tienda|store|retail/.test(value)) return ['["shop"]'];
  if (/transport|logistic|courier|mensaj/.test(value)) return ['["office"="logistics"]', '["amenity"="taxi"]'];
  if (/autom[oó]vil|auto|car dealer/.test(value)) return ['["shop"="car"]', '["shop"="car_repair"]'];
  if (/salud|clinic|m[eé]dic/.test(value)) return ['["amenity"="clinic"]', '["amenity"="doctors"]', '["healthcare"]'];
  if (/marketing|publicidad|advert/.test(value)) return ['["office"="advertising_agency"]', '["office"="marketing"]'];
  if (/gimnas|fitness|gym/.test(value)) return ['["leisure"="fitness_centre"]', '["leisure"="sports_centre"]'];
  if (/est[eé]tic|beauty|spa/.test(value)) return ['["shop"="beauty"]', '["leisure"="spa"]'];
  if (/financ|account|contab|consultor[ií]a financiera/.test(value)) return ['["office"="accountant"]', '["office"="financial"]'];
  if (/escuela|academ|school|college/.test(value)) return ['["amenity"="school"]', '["amenity"="college"]', '["amenity"="language_school"]'];
  if (/arquitect|design|dise[nñ]o/.test(value)) return ['["office"="architect"]', '["office"="interior_design"]'];

  // Fallback conservador: negocios etiquetados como oficinas o comercios.
  // Se limita fuertemente el resultado para no convertir Overpass en un crawler masivo.
  return ['["office"]', '["shop"]'];
}

async function geocodeScope(input: DiscoveryInput): Promise<[number, number, number, number] | null> {
  const city = input.city && !/todas las ciudades|all cities/i.test(input.city) ? input.city : '';
  const state = input.state && !/todo el pa[ií]s|nationwide/i.test(input.state) ? input.state : '';
  if (!city && !state) return null;

  const key = `${city}|${state}|${input.country}|${input.countryCode}`.toLowerCase();
  const cached = geocodeCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.bbox;

  // La instancia pública de Nominatim exige <= 1 req/s. Esta llamada solo se usa
  // para geocodificar la ubicación introducida directamente por el usuario.
  const sinceLast = Date.now() - lastNominatimRequestAt;
  if (sinceLast < 1100) await sleep(1100 - sinceLast);

  const url = new URL(`${NOMINATIM_URL}/search`);
  // No repetir ciudad/estado en la consulta: en RD ambos pueden llamarse
  // Santo Domingo y Nominatim podría devolver una carretera con un bbox
  // diminuto en lugar del municipio.
  url.searchParams.set('q', [city || state, input.country].filter(Boolean).join(', '));
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '5');
  url.searchParams.set('addressdetails', '1');
  if (input.countryCode) url.searchParams.set('countrycodes', input.countryCode.toLowerCase());

  lastNominatimRequestAt = Date.now();
  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept-Language': 'es,en;q=0.8',
      Accept: 'application/json'
    }
  });

  if (!response.ok) throw new Error(`Nominatim respondió HTTP ${response.status}`);
  const results = (await response.json()) as Array<{ boundingbox?: string[]; addresstype?: string; type?: string }>;
  const preferred = results.find((result) => ['city', 'town', 'municipality', 'state', 'county'].includes(String(result.addresstype || '').toLowerCase()));
  const bbox = (preferred || results[0])?.boundingbox;
  if (!bbox || bbox.length !== 4) return null;

  const parsed: [number, number, number, number] = [
    Number(bbox[0]),
    Number(bbox[2]),
    Number(bbox[1]),
    Number(bbox[3])
  ];
  if (parsed.some((value) => !Number.isFinite(value))) return null;

  geocodeCache.set(key, { expiresAt: Date.now() + 24 * 60 * 60 * 1000, bbox: parsed });
  return parsed;
}

function buildOverpassQuery(input: DiscoveryInput, bbox: [number, number, number, number] | null): string {
  const clauses = getCategoryClauses(input.category);
  const resultLimit = Math.min(MAX_DISCOVERY_RESULTS * 4, Math.max(80, (input.limit || 20) * 5));

  let areaSetup = '';
  let scope = '';
  if (bbox) {
    scope = `(${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]})`;
  } else {
    const code = input.countryCode.toUpperCase().replace(/[^A-Z]/g, '');
    if (!code) throw new Error('Código ISO de país requerido para búsqueda nacional');
    areaSetup = `area["ISO3166-1"="${code}"][admin_level=2]->.searchArea;`;
    scope = '(area.searchArea)';
  }

  const body = clauses.map((filter) => `nwr${filter}${scope};`).join('\n  ');
  return `[out:json][timeout:25];\n${areaSetup}\n(\n  ${body}\n);\nout tags center qt ${resultLimit};`;
}

async function queryOverpass(query: string): Promise<{ elements: OsmElement[]; endpoint: string }> {
  let lastError: Error | null = null;

  // Los endpoints públicos son compartidos y pueden fallar de forma temporal.
  // Se reintenta con pausa y se rota el endpoint; no se paralelizan consultas.
  for (let attempt = 1; attempt <= 3; attempt++) {
    for (const endpoint of OVERPASS_URLS) {
      try {
        const sinceLast = Date.now() - lastOverpassRequestAt;
        if (sinceLast < 1100) await sleep(1100 - sinceLast);
        lastOverpassRequestAt = Date.now();

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 35_000);
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'User-Agent': USER_AGENT,
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
            Accept: 'application/json'
          },
          body: `data=${encodeURIComponent(query)}`,
          signal: controller.signal
        });
        clearTimeout(timeout);

        if (response.status === 429) {
          lastError = new Error(`Overpass ${endpoint} aplicó rate limit (429)`);
          continue;
        }
        if (!response.ok) {
          lastError = new Error(`Overpass ${endpoint} respondió HTTP ${response.status}`);
          continue;
        }

        const data = (await response.json()) as { elements?: OsmElement[] };
        return { elements: data.elements || [], endpoint };
      } catch (error: any) {
        lastError = error instanceof Error ? error : new Error(String(error));
      }
    }
    if (attempt < 3) await sleep(1500 * attempt);
  }

  throw lastError || new Error('No se pudo consultar ningún endpoint Overpass');
}

function isPrivateIp(address: string): boolean {
  const ipVersion = net.isIP(address);
  if (ipVersion === 4) {
    const parts = address.split('.').map(Number);
    const [a, b] = parts;
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224
    );
  }
  if (ipVersion === 6) {
    const normalized = address.toLowerCase();
    return normalized === '::1' || normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe80:');
  }
  return true;
}

async function assertPublicUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error('URL inválida');
  }

  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Solo se permiten URLs HTTP/HTTPS');
  const hostname = url.hostname.toLowerCase();
  if (!hostname || hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local')) {
    throw new Error('Host local/restringido');
  }

  const addresses = await lookup(hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some((entry) => isPrivateIp(entry.address))) {
    throw new Error('La URL resuelve a una red privada/restringida');
  }

  return url;
}

async function throttleHost(hostname: string, minimumDelayMs = 450): Promise<void> {
  const key = hostname.toLowerCase();
  const last = hostLastAccess.get(key) || 0;
  const elapsed = Date.now() - last;
  if (elapsed < minimumDelayMs) await sleep(minimumDelayMs - elapsed);
  hostLastAccess.set(key, Date.now());
}

async function fetchHtmlSafely(rawUrl: string, timeoutMs = 12_000): Promise<{
  html: string;
  statusCode: number;
  finalUrl: string;
  contentType: string;
}> {
  let currentUrl = rawUrl;

  for (let redirectCount = 0; redirectCount <= 5; redirectCount++) {
    const url = await assertPublicUrl(currentUrl);
    await throttleHost(url.hostname);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch(url, {
      redirect: 'manual',
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml;q=0.9,text/plain;q=0.7,*/*;q=0.1',
        'Accept-Language': 'es,en;q=0.8'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) throw new Error(`Redirección HTTP ${response.status} sin Location`);
      currentUrl = new URL(location, url).toString();
      continue;
    }

    const contentType = response.headers.get('content-type') || '';
    if (!/text\/html|application\/xhtml\+xml|text\/plain/i.test(contentType)) {
      throw new Error(`Tipo de contenido no soportado: ${contentType || 'desconocido'}`);
    }

    const declaredLength = Number(response.headers.get('content-length') || 0);
    if (declaredLength > MAX_HTML_BYTES) throw new Error('Página demasiado grande para el extractor local');

    const html = await response.text();
    if (Buffer.byteLength(html, 'utf8') > MAX_HTML_BYTES) {
      throw new Error('Página demasiado grande para el extractor local');
    }

    return {
      html,
      statusCode: response.status,
      finalUrl: response.url || currentUrl,
      contentType
    };
  }

  throw new Error('Demasiadas redirecciones');
}

async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = chromium.launch({ headless: true });
  }
  return browserPromise;
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'MorfEmail Local Engine',
    version: '2.2-local',
    storage: 'better-sqlite3',
    database: localDb.stats(),
    billing: polarBilling.getPublicConfig()
  });
});

app.get('/api/stats', (_req, res) => {
  res.json(localDb.stats());
});

app.get('/api/billing/config', (_req, res) => {
  return res.json(polarBilling.getPublicConfig());
});

app.get('/api/billing/state', (_req, res) => {
  return res.json({ state: polarBilling.getPublicState(localDb) });
});

app.get('/api/billing/plans', async (_req, res) => {
  try {
    return res.json(await polarBilling.getPlans());
  } catch (error) {
    return res.status(502).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.post('/api/billing/checkout', async (req, res) => {
  try {
    const planKey = typeof req.body?.planKey === 'string' ? req.body.planKey.trim() : '';
    const customerEmail = typeof req.body?.customerEmail === 'string' ? req.body.customerEmail : undefined;
    if (!planKey) return res.status(400).json({ error: 'planKey es obligatorio' });
    return res.status(201).json(await polarBilling.createCheckout({ planKey, customerEmail }));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(message.includes('no está configurado') || message.includes('no se ha configurado') ? 503 : 400).json({ error: message });
  }
});

app.post('/api/billing/portal', async (_req, res) => {
  try {
    return res.json(await polarBilling.createCustomerPortal(localDb));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(message.includes('no está configurado') || message.includes('no hay un cliente') ? 409 : 502).json({ error: message });
  }
});

app.post('/api/webhooks/polar', (req, res) => {
  try {
    const body = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}));
    const headers = Object.fromEntries(
      Object.entries(req.headers)
        .filter(([, value]) => typeof value === 'string')
        .map(([key, value]) => [key.toLowerCase(), String(value)])
    );
    const result = polarBilling.handleWebhook(body, headers, localDb);
    return res.status(202).json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof WebhookVerificationError) return res.status(403).json({ error: 'Firma de webhook inválida' });
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('POLAR_WEBHOOK_SECRET')) return res.status(503).json({ error: 'Webhook Polar no configurado' });
    console.error('[MorfEmail] Error procesando webhook Polar:', message);
    return res.status(500).json({ error: 'No se pudo procesar el webhook Polar' });
  }
});

app.get('/api/searches', (_req, res) => {
  res.json({ searches: localDb.listSearches() });
});

app.post('/api/searches', (req, res) => {
  try {
    const search = req.body as DbSearch;
    if (!search?.id || !search.query || !search.country || !search.country_code || !search.city || !search.category) {
      return res.status(400).json({ error: 'id, query, country, country_code, city y category son obligatorios' });
    }
    localDb.saveSearch({ ...search, status: search.status || 'queued', created_at: search.created_at || new Date().toISOString(), updated_at: new Date().toISOString() });
    return res.status(201).json({ search });
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.patch('/api/searches/:id', (req, res) => {
  localDb.updateSearch(req.params.id, req.body as Partial<DbSearch>);
  return res.json({ ok: true });
});

app.get('/api/leads', (req, res) => {
  const limit = Number(req.query.limit || 5000);
  const searchId = typeof req.query.searchId === 'string' ? req.query.searchId : undefined;
  return res.json({ leads: localDb.listLeads(searchId, limit) });
});

app.post('/api/leads', (req, res) => {
  try {
    const lead = req.body as NormalizedLead;
    if (!lead?.id || !lead.businessName || !lead.website || !lead.domain || !lead.sourceUrl) {
      return res.status(400).json({ error: 'lead incompleto: id, businessName, website, domain y sourceUrl son obligatorios' });
    }
    localDb.upsertLead(lead, typeof req.body.searchId === 'string' ? req.body.searchId : undefined);
    return res.status(201).json({ lead });
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.delete('/api/leads/:id', (req, res) => {
  localDb.deleteLead(req.params.id);
  return res.status(204).send();
});

app.post('/api/exports', (req, res) => {
  localDb.recordExport(req.body as DbExportRecord);
  return res.status(201).json({ ok: true });
});

app.post('/api/crawl/start', (req, res) => {
  try {
    const { searchId, query, config } = req.body as { searchId?: string; query?: DiscoveryInput; config?: Record<string, unknown> };
    if (!searchId || !query?.country || !query.countryCode || !query.category || !query.city) {
      return res.status(400).json({ error: 'searchId y query.country, query.countryCode, query.city y query.category son obligatorios' });
    }
    if (!localDb.getSearch(searchId)) {
      const now = new Date().toISOString();
      localDb.saveSearch({
        id: searchId,
        query: query.targetDomain ? `TARGET DOMAIN ${query.targetDomain}` : `${query.category} en ${query.city}, ${query.country}`,
        country: query.country,
        country_code: query.countryCode,
        state: query.state,
        city: query.city,
        category: query.category,
        target_domain: query.targetDomain,
        contact_type: query.targetDomain ? 'specific_domain' : 'b2b_recommended',
        leads_found: 0,
        exported_count: 0,
        duration_sec: 0,
        status: 'running',
        created_at: now,
        updated_at: now
      });
    }
    const job = CrawlJobManager.start(searchId, query as any, {
      mode: config?.mode === 'browser' || config?.mode === 'fast' ? config.mode : 'auto',
      maxConcurrency: Math.min(12, Math.max(1, Number(config?.maxConcurrency || 8))),
      browserConcurrency: Math.min(2, Math.max(1, Number(config?.browserConcurrency || 2))),
      headless: config?.headless !== false,
      requestTimeoutMs: Math.min(25000, Math.max(4000, Number(config?.requestTimeoutMs || 12000))),
      maxRetries: Math.min(5, Math.max(0, Number(config?.maxRetries ?? 2))),
      rateLimitPerDomainMs: Math.max(250, Number(config?.rateLimitPerDomainMs || 800)),
      respectRobotsTxt: config?.respectRobotsTxt !== false,
      crawlDepth: Math.min(3, Math.max(1, Number(config?.crawlDepth || 2)))
    });
    return res.status(202).json(job);
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.get('/api/crawl/:id/status', (req, res) => {
  const job = CrawlJobManager.get(req.params.id);
  return job ? res.json(job) : res.status(404).json({ error: 'Crawl no encontrado' });
});

for (const action of ['pause', 'resume', 'stop'] as const) {
  app.post(`/api/crawl/:id/${action}`, (req, res) => {
    const changed = CrawlJobManager[action](req.params.id);
    return changed ? res.json({ ok: true }) : res.status(409).json({ error: `No se puede ${action} ese crawl` });
  });
}

app.post('/api/discovery', async (req, res) => {
  try {
    const input = req.body as DiscoveryInput;
    if (!input?.country || !input?.countryCode || !input?.category) {
      return res.status(400).json({ error: 'country, countryCode y category son obligatorios' });
    }

    const requestedLimit = Math.max(1, Number(input.limit || 20));
    const effectiveLimit = Math.min(requestedLimit, MAX_DISCOVERY_RESULTS);
    const bbox = await geocodeScope(input);
    const overpassQuery = buildOverpassQuery({ ...input, limit: effectiveLimit }, bbox);
    const { elements, endpoint } = await queryOverpass(overpassQuery);

    const seen = new Set<string>();
    const results: Array<Record<string, unknown>> = [];

    for (const element of elements) {
      const tags = element.tags || {};
      const name = tags.name || tags['brand'] || tags['operator'];
      if (!name) continue;

      const email = firstTag(tags, ['contact:email', 'email']);
      const phone = firstTag(tags, ['contact:phone', 'phone', 'contact:mobile', 'mobile']);
      const whatsapp = firstTag(tags, ['contact:whatsapp', 'whatsapp']);
      let website = normalizeWebsite(firstTag(tags, ['contact:website', 'website', 'url']));
      const domain = canonicalDomain(website);
      const businessKey = domain || `${element.type}:${element.id}`;
      if (seen.has(businessKey)) continue;
      seen.add(businessKey);

      const lat = element.lat ?? element.center?.lat;
      const lon = element.lon ?? element.center?.lon;
      results.push({
        title: name,
        websiteUrl: website,
        domain,
        snippet: tags.description || tags['short_name'] || '',
        category: input.category,
        city: tags['addr:city'] || tags['addr:town'] || input.city || '',
        country: input.country,
        estimatedAddress: buildAddress(tags),
        estimatedPhone: phone,
        estimatedEmail: email,
        estimatedWhatsapp: whatsapp,
        latitude: lat,
        longitude: lon,
        osmType: element.type,
        osmId: element.id,
        source: `OpenStreetMap / Overpass (${endpoint})`
      });

      if (results.length >= effectiveLimit) break;
    }

    return res.json({
      results,
      count: results.length,
      requestedLimit,
      effectiveLimit,
      attribution: '© OpenStreetMap contributors, ODbL 1.0',
      localDevelopmentNote:
        'Los endpoints públicos de OSM se usan únicamente para pruebas locales moderadas. Para producción comercial configura una instancia propia o proveedor compatible.'
    });
  } catch (error: any) {
    return res.status(502).json({ error: error?.message || 'Error de discovery' });
  }
});

app.post('/api/fetch-page', async (req, res) => {
  try {
    const rawUrl = String(req.body?.url || '');
    const timeoutMs = Math.min(20_000, Math.max(2_000, Number(req.body?.timeoutMs || 10_000)));
    const result = await fetchHtmlSafely(rawUrl, timeoutMs);
    return res.json(result);
  } catch (error: any) {
    return res.status(502).json({ error: error?.message || 'No se pudo descargar la página' });
  }
});

app.post('/api/render-page', async (req, res) => {
  let page: Awaited<ReturnType<Browser['newPage']>> | null = null;
  try {
    const rawUrl = String(req.body?.url || '');
    const timeoutMs = Math.min(25_000, Math.max(4_000, Number(req.body?.timeoutMs || 15_000)));
    await assertPublicUrl(rawUrl);

    const browser = await getBrowser();
    page = await browser.newPage({
      userAgent: USER_AGENT,
      locale: 'es-ES'
    });

    await page.route('**/*', async (route) => {
      const request = route.request();
      if (['image', 'media', 'font'].includes(request.resourceType())) return route.abort();
      try {
        const requestUrl = new URL(request.url());
        if (!['http:', 'https:'].includes(requestUrl.protocol)) return route.abort();
        const host = requestUrl.hostname.toLowerCase();
        if (host === 'localhost' || host.endsWith('.local')) return route.abort();
        return route.continue();
      } catch {
        return route.abort();
      }
    });

    const response = await page.goto(rawUrl, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
    await page.waitForLoadState('networkidle', { timeout: 2_000 }).catch(() => undefined);
    const html = await page.content();

    return res.json({
      html,
      statusCode: response?.status() || 200,
      finalUrl: page.url(),
      contentType: 'text/html; rendered=playwright'
    });
  } catch (error: any) {
    return res.status(502).json({
      error:
        error?.message ||
        'No se pudo renderizar la página. Ejecuta `npm run setup:browser` para instalar Chromium.'
    });
  } finally {
    await page?.close().catch(() => undefined);
  }
});

const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`[MorfEmail] Local engine activo en http://127.0.0.1:${PORT}`);
  console.log('[MorfEmail] Discovery real: OpenStreetMap/Overpass. Crawling: HTTP + Playwright opcional.');
});

async function shutdown() {
  server.close();
  localDb.close();
  if (browserPromise) {
    const browser = await browserPromise.catch(() => null);
    await browser?.close().catch(() => undefined);
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
