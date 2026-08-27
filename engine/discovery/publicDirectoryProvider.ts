/**
 * PublicDirectoryProvider - MorfEmail Discovery Provider
 * Descubre sitios web empresariales reales mediante el backend local de MorfEmail.
 */

import { DiscoveryProvider, DiscoveryQuery, DiscoveryResult } from '../types';

export class PublicDirectoryProvider implements DiscoveryProvider {
  public name = 'MorfEmail Real Public Business Discovery';

  public async search(query: DiscoveryQuery): Promise<DiscoveryResult[]> {
    if (query.targetDomain) {
      const clean = query.targetDomain.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0];
      return [
        {
          title: clean,
          websiteUrl: `https://${clean}`,
          domain: clean,
          category: query.category,
          city: query.city,
          country: query.country,
          source: 'Dominio específico directo'
        }
      ];
    }

    const response = await fetch('/api/discovery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(query)
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.error || `Discovery local respondió HTTP ${response.status}`);
    }

    const results = Array.isArray(payload?.results) ? payload.results : [];
    return results.map((item: any) => ({
      title: String(item.title || item.domain || 'Empresa'),
      websiteUrl: String(item.websiteUrl || ''),
      domain: String(item.domain || ''),
      snippet: item.snippet ? String(item.snippet) : undefined,
      category: String(item.category || query.category),
      city: String(item.city || query.city || ''),
      country: String(item.country || query.country),
      estimatedAddress: item.estimatedAddress ? String(item.estimatedAddress) : undefined,
      estimatedPhone: item.estimatedPhone ? String(item.estimatedPhone) : undefined,
      estimatedEmail: item.estimatedEmail ? String(item.estimatedEmail) : undefined,
      source: String(item.source || 'OpenStreetMap / Overpass')
    })).filter((item: DiscoveryResult) => Boolean(item.websiteUrl && item.domain));
  }
}
