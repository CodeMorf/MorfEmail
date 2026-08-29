-- MorfEmail Local SQLite schema. The Node API applies this schema with
-- better-sqlite3 and keeps the database under data/morfemail.db.
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS searches (
  id TEXT PRIMARY KEY, query TEXT NOT NULL, country TEXT NOT NULL,
  country_code TEXT NOT NULL, state TEXT, city TEXT NOT NULL, category TEXT NOT NULL,
  target_domain TEXT, contact_type TEXT NOT NULL DEFAULT 'b2b_recommended',
  leads_found INTEGER NOT NULL DEFAULT 0, exported_count INTEGER NOT NULL DEFAULT 0,
  duration_sec INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK(status IN ('queued','running','paused','completed','cancelled','failed')) DEFAULT 'queued',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY, search_id TEXT REFERENCES searches(id) ON DELETE SET NULL,
  business_name TEXT NOT NULL, category TEXT, website TEXT NOT NULL, domain TEXT NOT NULL,
  email_status TEXT NOT NULL DEFAULT 'unverified', primary_email TEXT, primary_phone TEXT,
  whatsapp TEXT, address TEXT, city TEXT, region TEXT, postal_code TEXT, country TEXT,
  country_code TEXT, confidence_score INTEGER NOT NULL DEFAULT 0, source_url TEXT,
  notes TEXT, list_id TEXT, discovered_at TEXT NOT NULL, updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS lead_emails (
  id TEXT PRIMARY KEY, lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  email TEXT NOT NULL, source_url TEXT NOT NULL, domain TEXT NOT NULL,
  discovered_at TEXT NOT NULL, UNIQUE(lead_id, email)
);

CREATE TABLE IF NOT EXISTS lead_phones (
  id TEXT PRIMARY KEY, lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  raw TEXT NOT NULL, normalized TEXT NOT NULL, country TEXT, valid INTEGER NOT NULL DEFAULT 0,
  discovered_at TEXT NOT NULL, UNIQUE(lead_id, normalized)
);

CREATE TABLE IF NOT EXISTS lead_socials (
  id TEXT PRIMARY KEY, lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, profile_url TEXT NOT NULL, discovered_at TEXT NOT NULL,
  UNIQUE(lead_id, platform, profile_url)
);

CREATE TABLE IF NOT EXISTS crawl_urls (
  id TEXT PRIMARY KEY, search_id TEXT REFERENCES searches(id) ON DELETE CASCADE,
  url TEXT NOT NULL, domain TEXT NOT NULL, depth INTEGER NOT NULL DEFAULT 1,
  max_depth INTEGER NOT NULL DEFAULT 2, parent_url TEXT, retry_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK(status IN ('pending','in_progress','completed','failed','restricted')) DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(search_id, url)
);

CREATE TABLE IF NOT EXISTS crawl_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT, search_id TEXT REFERENCES searches(id) ON DELETE CASCADE,
  url TEXT NOT NULL, domain TEXT, status TEXT NOT NULL, message TEXT NOT NULL,
  parser TEXT, duration_ms INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exports (
  id TEXT PRIMARY KEY, file_name TEXT NOT NULL, format TEXT NOT NULL,
  record_count INTEGER NOT NULL, file_size_bytes INTEGER NOT NULL DEFAULT 0,
  destination_path TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS billing_state (
  id INTEGER PRIMARY KEY CHECK(id = 1), status TEXT NOT NULL,
  environment TEXT NOT NULL CHECK(environment IN ('production','sandbox')),
  plan_name TEXT, product_id TEXT, polar_customer_id TEXT, polar_subscription_id TEXT,
  current_period_start TEXT, current_period_end TEXT,
  cancel_at_period_end INTEGER NOT NULL DEFAULT 0, last_event_at TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS billing_events (
  event_id TEXT PRIMARY KEY, event_type TEXT NOT NULL,
  payload_json TEXT NOT NULL, received_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_leads_domain ON leads(domain);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(primary_email);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(primary_phone);
CREATE INDEX IF NOT EXISTS idx_leads_search_id ON leads(search_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(email_status);
CREATE INDEX IF NOT EXISTS idx_crawl_urls_status ON crawl_urls(status);
CREATE INDEX IF NOT EXISTS idx_crawl_events_search_id ON crawl_events(search_id);
