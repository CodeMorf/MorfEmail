/**
 * BusinessExtractor - MorfExtractor Submodule
 * Extrae nombre de empresa, categoría, metadatos OpenGraph y descripción comercial.
 */

export interface BusinessMeta {
  businessName?: string;
  category?: string;
  description?: string;
  ogTitle?: string;
  ogSiteName?: string;
  h1?: string[];
}

export class BusinessExtractor {
  public static extract(html: string, fallbackDomain?: string): BusinessMeta {
    const meta: BusinessMeta = {};
    if (!html) return meta;

    // 1. Meta og:site_name
    const ogSiteMatch = html.match(/<meta\s+(?:property|name)=["']og:site_name["']\s+content=["']([^"']+)["']/i);
    if (ogSiteMatch) {
      meta.ogSiteName = this.cleanText(ogSiteMatch[1]);
    }

    // 2. Meta og:title
    const ogTitleMatch = html.match(/<meta\s+(?:property|name)=["']og:title["']\s+content=["']([^"']+)["']/i);
    if (ogTitleMatch) {
      meta.ogTitle = this.cleanText(ogTitleMatch[1]);
    }

    // 3. Meta description
    const descMatch = html.match(/<meta\s+(?:name|property)=["']description["']\s+content=["']([^"']+)["']/i);
    if (descMatch) {
      meta.description = this.cleanText(descMatch[1]);
    }

    // 4. Title tag
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const rawTitle = titleMatch ? this.cleanText(titleMatch[1]) : '';

    // 5. H1 tags
    const h1s: string[] = [];
    const h1Regex = /<h1[^>]*>([\s\S]*?)<\/h1>/gi;
    let h1Match: RegExpExecArray | null;
    while ((h1Match = h1Regex.exec(html)) !== null) {
      const text = this.cleanText(h1Match[1].replace(/<[^>]+>/g, ''));
      if (text && text.length > 2 && text.length < 80) {
        h1s.push(text);
      }
    }
    meta.h1 = h1s;

    // Determinar el mejor nombre comercial
    meta.businessName = this.resolveBestBusinessName(meta.ogSiteName, meta.ogTitle, rawTitle, h1s[0], fallbackDomain);

    return meta;
  }

  private static resolveBestBusinessName(
    ogSiteName?: string,
    ogTitle?: string,
    rawTitle?: string,
    h1?: string,
    domain?: string
  ): string {
    if (ogSiteName && ogSiteName.length > 2 && ogSiteName.length < 60) {
      return ogSiteName;
    }

    if (rawTitle) {
      // Remover separadores comunes como " | Inicio", " - Oficial", " » Home"
      const parts = rawTitle.split(/[\s|–—»•·-]+/);
      if (parts.length > 0 && parts[0].trim().length > 2) {
        const candidate = parts[0].trim();
        if (!this.isGenericWord(candidate)) {
          return candidate;
        }
      }
    }

    if (ogTitle && !this.isGenericWord(ogTitle)) {
      return ogTitle.slice(0, 50);
    }

    if (h1 && !this.isGenericWord(h1)) {
      return h1;
    }

    return '';
  }

  private static isGenericWord(word: string): boolean {
    const generic = ['home', 'inicio', 'welcome', 'bienvenidos', 'pagina principal', 'index', 'default'];
    return generic.includes(word.toLowerCase().trim());
  }

  private static cleanText(text: string): string {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
