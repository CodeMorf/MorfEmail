/**
 * PhoneExtractor - MorfExtractor Submodule
 * Extrae y normaliza números telefónicos internacionales desde HTML o texto plano.
 */

export interface ExtractedPhone {
  countryCode?: string;
  nationalNumber?: string;
  formattedNumber: string;
  raw: string;
}

export class PhoneExtractor {
  // Patrones telefónicos internacionales comunes
  private static readonly PHONE_PATTERNS = [
    // República Dominicana (+1 809 / +1 829 / +1 849)
    /(?:\+?1[\s.-]?)?\(?(809|829|849)\)?[\s.-]?([0-9]{3})[\s.-]?([0-9]{4})\b/g,
    
    // España (+34 9xx xxx xxx / +34 6xx xxx xxx)
    /(?:\+?34[\s.-]?)?\(?([6789][0-9]{2})\)?[\s.-]?([0-9]{3})[\s.-]?([0-9]{3})\b/g,

    // México (+52 1? xxx xxx xxxx)
    /(?:\+?52[\s.-]?)?\(?([0-9]{2,3})\)?[\s.-]?([0-9]{3,4})[\s.-]?([0-9]{4})\b/g,

    // Colombia (+57 60x xxx xxxx / +57 3xx xxx xxxx)
    /(?:\+?57[\s.-]?)?\(?([36][0-9]{2})\)?[\s.-]?([0-9]{3})[\s.-]?([0-9]{4})\b/g,

    // Formato E.164 genérico (+[1-9][0-9]{7,14})
    /\+(?:[1-9][0-9]{0,2})[\s.-]?(?:\(?[0-9]{1,4}\)?[\s.-]?){2,5}[0-9]{2,4}\b/g,

    // Enlaces tel:
    /href=["']tel:([^"'>\s]+)/gi
  ];

  public static extract(html: string, defaultCountryCode = '1'): ExtractedPhone[] {
    if (!html) return [];

    const found = new Map<string, ExtractedPhone>();

    // 1. Extraer enlaces tel:
    const telRegex = /href=["']tel:([^"'>\s]+)/gi;
    let telMatch: RegExpExecArray | null;
    while ((telMatch = telRegex.exec(html)) !== null) {
      const clean = this.normalizeTel(telMatch[1], defaultCountryCode);
      if (clean) {
        found.set(clean.formattedNumber, clean);
      }
    }

    // 2. Extraer mediante regex de patrones en texto
    for (const pattern of this.PHONE_PATTERNS) {
      const matches = html.match(pattern) || [];
      for (const m of matches) {
        // Descartar si parece fecha o año (e.g. 2024-2025 o 1990-2020)
        if (/^\d{4}[-/]\d{2,4}$/.test(m.trim())) continue;
        
        const clean = this.normalizeTel(m, defaultCountryCode);
        if (clean && this.isValidPhoneNumber(clean.formattedNumber)) {
          found.set(clean.formattedNumber, clean);
        }
      }
    }

    return Array.from(found.values());
  }

  private static normalizeTel(rawPhone: string, fallbackCountryCode: string): ExtractedPhone | null {
    const raw = rawPhone.replace(/^tel:/i, '').trim();
    // Conservar sólo dígitos y el signo + inicial
    const digitsOnly = raw.replace(/[^\d+]/g, '');
    const cleanDigits = raw.replace(/[^\d]/g, '');

    if (cleanDigits.length < 7 || cleanDigits.length > 15) return null;

    let countryCode = '';
    let formatted = '';

    if (digitsOnly.startsWith('+')) {
      if (digitsOnly.startsWith('+1') && (cleanDigits.startsWith('1809') || cleanDigits.startsWith('1829') || cleanDigits.startsWith('1849'))) {
        countryCode = '+1';
        formatted = `+1 (${cleanDigits.slice(1, 4)}) ${cleanDigits.slice(4, 7)}-${cleanDigits.slice(7, 11)}`;
      } else if (digitsOnly.startsWith('+34')) {
        countryCode = '+34';
        formatted = `+34 ${cleanDigits.slice(2, 5)} ${cleanDigits.slice(5, 8)} ${cleanDigits.slice(8, 11)}`;
      } else if (digitsOnly.startsWith('+57')) {
        countryCode = '+57';
        formatted = `+57 ${cleanDigits.slice(2, 5)} ${cleanDigits.slice(5, 8)} ${cleanDigits.slice(8, 12)}`;
      } else {
        countryCode = digitsOnly.slice(0, 3);
        formatted = digitsOnly;
      }
    } else if (cleanDigits.length === 10 && (cleanDigits.startsWith('809') || cleanDigits.startsWith('829') || cleanDigits.startsWith('849'))) {
      // Formato RD sin +1
      countryCode = '+1';
      formatted = `+1 (${cleanDigits.slice(0, 3)}) ${cleanDigits.slice(3, 6)}-${cleanDigits.slice(6, 10)}`;
    } else if (cleanDigits.length === 9 && (cleanDigits.startsWith('6') || cleanDigits.startsWith('7') || cleanDigits.startsWith('8') || cleanDigits.startsWith('9'))) {
      // Formato España sin +34
      countryCode = '+34';
      formatted = `+34 ${cleanDigits.slice(0, 3)} ${cleanDigits.slice(3, 6)} ${cleanDigits.slice(6, 9)}`;
    } else {
      countryCode = `+${fallbackCountryCode}`;
      formatted = `+${fallbackCountryCode} ${cleanDigits}`;
    }

    return {
      countryCode,
      nationalNumber: cleanDigits,
      formattedNumber: formatted,
      raw
    };
  }

  private static isValidPhoneNumber(formatted: string): boolean {
    const digits = formatted.replace(/[^\d]/g, '');
    // Evitar falsos positivos como números repetitivos (000000000) o IDs cortos
    if (/^(\d)\1+$/.test(digits)) return false;
    if (digits.length < 8 || digits.length > 15) return false;
    return true;
  }
}
