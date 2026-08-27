/**
 * HttpCrawler - MorfEmail Fast Crawler
 * Descarga páginas mediante el backend local para evitar CORS y luego procesa el DOM con Cheerio.
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
    const timeoutMs = options?.timeoutMs || 8000;

    const response = await fetch('/api/fetch-page', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, timeoutMs })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.error || `HTTP proxy local respondió ${response.status}`);
    }

    const html = String(payload?.html || '');
    const statusCode = Number(payload?.statusCode || 0);
    const finalUrl = String(payload?.finalUrl || url);
    const $ = cheerio.load(html);

    $('script:not([type="application/ld+json"])').remove();
    $('style, noscript, svg, iframe').remove();

    const bodyText = $('body').text().trim();
    const hasSpaMount = $('#root, #app, #__next, [data-reactroot]').length > 0;
    const isDynamicCandidate = hasSpaMount && bodyText.length < 150;

    const extracted = MorfExtractor.extractFromHtml(html, finalUrl, {
      category: options?.category,
      city: options?.city,
      country: options?.country,
      defaultCountryCode: options?.defaultCountryCode,
      renderedWith: 'cheerio',
      httpStatus: statusCode
    });

    return { data: extracted, isDynamicCandidate };
  }
}
