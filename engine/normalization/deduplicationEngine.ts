/**
 * DeduplicationEngine - MorfEmail Engine
 * Evita prospectos duplicados analizando dominio, website, email, teléfono y nombre+dirección.
 */

import { NormalizedLead } from '../types';
import { UrlNormalizer } from './urlNormalizer';

export interface DeduplicationMatchResult {
  isDuplicate: boolean;
  matchedBy?: 'domain' | 'website' | 'email' | 'phone' | 'name_address';
  existingLeadId?: string;
  confidence: number;
}

export class DeduplicationEngine {
  private knownDomains = new Map<string, string>(); // domain -> leadId
  private knownWebsites = new Map<string, string>(); // normalized website -> leadId
  private knownEmails = new Map<string, string>(); // email -> leadId
  private knownPhones = new Map<string, string>(); // clean digits -> leadId
  private knownNameAddresses = new Map<string, string>(); // composite key -> leadId

  /**
   * Carga una lista existente de leads para deduplicación indexada en memoria.
   */
  public indexExistingLeads(leads: NormalizedLead[]): void {
    this.clear();
    for (const lead of leads) {
      this.registerLead(lead);
    }
  }

  public clear(): void {
    this.knownDomains.clear();
    this.knownWebsites.clear();
    this.knownEmails.clear();
    this.knownPhones.clear();
    this.knownNameAddresses.clear();
  }

  /**
   * Comprueba si un lead nuevo ya existe según los 5 criterios de unicidad.
   */
  public checkDuplicate(lead: Partial<NormalizedLead>): DeduplicationMatchResult {
    // 1. Dominio Canónico (Prioridad 1)
    if (lead.domain || lead.website) {
      const canonical = UrlNormalizer.getCanonicalDomain(lead.domain || lead.website!);
      if (canonical && this.knownDomains.has(canonical)) {
        return {
          isDuplicate: true,
          matchedBy: 'domain',
          existingLeadId: this.knownDomains.get(canonical),
          confidence: 100
        };
      }
    }

    // 2. Website Normalizado
    if (lead.website) {
      const normUrl = UrlNormalizer.normalize(lead.website);
      if (normUrl && this.knownWebsites.has(normUrl)) {
        return {
          isDuplicate: true,
          matchedBy: 'website',
          existingLeadId: this.knownWebsites.get(normUrl),
          confidence: 100
        };
      }
    }

    // 3. Correo Electrónico Principal
    if (lead.email) {
      const cleanEmail = lead.email.trim().toLowerCase();
      if (cleanEmail && this.knownEmails.has(cleanEmail)) {
        return {
          isDuplicate: true,
          matchedBy: 'email',
          existingLeadId: this.knownEmails.get(cleanEmail),
          confidence: 95
        };
      }
    }

    // 4. Teléfono (comparación por dígitos limpios)
    if (lead.phone) {
      const digits = lead.phone.replace(/[^\d]/g, '');
      if (digits.length >= 8 && this.knownPhones.has(digits)) {
        return {
          isDuplicate: true,
          matchedBy: 'phone',
          existingLeadId: this.knownPhones.get(digits),
          confidence: 90
        };
      }
    }

    // 5. Nombre Comercial + Ciudad/Dirección
    if (lead.businessName && (lead.city || lead.address)) {
      const nameKey = this.generateCompositeKey(lead.businessName, lead.city || '', lead.address || '');
      if (this.knownNameAddresses.has(nameKey)) {
        return {
          isDuplicate: true,
          matchedBy: 'name_address',
          existingLeadId: this.knownNameAddresses.get(nameKey),
          confidence: 85
        };
      }
    }

    return {
      isDuplicate: false,
      confidence: 0
    };
  }

  /**
   * Registra un nuevo lead confirmado en los índices de búsqueda.
   */
  public registerLead(lead: NormalizedLead): void {
    if (!lead || !lead.id) return;

    if (lead.domain) {
      const canonical = UrlNormalizer.getCanonicalDomain(lead.domain);
      if (canonical) this.knownDomains.set(canonical, lead.id);
    }

    if (lead.website) {
      const norm = UrlNormalizer.normalize(lead.website);
      if (norm) this.knownWebsites.set(norm, lead.id);
    }

    if (lead.email) {
      this.knownEmails.set(lead.email.trim().toLowerCase(), lead.id);
    }

    if (lead.phone) {
      const digits = lead.phone.replace(/[^\d]/g, '');
      if (digits.length >= 8) this.knownPhones.set(digits, lead.id);
    }

    if (lead.businessName) {
      const key = this.generateCompositeKey(lead.businessName, lead.city || '', lead.address || '');
      this.knownNameAddresses.set(key, lead.id);
    }
  }

  private generateCompositeKey(name: string, city: string, address: string): string {
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanCity = city.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanAddress = address.toLowerCase().slice(0, 15).replace(/[^a-z0-9]/g, '');
    return `${cleanName}_${cleanCity}_${cleanAddress}`;
  }
}
