/**
 * HttpCrawler - MorfEmail Fast Crawler
 * Realiza peticiones HTTP ultrarrápidas y procesa el DOM con Cheerio.
 */

import * as cheerio from 'cheerio';
import { MorfExtractor } from '../extraction/morfExtractor';
import { RawExtractedData } from '../types';

export interface HttpResponse {
  html: string;
  statusCode: number;
  headers: Record<string, string>;
  isDynamicCandidate: boolean;
}

export class HttpCrawler {
  /**
   * Descarga y parsea una página web con Cheerio.
   */
  public static async fetchAndExtract(
    url: string,
    options?: {
      timeoutMs?: number;
      category?: string;
      city?: string;
      country?: string;
      defaultCountryCode?: string;
    }
  ): Promise<{ data: RawExtractedData; isDynamicCandidate: boolean }> {
    const timeout = options?.timeoutMs || 8000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 MorfEmail/2.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const html = await res.text();
      const $ = cheerio.load(html);

      // Limpiar scripts y estilos irrelevantes para extracción rápida
      $('script:not([type="application/ld+json"])').remove();
      $('style, noscript, svg, iframe').remove();

      // Evaluar si la página parece requerir Playwright (SPA vacía con root/app sin contenido)
      const bodyText = $('body').text().trim();
      const hasSpaMount = $('#root, #app, #__next, [data-reactroot]').length > 0;
      const isDynamicCandidate = hasSpaMount && bodyText.length < 150;

      const extracted = MorfExtractor.extractFromHtml(html, url, {
        category: options?.category,
        city: options?.city,
        country: options?.country,
        defaultCountryCode: options?.defaultCountryCode,
        renderedWith: 'cheerio',
        httpStatus: res.status
      });

      return {
        data: extracted,
        isDynamicCandidate
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      throw new Error(`HTTP Error (${url}): ${err.message || 'Request failed'}`);
    }
  }
}
