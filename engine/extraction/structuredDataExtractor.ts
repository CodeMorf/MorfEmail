/**
 * StructuredDataExtractor - MorfExtractor Submodule
 * Extrae y procesa esquemas JSON-LD y Microdata (Organization, LocalBusiness, Restaurant, etc.)
 */

export interface StructuredBusinessData {
  name?: string;
  category?: string;
  email?: string;
  telephone?: string;
  address?: {
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  };
  geo?: {
    latitude?: number;
    longitude?: number;
  };
  sameAs?: string[];
  rawSchema?: any;
}

export class StructuredDataExtractor {
  public static extract(html: string): StructuredBusinessData | null {
    if (!html) return null;

    try {
      const jsonLdRegex = /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
      let match: RegExpExecArray | null;

      while ((match = jsonLdRegex.exec(html)) !== null) {
        const rawJson = match[1].trim();
        if (!rawJson) continue;

        try {
          const parsed = JSON.parse(rawJson);
          const result = this.processSchemaObject(parsed);
          if (result) return result;
        } catch {
          // Ignorar JSON malformado
        }
      }
    } catch (e) {
      // Error silencioso para no interrumpir el pipeline
    }

    return null;
  }

  private static processSchemaObject(obj: any): StructuredBusinessData | null {
    if (!obj) return null;

    // Si es un arreglo (@graph o lista de schemas)
    if (Array.isArray(obj)) {
      for (const item of obj) {
        const res = this.processSchemaObject(item);
        if (res) return res;
      }
      return null;
    }

    if (obj['@graph'] && Array.isArray(obj['@graph'])) {
      for (const item of obj['@graph']) {
        const res = this.processSchemaObject(item);
        if (res) return res;
      }
    }

    const type = String(obj['@type'] || '');
    const relevantTypes = [
      'Organization',
      'LocalBusiness',
      'Restaurant',
      'Hotel',
      'Store',
      'ProfessionalService',
      'MedicalBusiness',
      'AutoDealer',
      'RealEstateAgent',
      'LegalService',
      'AccountingService',
      'HealthAndBeautyBusiness'
    ];

    const isMatch = relevantTypes.some((t) => type.includes(t));
    if (!isMatch && !obj.name && !obj.telephone) {
      return null;
    }

    const address = obj.address ? this.parseAddress(obj.address) : undefined;

    return {
      name: obj.name ? String(obj.name).trim() : undefined,
      category: type || undefined,
      email: obj.email ? String(obj.email).trim() : undefined,
      telephone: obj.telephone ? String(obj.telephone).trim() : undefined,
      address,
      geo: obj.geo ? { latitude: Number(obj.geo.latitude), longitude: Number(obj.geo.longitude) } : undefined,
      sameAs: Array.isArray(obj.sameAs) ? obj.sameAs : (obj.sameAs ? [String(obj.sameAs)] : []),
      rawSchema: obj
    };
  }

  private static parseAddress(addr: any): StructuredBusinessData['address'] {
    if (typeof addr === 'string') {
      return { streetAddress: addr };
    }
    return {
      streetAddress: addr.streetAddress ? String(addr.streetAddress) : undefined,
      addressLocality: addr.addressLocality ? String(addr.addressLocality) : undefined,
      addressRegion: addr.addressRegion ? String(addr.addressRegion) : undefined,
      postalCode: addr.postalCode ? String(addr.postalCode) : undefined,
      addressCountry: addr.addressCountry ? String(addr.addressCountry) : undefined
    };
  }
}
