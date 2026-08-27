-- ==============================================================================
-- MorfEmail Local Database Schema (SQLite 3)
-- Arquitectura de almacenamiento relacional para escritorio Windows (Tauri 2)
-- ==============================================================================

PRAGMA foreign_keys = ON;

-- 1. searches: Registro de tareas de búsqueda y filtros
CREATE TABLE IF NOT EXISTS searches (
    id TEXT PRIMARY KEY,
    query TEXT NOT NULL,
    country TEXT NOT NULL,
    country_code TEXT NOT NULL,
    state TEXT,
    city TEXT NOT NULL,
    category TEXT NOT NULL,
    target_domain TEXT,
    contact_type TEXT DEFAULT 'b2b_recommended',
    leads_found INTEGER DEFAULT 0,
    exported_count INTEGER DEFAULT 0,
    duration_sec INTEGER DEFAULT 0,
    status TEXT CHECK(status IN ('queued', 'running', 'paused', 'completed', 'cancelled', 'failed')) DEFAULT 'queued',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. websites: Dominios rastreados y estado de acceso
CREATE TABLE IF NOT EXISTS websites (
    id TEXT PRIMARY KEY,
    domain TEXT UNIQUE NOT NULL,
    root_url TEXT NOT NULL,
    http_status INTEGER,
    has_spa_framework INTEGER DEFAULT 0,
    crawled_with TEXT CHECK(crawled_with IN ('cheerio', 'playwright')),
    access_status TEXT CHECK(access_status IN ('ok', 'blocked', 'restricted', 'login_required', 'robots_restricted', 'timeout')) DEFAULT 'ok',
    discovered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_crawled_at DATETIME
);

-- 3. leads: Empresas y prospectos descubiertos
CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    search_id TEXT REFERENCES searches(id) ON DELETE SET NULL,
    website_id TEXT REFERENCES websites(id) ON DELETE SET NULL,
    business_name TEXT NOT NULL,
    category TEXT,
    website TEXT NOT NULL,
    domain TEXT NOT NULL,
    primary_email TEXT,
    email_status TEXT CHECK(email_status IN ('valid', 'risky', 'invalid', 'unverified')) DEFAULT 'unverified',
    primary_phone TEXT,
    whatsapp TEXT,
    address TEXT,
    city TEXT,
    region TEXT,
    postal_code TEXT,
    country TEXT,
    country_code TEXT,
    confidence_score INTEGER DEFAULT 50,
    source_url TEXT,
    list_id TEXT,
    notes TEXT,
    discovered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. contacts: Múltiples emails y teléfonos secundarios por empresa
CREATE TABLE IF NOT EXISTS contacts (
    id TEXT PRIMARY KEY,
    lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    type TEXT CHECK(type IN ('email', 'phone', 'whatsapp', 'name')),
    value TEXT NOT NULL,
    label TEXT, -- e.g. 'ventas', 'gerencia', 'soporte'
    is_primary INTEGER DEFAULT 0,
    verified INTEGER DEFAULT 0,
    discovered_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. social_profiles: Perfiles sociales corporativos verificados
CREATE TABLE IF NOT EXISTS social_profiles (
    id TEXT PRIMARY KEY,
    lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    platform TEXT CHECK(platform IN ('facebook', 'instagram', 'linkedin', 'twitter', 'tiktok', 'youtube')),
    profile_url TEXT NOT NULL,
    discovered_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. crawl_queue: Cola persistente para reanudar búsquedas tras reinicio
CREATE TABLE IF NOT EXISTS crawl_queue (
    id TEXT PRIMARY KEY,
    search_id TEXT REFERENCES searches(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    domain TEXT NOT NULL,
    depth INTEGER DEFAULT 1,
    max_depth INTEGER DEFAULT 2,
    parent_url TEXT,
    retry_count INTEGER DEFAULT 0,
    status TEXT CHECK(status IN ('pending', 'in_progress', 'completed', 'failed')) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. crawl_history: Registro de actividad detallado por petición
CREATE TABLE IF NOT EXISTS crawl_history (
    id TEXT PRIMARY KEY,
    search_id TEXT REFERENCES searches(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    domain TEXT NOT NULL,
    status TEXT NOT NULL,
    message TEXT NOT NULL,
    parser TEXT,
    duration_ms INTEGER DEFAULT 0,
    discovered_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 8. exports: Registro de descargas de listas y archivos exportados
CREATE TABLE IF NOT EXISTS exports (
    id TEXT PRIMARY KEY,
    file_name TEXT NOT NULL,
    format TEXT CHECK(format IN ('csv', 'xlsx', 'json')) NOT NULL,
    record_count INTEGER NOT NULL,
    file_size_bytes INTEGER DEFAULT 0,
    destination_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 9. settings: Preferencias locales del software
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 10. licenses: Estado de licencia comercial y suscripción Polar.sh
CREATE TABLE IF NOT EXISTS licenses (
    license_key TEXT PRIMARY KEY,
    status TEXT CHECK(status IN ('active', 'expired', 'unregistered', 'revoked')) DEFAULT 'unregistered',
    plan_name TEXT,
    billing_period TEXT DEFAULT 'annual',
    polar_customer_id TEXT,
    polar_subscription_id TEXT,
    hardware_id TEXT,
    valid_until DATETIME,
    last_verified_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índices de optimización para deduplicación rápida
CREATE INDEX IF NOT EXISTS idx_leads_domain ON leads(domain);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(primary_email);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(primary_phone);
CREATE INDEX IF NOT EXISTS idx_websites_domain ON websites(domain);
CREATE INDEX IF NOT EXISTS idx_queue_status ON crawl_queue(status);
