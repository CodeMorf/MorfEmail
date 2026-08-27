/**
 * WhatsappExtractor - MorfExtractor Submodule
 * Detecta enlaces de WhatsApp públicos (wa.me, api.whatsapp.com, etc.)
 */

export class WhatsappExtractor {
  private static readonly WA_PATTERNS = [
    /https?:\/\/(?:api\.)?whatsapp\.com\/send\/?\?(?:[^"'>\s]*&)?phone=([0-9+]+)/gi,
    /https?:\/\/wa\.me\/([0-9+]+)/gi,
    /https?:\/\/chat\.whatsapp\.com\/([A-Za-z0-9_-]+)/gi,
    /href=["']whatsapp:\/\/send\?phone=([0-9+]+)/gi
  ];

  public static extract(html: string): string | undefined {
    if (!html) return undefined;

    for (const pattern of this.WA_PATTERNS) {
      pattern.lastIndex = 0;
      const match = pattern.exec(html);
      if (match && match[1]) {
        const rawDigits = match[1].replace(/[^\d+]/g, '');
        if (rawDigits.length >= 8 && rawDigits.length <= 16) {
          const formatted = rawDigits.startsWith('+') ? rawDigits : `+${rawDigits}`;
          return `https://wa.me/${formatted.replace('+', '')}`;
        }
      }
    }

    return undefined;
  }
}
