export type ActiveView =
  | 'dashboard'
  | 'new-search'
  | 'search-progress'
  | 'results'
  | 'history'
  | 'lists'
  | 'verifier'
  | 'duplicates'
  | 'exports'
  | 'morf-ai'
  | 'license'
  | 'plan-usage'
  | 'settings';

export interface Lead {
  id: string;
  companyName: string;
  category: string;
  country: string;
  countryCode: string;
  flag: string;
  state: string;
  city: string;
  address: string;
  postalCode: string;
  email: string;
  phone: string;
  whatsapp?: string;
  website: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  verified: 'verified' | 'risky' | 'unverified';
  confidenceScore: number;
  extractedAt: string;
  source: string;
  listId?: string;
  notes?: string;
}

export interface SearchConfig {
  country: string;
  countryCode: string;
  flag: string;
  state: string;
  city: string;
  businessType: string;
  fieldsToFind: {
    companyName: boolean;
    businessEmail: boolean;
    phone: boolean;
    website: boolean;
    whatsapp: boolean;
    address: boolean;
    facebook: boolean;
    instagram: boolean;
    linkedin: boolean;
    category: boolean;
    city: boolean;
    postalCode: boolean;
  };
  contactType: 'b2b_recommended' | 'all_business' | 'specific_domain';
  targetDomain?: string;
  quantity: number;
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  country: string;
  flag: string;
  city: string;
  category: string;
  leadsFound: number;
  exportedCount: number;
  duration: string;
  status: 'completed' | 'processing' | 'paused' | 'failed';
  date: string;
  config?: Partial<SearchConfig>;
}

export interface LeadList {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  leadCount: number;
  updatedAt: string;
}

export interface EmailVerificationItem {
  id: string;
  email: string;
  syntax: boolean;
  domain: string;
  mxRecord: boolean;
  smtpCheck: boolean;
  status: 'valid' | 'risky' | 'invalid' | 'unknown';
  confidence: number;
  reason?: string;
  mxRecords?: { priority: number; exchange: string }[];
  nullMx?: boolean;
  disposable?: boolean;
  freeProvider?: boolean;
  catchAll?: boolean | null;
  checkedAt?: string;
}

export interface MorfAiMessage {
  id: string;
  sender: 'user' | 'morf-ai';
  text: string;
  timestamp: string;
  suggestedAction?: {
    label: string;
    actionType: 'start-search' | 'verify-leads' | 'export-format' | 'view-lead';
    payload?: any;
  };
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message?: string;
}

export type ScheduleInterval = 'hourly_6' | 'daily' | 'weekly' | 'biweekly' | 'monthly';

export interface ScheduledSearch {
  id: string;
  title: string;
  category: string;
  country: string;
  countryCode: string;
  flag: string;
  state?: string;
  city?: string;
  interval: ScheduleInterval;
  targetListId: string;
  targetListName: string;
  status: 'active' | 'paused';
  lastRun: string;
  nextRun: string;
  leadsHarvestedTotal: number;
  newLeadsLastRun: number;
  autoVerifyEmails: boolean;
  autoDeduplicate: boolean;
  notifyEmail: boolean;
  quantityPerRun: number;
  createdAt: string;
}

export type AiProviderType = 'openai' | 'gemini' | 'codemorf' | 'custom';

export interface AiConfig {
  activeProvider: AiProviderType;
  openai: {
    apiKey: string;
    model: string;
    organization?: string;
  };
  gemini: {
    apiKey: string;
    model: string;
  };
  codemorf: {
    apiKey: string;
    model: string;
    creditsRemaining: number;
  };
  custom: {
    providerName: string;
    baseUrl: string;
    apiKey: string;
    model: string;
  };
}

export interface ProxyConfig {
  enabled: boolean;
  protocol: 'http' | 'https' | 'socks5';
  host: string;
  port: number | string;
  username?: string;
  password?: string;
  bypassLocal: boolean;
  rotatePerRequest: boolean;
  routeAiRequests: boolean;
  routeScraping: boolean;
  routeEmailVerifier: boolean;
  status: 'connected' | 'idle' | 'testing' | 'error';
  lastTestedIp?: string;
  latencyMs?: number;
}

export interface PolarLicense {
  licenseKey: string;
  status: 'active' | 'expired' | 'unregistered' | 'revoked';
  billingPeriod: 'annual';
  planName: string;
  polarCustomerId: string;
  polarSubscriptionId: string;
  activationSeatsTotal: number;
  activationSeatsUsed: number;
  hardwareId: string;
  validUntil: string;
  portalUrl: string;
  polarDocsUrl: string;
  polarCheckoutAnnualUrl: string;
  lastVerifiedAt: string;
}

