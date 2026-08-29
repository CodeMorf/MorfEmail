/**
 * Cliente del API SQLite local.
 *
 * El navegador nunca importa better-sqlite3 directamente: todas las
 * operaciones pasan por server/index.ts, que ejecuta las consultas
 * parametrizadas contra data/morfemail.db.
 */

import type { DbCrawlQueueItem, DbExportRecord, DbSearch } from './models';
import type { NormalizedLead } from '../types';
import { localApiUrl } from '../../src/services/localApi';

interface ApiResponse<T> { leads?: T; searches?: T; error?: string; }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(localApiUrl(path), { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) } });
  const payload = (await response.json().catch(() => ({}))) as ApiResponse<T>;
  if (!response.ok) throw new Error(payload.error || `API SQLite respondió HTTP ${response.status}`);
  return payload as T;
}

export class SqliteClient {
  private static instance: SqliteClient;

  public static getInstance(): SqliteClient {
    if (!this.instance) this.instance = new SqliteClient();
    return this.instance;
  }

  public async insertLead(lead: NormalizedLead, searchId?: string): Promise<void> {
    await request('/api/leads', { method: 'POST', body: JSON.stringify({ ...lead, searchId }) });
  }

  public async insertLeadsBatch(newLeads: NormalizedLead[], searchId?: string): Promise<number> {
    let added = 0;
    for (const lead of newLeads) {
      await this.insertLead(lead, searchId);
      added++;
    }
    return added;
  }

  public async getAllLeads(): Promise<NormalizedLead[]> {
    const payload = await request<{ leads: NormalizedLead[] }>('/api/leads');
    return Array.isArray(payload.leads) ? payload.leads : [];
  }

  public async getLeadsBySearchId(searchId: string): Promise<NormalizedLead[]> {
    const payload = await request<{ leads: NormalizedLead[] }>(`/api/leads?searchId=${encodeURIComponent(searchId)}`);
    return Array.isArray(payload.leads) ? payload.leads : [];
  }

  public async deleteLead(leadId: string): Promise<void> {
    await request(`/api/leads/${encodeURIComponent(leadId)}`, { method: 'DELETE' });
  }

  public async saveSearch(search: DbSearch): Promise<void> {
    await request('/api/searches', { method: 'POST', body: JSON.stringify(search) });
  }

  public async updateSearch(id: string, patch: Partial<DbSearch>): Promise<void> {
    await request(`/api/searches/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(patch) });
  }

  public async getAllSearches(): Promise<DbSearch[]> {
    const payload = await request<{ searches: DbSearch[] }>('/api/searches');
    return Array.isArray(payload.searches) ? payload.searches : [];
  }

  public async saveQueueSnapshot(_searchId: string, _items: DbCrawlQueueItem[]): Promise<void> {
    // La cola real y sus checkpoints los administra Crawlee en el backend.
  }

  public async getUnfinishedSearch(): Promise<{ searchId: string; items: DbCrawlQueueItem[] } | null> {
    const searches = await this.getAllSearches();
    const unfinished = searches.find((search) => search.status === 'running' || search.status === 'paused');
    return unfinished ? { searchId: unfinished.id, items: [] } : null;
  }

  public async clearQueue(_searchId: string): Promise<void> {
    // Crawlee marca y conserva sus solicitudes en el almacenamiento local.
  }

  public async recordExport(record: DbExportRecord): Promise<void> {
    await request('/api/exports', { method: 'POST', body: JSON.stringify(record) });
  }

  public async getAllExports(): Promise<DbExportRecord[]> {
    return [];
  }
}
