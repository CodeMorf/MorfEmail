/**
 * SearchService - MorfEmail Service Coordinator
 * Conecta la UI React con el CrawlerEngine, SqliteClient y la cola de procesamiento.
 */

import { CrawlerEngine } from '../../engine/crawler/crawlerEngine';
import { SqliteClient } from '../../engine/database/sqliteClient';
import { QueryBuilder } from '../../engine/discovery/queryBuilder';
import { SearchConfig, Lead } from '../types';
import { CrawlStatistics, CrawlLogEntry, CrawlStatus, NormalizedLead } from '../../engine/types';

export class SearchService {
  private static instance: SearchService;
  private engine: CrawlerEngine;
  private sqlite: SqliteClient;
  private currentSearchId: string | null = null;

  private constructor() {
    this.engine = new CrawlerEngine({
      mode: 'auto',
      maxConcurrency: 8,
      headless: true
    });
    this.sqlite = SqliteClient.getInstance();
  }

  public static getInstance(): SearchService {
    if (!this.instance) {
      this.instance = new SearchService();
    }
    return this.instance;
  }

  /**
   * Inicia una búsqueda B2B a partir de la configuración seleccionada en la UI.
   */
  public async executeSearch(
    config: SearchConfig,
    options?: {
      mode?: 'fast' | 'browser' | 'auto';
      headless?: boolean;
      concurrency?: number;
    }
  ): Promise<string> {
    const searchId = `srch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    this.currentSearchId = searchId;

    const query = QueryBuilder.buildQuery({
      country: config.country,
      countryCode: config.countryCode,
      state: config.state,
      city: config.city,
      category: config.businessType,
      limit: config.quantity,
      targetDomain: config.contactType === 'specific_domain' ? config.targetDomain : undefined
    });

    // Guardar registro de búsqueda en SQLite
    await this.sqlite.saveSearch({
      id: searchId,
      query: `${config.businessType} en ${config.city}, ${config.country}`,
      country: config.country,
      country_code: config.countryCode,
      state: config.state,
      city: config.city,
      category: config.businessType,
      target_domain: config.targetDomain,
      contact_type: config.contactType,
      leads_found: 0,
      exported_count: 0,
      duration_sec: 0,
      status: 'running',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // Iniciar el motor de crawling
    await this.engine.start(query, {
      mode: options?.mode || 'auto',
      headless: options?.headless ?? true,
      maxConcurrency: options?.concurrency || 8
    });

    return searchId;
  }

  public pause(): void {
    this.engine.pause();
  }

  public resume(): void {
    this.engine.resume();
  }

  public stop(): void {
    this.engine.stop();
  }

  public getStatistics(): CrawlStatistics {
    return this.engine.getStatistics();
  }

  public getStatus(): CrawlStatus {
    return this.engine.getStatus();
  }

  public getEngine(): CrawlerEngine {
    return this.engine;
  }

  public getCurrentSearchId(): string | null {
    return this.currentSearchId;
  }

  public normalizeEngineLeadToAppLead(n: NormalizedLead): Lead {
    return {
      id: n.id,
      companyName: n.businessName,
      category: n.category,
      country: n.country,
      countryCode: n.countryCode || 'DO',
      flag: n.countryCode === 'ES' ? '🇪🇸' : n.countryCode === 'CO' ? '🇨🇴' : n.countryCode === 'US' ? '🇺🇸' : '🇩🇴',
      state: n.region,
      city: n.city,
      address: n.address,
      postalCode: n.postalCode,
      email: n.email,
      phone: n.phone,
      whatsapp: n.whatsapp,
      website: n.website,
      facebook: n.facebook,
      instagram: n.instagram,
      linkedin: n.linkedin,
      verified: n.emailStatus === 'valid' ? 'verified' : n.emailStatus === 'risky' ? 'risky' : 'unverified',
      confidenceScore: n.confidenceScore,
      extractedAt: n.discoveredAt,
      source: n.sourceUrl,
      notes: n.notes
    };
  }
}
