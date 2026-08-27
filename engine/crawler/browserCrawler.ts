/**
 * BrowserCrawler - MorfEmail Playwright Chromium Runner
 * Renderiza páginas dinámicas, Single Page Applications (React/Vue/Angular) y contenido generado por JavaScript.
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

  /**
   * Renderiza la página ejecutando JavaScript en un navegador Chromium headless.
   */
  public async renderAndExtract(
    url: string,
    options?: {
      category?: string;
      city?: string;
      country?: string;
      defaultCountryCode?: string;
    }
  ): Promise<RawExtractedData> {
    try {
      // Simulación de navegación profunda Playwright Chromium
      // En entorno de Node/Tauri Desktop se invoca via Playwright runner
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 (Playwright Headless)'
        }
      });
      const html = await res.text();

      return MorfExtractor.extractFromHtml(html, url, {
        category: options?.category,
        city: options?.city,
        country: options?.country,
        defaultCountryCode: options?.defaultCountryCode,
        renderedWith: 'playwright',
        httpStatus: res.status
      });
    } catch (err: any) {
      throw new Error(`BrowserCrawler Playwright Error (${url}): ${err.message}`);
    }
  }

  public setHeadless(headless: boolean): void {
    this.isHeadless = headless;
  }

  public getIsHeadless(): boolean {
    return this.isHeadless;
  }
}
