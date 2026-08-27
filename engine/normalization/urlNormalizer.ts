import { getDomain } from 'tldts';

/**
 * UrlNormalizer - MorfEmail Engine
 * Normaliza URLs y dominios usando Public Suffix List mediante tldts.
 */
export class UrlNormalizer {
  public static normalize(rawUrl: string): string {
    if (!rawUrl) return '';

    let url = rawUrl.trim();
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

    try {
      const parsed = new URL(url);
      const trackingParams = [
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
        'fbclid', 'gclid', 'ref', 'source', 'trk', 'msclkid'
      ];
      for (const p of trackingParams) parsed.searchParams.delete(p);
      parsed.hash = '';
      let clean = parsed.toString();
      if (clean.endsWith('/') && parsed.pathname === '/') clean = clean.slice(0, -1);
      return clean;
    } catch {
      return rawUrl.trim();
    }
  }

  /**
   * Obtiene el dominio registrable real. Ejemplo:
   * www.mail.empresa.com.do -> empresa.com.do
   */
  public static getCanonicalDomain(urlOrDomain: string): string {
    if (!urlOrDomain) return '';

    let hostname = urlOrDomain.trim().toLowerCase();
    try {
      const candidate = /^https?:\/\//i.test(hostname) ? hostname : `https://${hostname}`;
      hostname = new URL(candidate).hostname;
    } catch {
      hostname = hostname.replace(/^https?:\/\//i, '').split('/')[0].split(':')[0];
    }

    hostname = hostname.replace(/^www\./i, '');
    return getDomain(hostname, { allowPrivateDomains: true }) || hostname;
  }
}
