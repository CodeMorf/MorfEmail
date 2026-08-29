/**
 * AddressExtractor - MorfExtractor Submodule
 * Extrae dirección física, ciudad, provincia y código postal desde microformatos, footers y texto.
 */

export interface ExtractedAddress {
  street?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
  formattedAddress?: string;
}

export class AddressExtractor {
  public static extract(html: string, _fallbackCity?: string, _fallbackCountry?: string): ExtractedAddress {
    const addr: ExtractedAddress = {};

    if (!html) return addr;

    // 1. Extraer etiqueta <address>
    const addressTagMatch = html.match(/<address[^>]*>([\s\S]*?)<\/address>/i);
    if (addressTagMatch) {
      const cleanAddress = addressTagMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (cleanAddress.length > 5 && cleanAddress.length < 200) {
        addr.formattedAddress = cleanAddress;
        addr.street = cleanAddress;
      }
    }

    // 2. Extraer código postal mediante regex
    // Formato 5 dígitos (España, México, RD, USA)
    const postalMatch = html.match(/\b(?:CP|C\.P\.|Zip|Postal Code)?\s*([0-9]{5})\b/i);
    if (postalMatch && postalMatch[1]) {
      addr.postalCode = postalMatch[1];
    }

    // 3. Detectar menciones de calles comunes (Calle, Av., Avenida, Carretera, Blvd, St, Ave)
    if (!addr.street) {
      const streetMatch = html.match(/\b((?:Av\.|Avenida|Calle|Carretera|Paseo|Boulevard|Blvd|Plaza|Carrera|Callejón|Autopista)\s+[^<>\n\r,]{4,50})/i);
      if (streetMatch && streetMatch[1]) {
        addr.street = streetMatch[1].trim();
        if (!addr.formattedAddress) {
          addr.formattedAddress = addr.street;
        }
      }
    }

    return addr;
  }
}
