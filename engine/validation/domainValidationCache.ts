/**
 * DomainValidationCache - MorfEmail In-Memory DNS & Domain Cache
 * Evita consultas redundantes de DNS/MX para correos que comparten el mismo dominio.
 */

import { DnsValidationResult } from './types';

interface CacheEntry {
  result: DnsValidationResult;
  expiresAt: number;
}

export class DomainValidationCache {
  private static instance: DomainValidationCache;
  private cache: Map<string, CacheEntry> = new Map();
  private defaultTtlMs: number = 10 * 60 * 1000; // 10 minutos

  private constructor() {}

  public static getInstance(): DomainValidationCache {
    if (!this.instance) {
      this.instance = new DomainValidationCache();
    }
    return this.instance;
  }

  /**
   * Obtiene un resultado en caché si existe y no ha expirado.
   */
  public get(domain: string): DnsValidationResult | null {
    if (!domain) return null;
    const clean = domain.toLowerCase().trim();
    const entry = this.cache.get(clean);

    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(clean);
      return null;
    }

    return {
      ...entry.result,
      fromCache: true
    };
  }

  /**
   * Guarda un resultado de DNS en caché.
   */
  public set(domain: string, result: DnsValidationResult, ttlMs?: number): void {
    if (!domain) return;
    const clean = domain.toLowerCase().trim();
    const ttl = ttlMs ?? this.defaultTtlMs;

    this.cache.set(clean, {
      result: { ...result, fromCache: false },
      expiresAt: Date.now() + ttl
    });
  }

  /**
   * Limpia toda la caché o entradas expiradas.
   */
  public clear(): void {
    this.cache.clear();
  }

  public purgeExpired(): number {
    const now = Date.now();
    let purged = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        purged++;
      }
    }
    return purged;
  }

  public size(): number {
    return this.cache.size;
  }
}
