import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';

/**
 * PhoneExtractor - extracción y normalización internacional con libphonenumber-js.
 */
export interface ExtractedPhone {
  countryCode?: string;
  nationalNumber?: string;
  formattedNumber: string;
  raw: string;
}

export class PhoneExtractor {
  public static extract(html: string, defaultCountryCode = 'DO'): ExtractedPhone[] {
    if (!html) return [];

    const found = new Map<string, ExtractedPhone>();
    const candidates: string[] = [];

    const telRegex = /href=["']tel:([^"'>\s]+)/gi;
    let telMatch: RegExpExecArray | null;
    while ((telMatch = telRegex.exec(html)) !== null) candidates.push(telMatch[1]);

    const broadPhoneRegex = /(?:\+\d{1,3}[\s().-]*)?(?:\d[\s().-]*){7,15}/g;
    candidates.push(...(html.match(broadPhoneRegex) || []));

    const fallbackCountry = this.normalizeCountry(defaultCountryCode);

    for (const rawCandidate of candidates) {
      const raw = rawCandidate.replace(/^tel:/i, '').trim();
      if (!raw || /^\d{4}[-/]\d{2,4}$/.test(raw)) continue;

      const parsed = parsePhoneNumberFromString(raw, fallbackCountry);
      if (!parsed || !parsed.isPossible() || !parsed.isValid()) continue;

      const key = parsed.number;
      if (found.has(key)) continue;

      found.set(key, {
        countryCode: `+${parsed.countryCallingCode}`,
        nationalNumber: parsed.nationalNumber,
        formattedNumber: parsed.formatInternational(),
        raw
      });
    }

    return Array.from(found.values());
  }

  private static normalizeCountry(value: string): CountryCode {
    const upper = value.trim().toUpperCase();
    if (/^[A-Z]{2}$/.test(upper)) return upper as CountryCode;

    const callingCodeMap: Record<string, CountryCode> = {
      '1': 'DO',
      '34': 'ES',
      '39': 'IT',
      '57': 'CO',
      '52': 'MX',
      '33': 'FR',
      '49': 'DE',
      '351': 'PT'
    };

    return callingCodeMap[value.replace(/\D/g, '')] || 'DO';
  }
}
