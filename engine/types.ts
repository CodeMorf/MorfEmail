/**
 * MorfEmail Engine - Core Types & Interfaces
 * Arquitectura modular para Crawlee, Playwright, Cheerio, MorfExtractor y SQLite.
 */

export type CrawlMode = 'fast' | 'browser' | 'auto';
export type CrawlStatus = 'idle' | 'queued' | 'running' | 'paused' | 'completed' | 'cancelled' | 'failed';

export interface CrawlStatistics {
  pagesAnalyzed: number;
  businessesFound: number;
  emailsFound: number;
  phonesFound: number;
  whatsappFound: number;
  errorsCount: number;
  speedPagesPerMin: number;
  elapsedTimeSec: number;
  currentUrl?: string;
  activeWorkers: number;
  maxWorkers: number;
}

export interface CrawlLogEntry {
  id: string;
  timestamp: string;
  url: string;
  domain: string;
  status: 'analyzing' | 'success' | 'warning' | 'error' | 'restricted' | 'skipped';
  message: string;
  details?: {
    emails?: number;
    phones?: number;
    whatsapp?: boolean;
    socials?: number;
    statusCode?: number;
    parser?: 'cheerio' | 'playwright';
  };
}

export interface CrawlRequest {
  id: string;
  url: string;
  depth: number;
  maxDepth: number;
  parentUrl?: string;
  domain: string;
  retryCount: number;
  category?: string;
  city?: string;
  country?: string;
  forceBrowser?: boolean;
}

export interface DiscoveryResult {
  title: string;
  websiteUrl: string;
  domain: string;
  snippet?: string;
  category?: string;
  city?: string;
  country?: string;
  estimatedAddress?: string;
  estimatedPhone?: string;
  estimatedEmail?: string;
  source: string;
}

export interface DiscoveryQuery {
  country: string;
  countryCode: string;
  state?: string;
  city: string;
  category: string;
  limit: number;
  targetDomain?: string;
}

export interface DiscoveryProvider {
  name: string;
  search(query: DiscoveryQuery): Promise<DiscoveryResult[]>;
}

export interface RawExtractedData {
  url: string;
  domain: string;
  title?: string;
  metaDescription?: string;
  h1?: string[];
  businessName?: string;
  category?: string;
  emails: string[];
  phones: Array<{
    countryCode?: string;
    nationalNumber?: string;
    formattedNumber: string;
    type?: string;
  }>;
  whatsapp?: string;
  socials: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    twitter?: string;
    tiktok?: string;
    youtube?: string;
  };
  address?: {
    street?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    country?: string;
    formattedAddress?: string;
  };
  jsonLdSchemas?: any[];
  contactPageUrls?: string[];
  aboutPageUrls?: string[];
  confidenceScore: number;
  discoveredAt: string;
  httpStatus?: number;
  renderedWith: 'cheerio' | 'playwright';
}

export interface NormalizedLead {
  id: string;
  businessName: string;
  category: string;
  website: string;
  domain: string;
  email: string;
  emailStatus: 'valid' | 'risky' | 'invalid' | 'unverified';
  additionalEmails?: string[];
  phone: string;
  additionalPhones?: string[];
  whatsapp?: string;
  address: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  countryCode: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  twitter?: string;
  tiktok?: string;
  youtube?: string;
  sourceUrl: string;
  discoveredAt: string;
  updatedAt: string;
  confidenceScore: number;
  notes?: string;
  listId?: string;
}

export interface CrawlerConfig {
  mode: CrawlMode;
  maxConcurrency: number;
  browserConcurrency: number;
  headless: boolean;
  requestTimeoutMs: number;
  maxRetries: number;
  rateLimitPerDomainMs: number;
  respectRobotsTxt: boolean;
  crawlDepth: number; // e.g. 1 = main page only, 2 = follow /contact, /about
  proxyEnabled?: boolean;
}

export interface IntelligentExtractor {
  extract(content: string, schema: Record<string, any>): Promise<Record<string, any>>;
}
