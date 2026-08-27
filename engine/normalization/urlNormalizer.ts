/**
 * UrlNormalizer - MorfEmail Engine
 * Normaliza URLs, elimina tracking params y extrae canonical domains.
 */

export class UrlNormalizer {
  /**
   * Normaliza una URL a su formato canónico limpio.
   */
  public static normalize(rawUrl: string): string {
    if (!rawUrl) return '';

    let url = rawUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }

    try {
      const parsed = new URL(url);
      
      // Remover parámetros de tracking y marketing
      const trackingParams = [
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
        'fbclid', 'gclid', 'ref', 'source', 'trk', 'msclkid'
      ];
      for (const p of trackingParams) {
        parsed.searchParams.delete(p);
      }

      // Remover hash/fragment
      parsed.hash = '';

      let clean = parsed.toString();
      // Eliminar trailing slash si es solo root (https://empresa.com/ -> https://empresa.com)
      if (clean.endsWith('/') && parsed.pathname === '/') {
        clean = clean.slice(0, -1);
      }

      return clean;
    } catch {
      return rawUrl.trim().toLowerCase();
    }
  }

  /**
   * Extrae el dominio raíz normalizado (ej: www.hotel.do -> hotel.do).
   */
  public static getCanonicalDomain(urlOrDomain: string): string {
    if (!urlOrDomain) return '';

    let text = urlOrDomain.trim().toLowerCase();
    text = text.replace(/^https?:\/\//i, '');
    text = text.split('/')[0];
    text = text.split(':')[0]; // remover puerto
    text = text.replace(/^www\./i, '');

    return text;
  }
}
