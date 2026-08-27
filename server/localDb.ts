import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

export interface StoredLead {
  id: string;
  businessName: string;
  domain: string;
  website: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  category?: string;
  city?: string;
  country?: string;
  sourceUrl?: string;
  payload?: unknown;
}

export class LocalDb {
  private db: Database.Database;

  constructor(dbPath = process.env.MORFEMAIL_DB_PATH || path.resolve('database/morfemail.db')) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('foreign_keys = ON');
    this.migrate();
  }

  private migrate(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY,
        business_name TEXT NOT NULL,
        domain TEXT NOT NULL,
        website TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        whatsapp TEXT,
        category TEXT,
        city TEXT,
        country TEXT,
        source_url TEXT,
        payload_json TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_domain_email
      ON leads(domain, COALESCE(email, ''));

      CREATE TABLE IF NOT EXISTS crawl_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT NOT NULL,
        status TEXT NOT NULL,
        message TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  public upsertLead(lead: StoredLead): void {
    const stmt = this.db.prepare(`
      INSERT INTO leads (
        id, business_name, domain, website, email, phone, whatsapp,
        category, city, country, source_url, payload_json, updated_at
      ) VALUES (
        @id, @businessName, @domain, @website, @email, @phone, @whatsapp,
        @category, @city, @country, @sourceUrl, @payloadJson, CURRENT_TIMESTAMP
      )
      ON CONFLICT(id) DO UPDATE SET
        business_name = excluded.business_name,
        domain = excluded.domain,
        website = excluded.website,
        email = excluded.email,
        phone = excluded.phone,
        whatsapp = excluded.whatsapp,
        category = excluded.category,
        city = excluded.city,
        country = excluded.country,
        source_url = excluded.source_url,
        payload_json = excluded.payload_json,
        updated_at = CURRENT_TIMESTAMP
    `);

    stmt.run({
      id: lead.id,
      businessName: lead.businessName,
      domain: lead.domain,
      website: lead.website,
      email: lead.email || null,
      phone: lead.phone || null,
      whatsapp: lead.whatsapp || null,
      category: lead.category || null,
      city: lead.city || null,
      country: lead.country || null,
      sourceUrl: lead.sourceUrl || null,
      payloadJson: lead.payload ? JSON.stringify(lead.payload) : null
    });
  }

  public listLeads(limit = 500): unknown[] {
    return this.db.prepare(`
      SELECT id, business_name AS businessName, domain, website, email, phone,
             whatsapp, category, city, country, source_url AS sourceUrl,
             created_at AS createdAt, updated_at AS updatedAt
      FROM leads
      ORDER BY updated_at DESC
      LIMIT ?
    `).all(Math.max(1, Math.min(limit, 5000)));
  }

  public recordCrawlEvent(url: string, status: string, message?: string): void {
    this.db.prepare('INSERT INTO crawl_events (url, status, message) VALUES (?, ?, ?)')
      .run(url, status, message || null);
  }

  public stats(): { leads: number; crawlEvents: number } {
    const leads = Number((this.db.prepare('SELECT COUNT(*) AS count FROM leads').get() as any).count || 0);
    const crawlEvents = Number((this.db.prepare('SELECT COUNT(*) AS count FROM crawl_events').get() as any).count || 0);
    return { leads, crawlEvents };
  }

  public close(): void {
    this.db.close();
  }
}
