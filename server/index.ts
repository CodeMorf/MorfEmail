import express from 'express';
import { lookup } from 'node:dns/promises';
import net from 'node:net';
import { chromium, type Browser } from 'playwright';

const app = express();
app.use(express.json({ limit: '256kb' }));

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

const MAX_DISCOVERY_RESULTS = 250;
const MAX_HTML_BYTES = 3 * 1024 * 1024;
const geocodeCache = new Map<string, { expiresAt: number; bbox: [number, number, number, number] }>();
const hostLastAccess = new Map<string, number>();
let lastNominatimRequestAt = 0;
let browserPromise: Promise<Browser> | null = null;

interface DiscoveryInput {
  country: string;
  countryCode: string;
  state?: string;
  city?: string;
  category: string;
  limit?: number;
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

function deriveWebsiteFromBusinessEmail(email: string): string {
  const match = email.trim().toLowerCase().match(/^[^@\s]+@([^@\s]+)$/);
  if (!match) return '';
  const domain = match[1];
  const freeProviders = new Set([
    'gmail.com',
    'googlemail.com',
    'outlook.com',
    'hotmail.com',
    'live.com',
    'yahoo.com',
    'icloud.com',
    'proton.me',
    'protonmail.com',
    'aol.com'
  ]);
  if (freeProviders.has(domain)) return '';
  return normalizeWebsite(domain);
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
  url.searchParams.set('q', [city, state, input.country].filter(Boolean).join(', '));
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '1');
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
  const results = (await response.json()) as Array<{ boundingbox?: string[] }>;
  const bbox = results[0]?.boundingbox;
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

  for (const endpoint of OVERPASS_URLS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30_000);
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
  res.json({ ok: true, service: 'MorfEmail Local Engine', version: '2.1-local' });
});

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
      if (!website && email) website = deriveWebsiteFromBusinessEmail(email);
      if (!website) continue;

      const domain = canonicalDomain(website);
      if (!domain || seen.has(domain)) continue;
      seen.add(domain);

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
  if (browserPromise) {
    const browser = await browserPromise.catch(() => null);
    await browser?.close().catch(() => undefined);
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
