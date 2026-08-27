/**
 * EmailExtractor - MorfExtractor Submodule
 * Extrae emails públicos reales evitando assets, placeholders y falsos positivos.
 */

// Prefijos B2B de alta relevancia para priorización
export const B2B_EMAIL_PREFIXES = [
  'info', 'ventas', 'sales', 'contact', 'contacto', 'support', 'soporte',
  'hello', 'hola', 'business', 'booking', 'reservas', 'administracion',
  'admin', 'recepcion', 'atencion', 'comercial', 'gerencia', 'director'
];

// Extensiones o palabras no deseadas que simulan emails
const IGNORE_PATTERNS = [
  /\.(png|jpg|jpeg|gif|webp|svg|css|js|woff|woff2|ttf|eot)$/i,
  /@(example\.com|domain\.com|sentry\.io|wixpress\.com|bootstrap\.com|schema\.org|w3\.org)$/i,
  /^(noreply|no-reply|mailer-daemon|donotreply)/i
];

export class EmailExtractor {
  /**
   * Extrae correos electrónicos de código HTML o texto plano.
   */
  public static extract(html: string, pageDomain?: string): string[] {
    if (!html) return [];

    const foundEmails = new Set<string>();

    // 1. Extraer desde enlaces mailto:
    const mailtoRegex = /href=["']mailto:([^"?'>\s]+)/gi;
    let mailtoMatch: RegExpExecArray | null;
    while ((mailtoMatch = mailtoRegex.exec(html)) !== null) {
      const email = this.cleanEmail(mailtoMatch[1]);
      if (this.isValidEmail(email)) {
        foundEmails.add(email);
      }
    }

    // 2. Extraer emails desde texto con Regex estándar
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
    const textMatches = html.match(emailRegex) || [];
    for (const raw of textMatches) {
      const email = this.cleanEmail(raw);
      if (this.isValidEmail(email)) {
        foundEmails.add(email);
      }
    }

    // 3. Detectar emails con ofuscación simple (e.g. info [at] domain [dot] com)
    const obfuscatedRegex = /\b([A-Za-z0-9._%+-]+)\s*(?:\[at\]|\(at\)|&#64;)\s*([A-Za-z0-9.-]+)\s*(?:\[dot\]|\(dot\)|\.)\s*([A-Za-z]{2,})\b/gi;
    let obfMatch: RegExpExecArray | null;
    while ((obfMatch = obfuscatedRegex.exec(html)) !== null) {
      const constructed = `${obfMatch[1]}@${obfMatch[2]}.${obfMatch[3]}`.toLowerCase();
      if (this.isValidEmail(constructed)) {
        foundEmails.add(constructed);
      }
    }

    // Convertir a lista y ordenar: correos del mismo dominio y con prefijos B2B primero
    const list = Array.from(foundEmails);
    return this.sortAndPrioritize(list, pageDomain);
  }

  private static cleanEmail(email: string): string {
    return email
      .trim()
      .toLowerCase()
      .replace(/^mailto:/i, '')
      .replace(/[),;:]+$/, '')
      .replace(/^[<(]+/, '');
  }

  public static isValidEmail(email: string): boolean {
    if (!email || email.length < 5 || email.length > 100) return false;
    
    for (const pattern of IGNORE_PATTERNS) {
      if (pattern.test(email)) return false;
    }

    const simpleEmailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,63}$/;
    return simpleEmailRegex.test(email);
  }

  private static sortAndPrioritize(emails: string[], pageDomain?: string): string[] {
    const cleanDomain = pageDomain ? pageDomain.replace(/^www\./, '').toLowerCase() : '';

    return emails.sort((a, b) => {
      const aUser = a.split('@')[0];
      const bUser = b.split('@')[0];
      const aDomain = a.split('@')[1] || '';
      const bDomain = b.split('@')[1] || '';

      // Coincidencia con el dominio de la empresa
      const aSameDomain = cleanDomain && aDomain.includes(cleanDomain);
      const bSameDomain = cleanDomain && bDomain.includes(cleanDomain);

      if (aSameDomain && !bSameDomain) return -1;
      if (!aSameDomain && bSameDomain) return 1;

      // Prefijo B2B
      const aIsB2B = B2B_EMAIL_PREFIXES.some((p) => aUser.startsWith(p));
      const bIsB2B = B2B_EMAIL_PREFIXES.some((p) => bUser.startsWith(p));

      if (aIsB2B && !bIsB2B) return -1;
      if (!aIsB2B && bIsB2B) return 1;

      return a.localeCompare(b);
    });
  }
}
