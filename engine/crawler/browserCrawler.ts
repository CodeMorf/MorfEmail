/**
 * BrowserCrawler - MorfEmail Playwright Chromium Runner
 * Renderiza páginas dinámicas mediante el backend local Playwright.
 */

import { MorfExtractor } from '../extraction/morfExtractor';
import { RawExtractedData } from '../types';

export class BrowserCrawler {
  private isHeadless: boolean;
  private timeoutMs: number;

  constructor(options?: { headless?: boolean; timeoutMs?: number }) {
    this.isHeadless = options?.headless ?? true;
    this.timeoutMs = options?.timeoutMs || 15000;
  }

  public async renderAndExtract(
    url: string,
    options?: {
      category?: string;
      city?: string;
      country?: string;
      defaultCountryCode?: string;
    }
  ): Promise<RawExtractedData> {
    const response = await fetch('/api/render-page', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, timeoutMs: this.timeoutMs, headless: this.isHeadless })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.error || `Playwright local respondió HTTP ${response.status}`);
    }

    const html = String(payload?.html || '');
    const finalUrl = String(payload?.finalUrl || url);
    const statusCode = Number(payload?.statusCode || 0);

    return MorfExtractor.extractFromHtml(html, finalUrl, {
      category: options?.category,
      city: options?.city,
      country: options?.country,
      defaultCountryCode: options?.defaultCountryCode,
      renderedWith: 'playwright',
      httpStatus: statusCode
    });
  }

  public setHeadless(headless: boolean): void {
    this.isHeadless = headless;
  }

  public getIsHeadless(): boolean {
    return this.isHeadless;
  }
}
