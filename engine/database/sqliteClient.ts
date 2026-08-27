/**
 * SqliteClient - MorfEmail Local Storage & Database Adapter
 * Administra el almacenamiento persistente de prospectos, colas de rastreo y configuraciones locales.
 */

import { DbLead, DbSearch, DbCrawlQueueItem, DbExportRecord } from './models';
import { NormalizedLead } from '../types';

const STORAGE_KEYS = {
  LEADS: 'morfemail_sqlite_leads',
  SEARCHES: 'morfemail_sqlite_searches',
  QUEUE: 'morfemail_sqlite_queue',
  EXPORTS: 'morfemail_sqlite_exports',
  SETTINGS: 'morfemail_sqlite_settings'
};

export class SqliteClient {
  private static instance: SqliteClient;

  public static getInstance(): SqliteClient {
    if (!this.instance) {
      this.instance = new SqliteClient();
    }
    return this.instance;
  }

  // --- LEADS ---

  public async insertLead(lead: NormalizedLead, searchId?: string): Promise<void> {
    const leads = this.getAllLeads();
    const existingIndex = leads.findIndex((l) => l.domain === lead.domain || (lead.email && l.email === lead.email));

    if (existingIndex >= 0) {
      // Actualizar existente con nueva información descubierta
      leads[existingIndex] = {
        ...leads[existingIndex],
        ...lead,
        updatedAt: new Date().toISOString()
      };
    } else {
      leads.unshift(lead);
    }

    this.saveToStorage(STORAGE_KEYS.LEADS, leads);
  }

  public async insertLeadsBatch(newLeads: NormalizedLead[]): Promise<number> {
    const leads = this.getAllLeads();
    let added = 0;

    for (const lead of newLeads) {
      const exists = leads.some((l) => l.domain === lead.domain || (lead.email && l.email === lead.email));
      if (!exists) {
        leads.unshift(lead);
        added++;
      }
    }

    this.saveToStorage(STORAGE_KEYS.LEADS, leads);
    return added;
  }

  public getAllLeads(): NormalizedLead[] {
    return this.loadFromStorage<NormalizedLead[]>(STORAGE_KEYS.LEADS, []);
  }

  public getLeadsBySearchId(searchId: string): NormalizedLead[] {
    const all = this.getAllLeads();
    return all.filter((l: any) => l.searchId === searchId);
  }

  public deleteLead(leadId: string): void {
    const leads = this.getAllLeads().filter((l) => l.id !== leadId);
    this.saveToStorage(STORAGE_KEYS.LEADS, leads);
  }

  // --- SEARCHES ---

  public async saveSearch(search: DbSearch): Promise<void> {
    const searches = this.getAllSearches();
    const index = searches.findIndex((s) => s.id === search.id);
    if (index >= 0) {
      searches[index] = { ...searches[index], ...search, updated_at: new Date().toISOString() };
    } else {
      searches.unshift(search);
    }
    this.saveToStorage(STORAGE_KEYS.SEARCHES, searches);
  }

  public getAllSearches(): DbSearch[] {
    return this.loadFromStorage<DbSearch[]>(STORAGE_KEYS.SEARCHES, []);
  }

  // --- UNFINISHED SEARCH / QUEUE PERSISTENCE ---

  public async saveQueueSnapshot(searchId: string, items: DbCrawlQueueItem[]): Promise<void> {
    this.saveToStorage(`${STORAGE_KEYS.QUEUE}_${searchId}`, items);
  }

  public async getUnfinishedSearch(): Promise<{ searchId: string; items: DbCrawlQueueItem[] } | null> {
    const searches = this.getAllSearches();
    const unfinished = searches.find((s) => s.status === 'running' || s.status === 'paused');
    if (!unfinished) return null;

    const items = this.loadFromStorage<DbCrawlQueueItem[]>(`${STORAGE_KEYS.QUEUE}_${unfinished.id}`, []);
    return {
      searchId: unfinished.id,
      items
    };
  }

  public async clearQueue(searchId: string): Promise<void> {
    try {
      localStorage.removeItem(`${STORAGE_KEYS.QUEUE}_${searchId}`);
    } catch {
      // Ignorar
    }
  }

  // --- EXPORTS ---

  public async recordExport(rec: DbExportRecord): Promise<void> {
    const exports = this.getAllExports();
    exports.unshift(rec);
    this.saveToStorage(STORAGE_KEYS.EXPORTS, exports);
  }

  public getAllExports(): DbExportRecord[] {
    return this.loadFromStorage<DbExportRecord[]>(STORAGE_KEYS.EXPORTS, []);
  }

  // --- HELPERS ---

  private loadFromStorage<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  private saveToStorage(key: string, data: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn('Storage quota limit reached in sqlite adapter:', e);
    }
  }
}
