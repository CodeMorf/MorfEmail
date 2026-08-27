/**
 * RequestQueue - MorfEmail Crawler Queue Manager
 * Controla colas de URLs, evita duplicidad, aplica rate-limiting por dominio y gestiona reintentos.
 */

import { CrawlRequest } from '../types';
import { UrlNormalizer } from '../normalization/urlNormalizer';

export class RequestQueue {
  private pendingQueue: CrawlRequest[] = [];
  private inProgressMap = new Map<string, CrawlRequest>();
  private processedUrls = new Set<string>();
  private domainLastAccessed = new Map<string, number>();
  private domainFailureCount = new Map<string, number>();

  public add(request: Omit<CrawlRequest, 'id' | 'domain' | 'retryCount'>): boolean {
    const normUrl = UrlNormalizer.normalize(request.url);
    if (this.processedUrls.has(normUrl) || this.inProgressMap.has(normUrl)) {
      return false;
    }

    const domain = UrlNormalizer.getCanonicalDomain(normUrl);
    const item: CrawlRequest = {
      ...request,
      id: `req-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      url: normUrl,
      domain,
      retryCount: 0
    };

    this.pendingQueue.push(item);
    return true;
  }

  public addBatch(requests: Array<Omit<CrawlRequest, 'id' | 'domain' | 'retryCount'>>): number {
    let added = 0;
    for (const r of requests) {
      if (this.add(r)) added++;
    }
    return added;
  }

  /**
   * Obtiene la siguiente URL elegible respetando el rate limit por dominio.
   */
  public getNext(rateLimitPerDomainMs = 800): CrawlRequest | null {
    const now = Date.now();

    for (let i = 0; i < this.pendingQueue.length; i++) {
      const candidate = this.pendingQueue[i];
      const lastAccess = this.domainLastAccessed.get(candidate.domain) || 0;
      const domainFailures = this.domainFailureCount.get(candidate.domain) || 0;

      // Circuit breaker si el dominio falló 3 veces consecutivas
      if (domainFailures >= 3) {
        this.pendingQueue.splice(i, 1);
        this.processedUrls.add(candidate.url);
        i--;
        continue;
      }

      if (now - lastAccess >= rateLimitPerDomainMs) {
        this.pendingQueue.splice(i, 1);
        this.inProgressMap.set(candidate.url, candidate);
        this.domainLastAccessed.set(candidate.domain, now);
        return candidate;
      }
    }

    return null;
  }

  public markCompleted(request: CrawlRequest): void {
    this.inProgressMap.delete(request.url);
    this.processedUrls.add(request.url);
    this.domainFailureCount.delete(request.domain);
  }

  public markFailed(request: CrawlRequest, maxRetries = 2): boolean {
    this.inProgressMap.delete(request.url);
    const failures = (this.domainFailureCount.get(request.domain) || 0) + 1;
    this.domainFailureCount.set(request.domain, failures);

    if (request.retryCount < maxRetries) {
      const retryReq: CrawlRequest = {
        ...request,
        retryCount: request.retryCount + 1
      };
      this.pendingQueue.push(retryReq);
      return true;
    } else {
      this.processedUrls.add(request.url);
      return false;
    }
  }

  public size(): number {
    return this.pendingQueue.length;
  }

  public inProgressCount(): number {
    return this.inProgressMap.size;
  }

  public completedCount(): number {
    return this.processedUrls.size;
  }

  public clear(): void {
    this.pendingQueue = [];
    this.inProgressMap.clear();
    this.processedUrls.clear();
    this.domainLastAccessed.clear();
    this.domainFailureCount.clear();
  }
}
