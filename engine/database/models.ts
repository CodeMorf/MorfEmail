/**
 * Database Models - MorfEmail SQLite Data Layer
 * Mapeo de entidades SQLite para búsquedas, leads, dominios y colas.
 */

export interface DbSearch {
  id: string;
  query: string;
  country: string;
  country_code: string;
  state?: string;
  city: string;
  category: string;
  target_domain?: string;
  contact_type: string;
  leads_found: number;
  exported_count: number;
  duration_sec: number;
  status: 'queued' | 'running' | 'paused' | 'completed' | 'cancelled' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface DbWebsite {
  id: string;
  domain: string;
  root_url: string;
  http_status?: number;
  has_spa_framework: number;
  crawled_with: 'cheerio' | 'playwright';
  access_status: 'ok' | 'blocked' | 'restricted' | 'login_required' | 'robots_restricted' | 'timeout';
  discovered_at: string;
  last_crawled_at?: string;
}

export interface DbLead {
  id: string;
  search_id?: string;
  website_id?: string;
  business_name: string;
  category?: string;
  website: string;
  domain: string;
  primary_email?: string;
  email_status: 'valid' | 'risky' | 'invalid' | 'unverified';
  primary_phone?: string;
  whatsapp?: string;
  address?: string;
  city?: string;
  region?: string;
  postal_code?: string;
  country?: string;
  country_code?: string;
  confidence_score: number;
  source_url?: string;
  list_id?: string;
  notes?: string;
  discovered_at: string;
  updated_at: string;
}

export interface DbContact {
  id: string;
  lead_id: string;
  type: 'email' | 'phone' | 'whatsapp' | 'name';
  value: string;
  label?: string;
  is_primary: number;
  verified: number;
  discovered_at: string;
}

export interface DbSocialProfile {
  id: string;
  lead_id: string;
  platform: 'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'tiktok' | 'youtube';
  profile_url: string;
  discovered_at: string;
}

export interface DbCrawlQueueItem {
  id: string;
  search_id: string;
  url: string;
  domain: string;
  depth: number;
  max_depth: number;
  parent_url?: string;
  retry_count: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'restricted';
  created_at: string;
}

export interface DbExportRecord {
  id: string;
  file_name: string;
  format: 'csv' | 'xlsx' | 'json' | 'txt';
  record_count: number;
  file_size_bytes: number;
  destination_path?: string;
  created_at: string;
}

export interface DbBillingState {
  id: 1;
  status: string;
  environment: 'production' | 'sandbox';
  plan_name?: string;
  product_id?: string;
  polar_customer_id?: string;
  polar_subscription_id?: string;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end?: number;
  last_event_at?: string;
  updated_at: string;
}

export interface DbBillingEvent {
  event_id: string;
  event_type: string;
  payload_json: string;
  received_at: string;
}
