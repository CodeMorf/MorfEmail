/**
 * QueryBuilder - MorfEmail Discovery Layer
 * Construye consultas jerárquicas: País -> Región / Provincia -> Ciudad -> Categoría.
 */

import { DiscoveryQuery } from '../types';

export class QueryBuilder {
  public static buildQuery(params: {
    country: string;
    countryCode?: string;
    state?: string;
    city: string;
    category: string;
    limit?: number;
    targetDomain?: string;
  }): DiscoveryQuery {
    return {
      country: params.country || 'República Dominicana',
      countryCode: params.countryCode || 'DO',
      state: params.state || '',
      city: params.city || 'Santo Domingo',
      category: params.category || 'Restaurantes',
      limit: params.limit || 25,
      targetDomain: params.targetDomain
    };
  }

  public static formatDisplayQuery(q: DiscoveryQuery): string {
    const parts = [q.category];
    if (q.city) parts.push(q.city);
    if (q.state) parts.push(q.state);
    if (q.country) parts.push(q.country);
    return parts.join(' • ');
  }
}
