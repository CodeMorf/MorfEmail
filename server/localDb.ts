import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import type { DbBillingEvent, DbBillingState, DbExportRecord, DbSearch } from '../engine/database/models';
import type { NormalizedLead } from '../engine/types';

export interface StoredCrawlEvent {
  searchId?: string;
  url: string;
  domain?: string;
  status: string;
  message: string;
  parser?: 'cheerio' | 'playwright';
  durationMs?: number;
}

export interface StoredCrawlUrl {
  id: string;
  searchId: string;
  url: string;
  domain: string;
  depth: number;
  maxDepth: number;
  parentUrl?: string;
  retryCount?: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'restricted';
}

export class LocalDb {
  private readonly db: Database.Database;

  constructor(dbPath = process.env.MORFEMAIL_DB_PATH || path.resolve('data/morfemail.db')) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('foreign_keys = ON');
    this.migrate();
  }

  private migrate(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS searches (
        id TEXT PRIMARY KEY,
        query TEXT NOT NULL,
        country TEXT NOT NULL,
        country_code TEXT NOT NULL,
        state TEXT,
        city TEXT NOT NULL,
        category TEXT NOT NULL,
        target_domain TEXT,
        contact_type TEXT NOT NULL DEFAULT 'b2b_recommended',
        leads_found INTEGER NOT NULL DEFAULT 0,
        exported_count INTEGER NOT NULL DEFAULT 0,
        duration_sec INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL CHECK(status IN ('queued','running','paused','completed','cancelled','failed')) DEFAULT 'queued',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY,
        search_id TEXT REFERENCES searches(id) ON DELETE SET NULL,
        business_name TEXT NOT NULL,
        category TEXT,
        website TEXT NOT NULL,
        domain TEXT NOT NULL,
        email_status TEXT NOT NULL DEFAULT 'unverified',
        primary_email TEXT,
        primary_phone TEXT,
        whatsapp TEXT,
        address TEXT,
        city TEXT,
        region TEXT,
        postal_code TEXT,
        country TEXT,
        country_code TEXT,
        confidence_score INTEGER NOT NULL DEFAULT 0,
        source_url TEXT,
        notes TEXT,
        list_id TEXT,
        discovered_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS lead_emails (
        id TEXT PRIMARY KEY,
        lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        email TEXT NOT NULL,
        source_url TEXT NOT NULL,
        domain TEXT NOT NULL,
        discovered_at TEXT NOT NULL,
        UNIQUE(lead_id, email)
      );

      CREATE TABLE IF NOT EXISTS lead_phones (
        id TEXT PRIMARY KEY,
        lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        raw TEXT NOT NULL,
        normalized TEXT NOT NULL,
        country TEXT,
        valid INTEGER NOT NULL DEFAULT 0,
        discovered_at TEXT NOT NULL,
        UNIQUE(lead_id, normalized)
      );

      CREATE TABLE IF NOT EXISTS lead_socials (
        id TEXT PRIMARY KEY,
        lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        platform TEXT NOT NULL,
        profile_url TEXT NOT NULL,
        discovered_at TEXT NOT NULL,
        UNIQUE(lead_id, platform, profile_url)
      );

      CREATE TABLE IF NOT EXISTS crawl_urls (
        id TEXT PRIMARY KEY,
        search_id TEXT REFERENCES searches(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        domain TEXT NOT NULL,
        depth INTEGER NOT NULL DEFAULT 1,
        max_depth INTEGER NOT NULL DEFAULT 2,
        parent_url TEXT,
        retry_count INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL CHECK(status IN ('pending','in_progress','completed','failed','restricted')) DEFAULT 'pending',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(search_id, url)
      );

      CREATE TABLE IF NOT EXISTS crawl_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        search_id TEXT REFERENCES searches(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        domain TEXT,
        status TEXT NOT NULL,
        message TEXT NOT NULL,
        parser TEXT,
        duration_ms INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS exports (
        id TEXT PRIMARY KEY,
        file_name TEXT NOT NULL,
        format TEXT NOT NULL CHECK(format IN ('csv','xlsx','json','txt')),
        record_count INTEGER NOT NULL,
        file_size_bytes INTEGER NOT NULL DEFAULT 0,
        destination_path TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS billing_state (
        id INTEGER PRIMARY KEY CHECK(id = 1),
        status TEXT NOT NULL,
        environment TEXT NOT NULL CHECK(environment IN ('production','sandbox')),
        plan_name TEXT,
        product_id TEXT,
        polar_customer_id TEXT,
        polar_subscription_id TEXT,
        current_period_start TEXT,
        current_period_end TEXT,
        cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
        last_event_at TEXT,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS billing_events (
        event_id TEXT PRIMARY KEY,
        event_type TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        received_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_leads_domain ON leads(domain);
      CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(primary_email);
      CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(primary_phone);
      CREATE INDEX IF NOT EXISTS idx_leads_search_id ON leads(search_id);
      CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(email_status);
      CREATE INDEX IF NOT EXISTS idx_crawl_urls_status ON crawl_urls(status);
      CREATE INDEX IF NOT EXISTS idx_crawl_events_search_id ON crawl_events(search_id);
    `);
  }

  public saveSearch(search: DbSearch): void {
    this.db.prepare(`
      INSERT INTO searches (
        id, query, country, country_code, state, city, category, target_domain,
        contact_type, leads_found, exported_count, duration_sec, status, created_at, updated_at
      ) VALUES (@id, @query, @country, @country_code, @state, @city, @category, @target_domain,
        @contact_type, @leads_found, @exported_count, @duration_sec, @status, @created_at, @updated_at)
      ON CONFLICT(id) DO UPDATE SET
        query=excluded.query, country=excluded.country, country_code=excluded.country_code,
        state=excluded.state, city=excluded.city, category=excluded.category,
        target_domain=excluded.target_domain, contact_type=excluded.contact_type,
        leads_found=excluded.leads_found, exported_count=excluded.exported_count,
        duration_sec=excluded.duration_sec, status=excluded.status, updated_at=excluded.updated_at
    `).run({ ...search, state: search.state || null, target_domain: search.target_domain || null });
  }

  public updateSearch(id: string, patch: Partial<DbSearch>): void {
    const allowed = ['leads_found', 'exported_count', 'duration_sec', 'status', 'updated_at'] as const;
    const entries = Object.entries(patch).filter(([key]) => allowed.includes(key as (typeof allowed)[number]));
    if (entries.length === 0) return;
    const assignments = entries.map(([key]) => `${key} = @${key}`).join(', ');
    this.db.prepare(`UPDATE searches SET ${assignments}, updated_at = @updated_at WHERE id = @id`).run({
      id,
      ...Object.fromEntries(entries),
      updated_at: patch.updated_at || new Date().toISOString()
    });
  }

  public listSearches(): DbSearch[] {
    return this.db.prepare(`
      SELECT id, query, country, country_code, state, city, category, target_domain,
        contact_type, leads_found, exported_count, duration_sec, status, created_at, updated_at
      FROM searches ORDER BY created_at DESC
    `).all() as DbSearch[];
  }

  public getSearch(id: string): DbSearch | undefined {
    return this.db.prepare(`
      SELECT id, query, country, country_code, state, city, category, target_domain,
        contact_type, leads_found, exported_count, duration_sec, status, created_at, updated_at
      FROM searches WHERE id = ?
    `).get(id) as DbSearch | undefined;
  }

  public upsertLead(lead: NormalizedLead, searchId?: string): void {
    const tx = this.db.transaction(() => {
      this.db.prepare(`
        INSERT INTO leads (
          id, search_id, business_name, category, website, domain, email_status, primary_email,
          primary_phone, whatsapp, address, city, region, postal_code, country, country_code,
          confidence_score, source_url, notes, list_id, discovered_at, updated_at
        ) VALUES (@id, @searchId, @businessName, @category, @website, @domain, @emailStatus, @email,
          @phone, @whatsapp, @address, @city, @region, @postalCode, @country, @countryCode,
          @confidenceScore, @sourceUrl, @notes, @listId, @discoveredAt, @updatedAt)
        ON CONFLICT(id) DO UPDATE SET
          search_id=COALESCE(excluded.search_id, leads.search_id), business_name=excluded.business_name,
          category=excluded.category, website=excluded.website, domain=excluded.domain,
          email_status=excluded.email_status, primary_email=excluded.primary_email,
          primary_phone=excluded.primary_phone, whatsapp=excluded.whatsapp, address=excluded.address,
          city=excluded.city, region=excluded.region, postal_code=excluded.postal_code,
          country=excluded.country, country_code=excluded.country_code,
          confidence_score=excluded.confidence_score, source_url=excluded.source_url,
          notes=excluded.notes, list_id=excluded.list_id, updated_at=excluded.updated_at
      `).run({
        id: lead.id,
        searchId: searchId || null,
        businessName: lead.businessName,
        category: lead.category || null,
        website: lead.website,
        domain: lead.domain,
        emailStatus: lead.emailStatus,
        email: lead.email || null,
        phone: lead.phone || null,
        whatsapp: lead.whatsapp || null,
        address: lead.address || null,
        city: lead.city || null,
        region: lead.region || null,
        postalCode: lead.postalCode || null,
        country: lead.country || null,
        countryCode: lead.countryCode || null,
        confidenceScore: lead.confidenceScore,
        sourceUrl: lead.sourceUrl || null,
        notes: lead.notes || null,
        listId: lead.listId || null,
        discoveredAt: lead.discoveredAt,
        updatedAt: lead.updatedAt
      });

      this.db.prepare('DELETE FROM lead_emails WHERE lead_id = ?').run(lead.id);
      const addEmail = this.db.prepare(`INSERT OR IGNORE INTO lead_emails
        (id, lead_id, email, source_url, domain, discovered_at) VALUES (?, ?, ?, ?, ?, ?)`);
      for (const email of [lead.email, ...(lead.additionalEmails || [])].filter(Boolean)) {
        addEmail.run(`${lead.id}:email:${email}`, lead.id, email, lead.sourceUrl, lead.domain, lead.discoveredAt);
      }

      this.db.prepare('DELETE FROM lead_phones WHERE lead_id = ?').run(lead.id);
      const addPhone = this.db.prepare(`INSERT OR IGNORE INTO lead_phones
        (id, lead_id, raw, normalized, country, valid, discovered_at) VALUES (?, ?, ?, ?, ?, ?, ?)`);
      for (const phone of [lead.phone, ...(lead.additionalPhones || [])].filter(Boolean)) {
        addPhone.run(`${lead.id}:phone:${phone}`, lead.id, phone, phone, lead.countryCode, 1, lead.discoveredAt);
      }

      this.db.prepare('DELETE FROM lead_socials WHERE lead_id = ?').run(lead.id);
      const addSocial = this.db.prepare(`INSERT OR IGNORE INTO lead_socials
        (id, lead_id, platform, profile_url, discovered_at) VALUES (?, ?, ?, ?, ?)`);
      const socials = { facebook: lead.facebook, instagram: lead.instagram, linkedin: lead.linkedin, twitter: lead.twitter, tiktok: lead.tiktok, youtube: lead.youtube };
      for (const [platform, profileUrl] of Object.entries(socials)) {
        if (profileUrl) addSocial.run(`${lead.id}:${platform}`, lead.id, platform, profileUrl, lead.discoveredAt);
      }
    });
    tx();
  }

  public listLeads(searchId?: string, limit = 5000): NormalizedLead[] {
    const safeLimit = Math.max(1, Math.min(limit, 5000));
    const rows = (searchId
      ? this.db.prepare(`SELECT id, search_id AS searchId, business_name AS businessName, category, website, domain,
          email_status AS emailStatus, primary_email AS email, primary_phone AS phone, whatsapp,
          address, city, region, postal_code AS postalCode, country, country_code AS countryCode,
          confidence_score AS confidenceScore, source_url AS sourceUrl, notes, list_id AS listId,
          discovered_at AS discoveredAt, updated_at AS updatedAt FROM leads WHERE search_id = ? ORDER BY updated_at DESC LIMIT ?`)
      : this.db.prepare(`SELECT id, search_id AS searchId, business_name AS businessName, category, website, domain,
          email_status AS emailStatus, primary_email AS email, primary_phone AS phone, whatsapp,
          address, city, region, postal_code AS postalCode, country, country_code AS countryCode,
          confidence_score AS confidenceScore, source_url AS sourceUrl, notes, list_id AS listId,
          discovered_at AS discoveredAt, updated_at AS updatedAt FROM leads ORDER BY updated_at DESC LIMIT ?`)
    ).all(...(searchId ? [searchId, safeLimit] : [safeLimit])) as Array<NormalizedLead & { searchId?: string }>;

    const emails = this.db.prepare('SELECT lead_id, email FROM lead_emails ORDER BY discovered_at ASC').all() as Array<{ lead_id: string; email: string }>;
    const phones = this.db.prepare('SELECT lead_id, normalized FROM lead_phones ORDER BY discovered_at ASC').all() as Array<{ lead_id: string; normalized: string }>;
    const socials = this.db.prepare('SELECT lead_id, platform, profile_url FROM lead_socials').all() as Array<{ lead_id: string; platform: string; profile_url: string }>;
    const emailMap = new Map<string, string[]>();
    const phoneMap = new Map<string, string[]>();
    const socialMap = new Map<string, Record<string, string>>();
    for (const row of emails) emailMap.set(row.lead_id, [...(emailMap.get(row.lead_id) || []), row.email]);
    for (const row of phones) phoneMap.set(row.lead_id, [...(phoneMap.get(row.lead_id) || []), row.normalized]);
    for (const row of socials) socialMap.set(row.lead_id, { ...(socialMap.get(row.lead_id) || {}), [row.platform]: row.profile_url });

    return rows.map((row) => {
      const allEmails = emailMap.get(row.id) || [];
      const allPhones = phoneMap.get(row.id) || [];
      return {
        ...row,
        email: row.email || allEmails[0] || '',
        additionalEmails: allEmails.filter((email) => email !== row.email),
        phone: row.phone || allPhones[0] || '',
        additionalPhones: allPhones.filter((phone) => phone !== row.phone),
        ...(socialMap.get(row.id) || {})
      };
    });
  }

  public deleteLead(id: string): void {
    this.db.prepare('DELETE FROM leads WHERE id = ?').run(id);
  }

  public upsertCrawlUrl(item: StoredCrawlUrl): void {
    this.db.prepare(`
      INSERT INTO crawl_urls (id, search_id, url, domain, depth, max_depth, parent_url, retry_count, status, updated_at)
      VALUES (@id, @searchId, @url, @domain, @depth, @maxDepth, @parentUrl, @retryCount, @status, CURRENT_TIMESTAMP)
      ON CONFLICT(search_id, url) DO UPDATE SET
        retry_count=excluded.retry_count, status=excluded.status, updated_at=CURRENT_TIMESTAMP
    `).run({ ...item, parentUrl: item.parentUrl || null, retryCount: item.retryCount || 0 });
  }

  public recordCrawlEvent(event: StoredCrawlEvent): void {
    this.db.prepare(`INSERT INTO crawl_events
      (search_id, url, domain, status, message, parser, duration_ms) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(event.searchId || null, event.url, event.domain || null, event.status, event.message, event.parser || null, event.durationMs || 0);
  }

  public listCrawlEvents(searchId: string, limit = 100): Array<Record<string, unknown>> {
    return this.db.prepare(`SELECT id, url, domain, status, message, parser, duration_ms AS durationMs, created_at AS createdAt
      FROM crawl_events WHERE search_id = ? ORDER BY id DESC LIMIT ?`).all(searchId, Math.max(1, Math.min(limit, 500))) as Array<Record<string, unknown>>;
  }

  public recordExport(record: DbExportRecord): void {
    this.db.prepare(`INSERT OR REPLACE INTO exports
      (id, file_name, format, record_count, file_size_bytes, destination_path, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`).run(record.id, record.file_name, record.format, record.record_count, record.file_size_bytes, record.destination_path || null, record.created_at);
  }

  public getBillingState(): DbBillingState | undefined {
    return this.db.prepare(`
      SELECT id, status, environment, plan_name, product_id, polar_customer_id,
        polar_subscription_id, current_period_start, current_period_end,
        cancel_at_period_end, last_event_at, updated_at
      FROM billing_state WHERE id = 1
    `).get() as DbBillingState | undefined;
  }

  public saveBillingState(state: DbBillingState): void {
    this.db.prepare(`
      INSERT INTO billing_state (
        id, status, environment, plan_name, product_id, polar_customer_id,
        polar_subscription_id, current_period_start, current_period_end,
        cancel_at_period_end, last_event_at, updated_at
      ) VALUES (@id, @status, @environment, @plan_name, @product_id, @polar_customer_id,
        @polar_subscription_id, @current_period_start, @current_period_end,
        @cancel_at_period_end, @last_event_at, @updated_at)
      ON CONFLICT(id) DO UPDATE SET
        status=excluded.status, environment=excluded.environment, plan_name=excluded.plan_name,
        product_id=excluded.product_id, polar_customer_id=excluded.polar_customer_id,
        polar_subscription_id=excluded.polar_subscription_id,
        current_period_start=excluded.current_period_start,
        current_period_end=excluded.current_period_end,
        cancel_at_period_end=excluded.cancel_at_period_end,
        last_event_at=excluded.last_event_at, updated_at=excluded.updated_at
    `).run({
      ...state,
      plan_name: state.plan_name || null,
      product_id: state.product_id || null,
      polar_customer_id: state.polar_customer_id || null,
      polar_subscription_id: state.polar_subscription_id || null,
      current_period_start: state.current_period_start || null,
      current_period_end: state.current_period_end || null,
      cancel_at_period_end: state.cancel_at_period_end ? 1 : 0,
      last_event_at: state.last_event_at || null
    });
  }

  public recordBillingEvent(event: DbBillingEvent): boolean {
    const result = this.db.prepare(`
      INSERT OR IGNORE INTO billing_events (event_id, event_type, payload_json, received_at)
      VALUES (@event_id, @event_type, @payload_json, @received_at)
    `).run(event);
    return result.changes === 1;
  }

  public stats(): { leads: number; searches: number; crawlEvents: number } {
    const count = (table: string) => Number((this.db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get() as { count: number }).count || 0);
    return { leads: count('leads'), searches: count('searches'), crawlEvents: count('crawl_events') };
  }

  public close(): void {
    if (this.db.open) this.db.close();
  }
}
