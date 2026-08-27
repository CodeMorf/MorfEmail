/**
 * ValidationService - MorfEmail UI Validation Service
 * Expone la validación de emails y deduplicación a las vistas de la aplicación.
 */

import { EmailValidationService } from '../../engine/validation/emailValidationService';
import { EmailVerificationItem, Lead } from '../types';
import { DeduplicationEngine } from '../../engine/normalization/deduplicationEngine';

export class ValidationService {
  /**
   * Valida un lote de correos electrónicos.
   */
  public static verifyBatch(emails: string[]): EmailVerificationItem[] {
    return emails.map((e) => EmailValidationService.validate(e));
  }

  /**
   * Detecta y agrupa duplicados en una lista de prospectos existentes.
   */
  public static findDuplicatesInLeads(leads: Lead[]): Array<{ original: Lead; duplicates: Lead[]; reason: string }> {
    const results: Array<{ original: Lead; duplicates: Lead[]; reason: string }> = [];
    const seenDomains = new Map<string, Lead>();
    const seenEmails = new Map<string, Lead>();
    const seenPhones = new Map<string, Lead>();

    for (const lead of leads) {
      const domain = lead.website.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0].toLowerCase();
      const email = lead.email.toLowerCase().trim();
      const phoneDigits = lead.phone.replace(/[^\d]/g, '');

      let matchedLead: Lead | undefined;
      let reason = '';

      if (domain && seenDomains.has(domain)) {
        matchedLead = seenDomains.get(domain);
        reason = `Mismo dominio web (${domain})`;
      } else if (email && seenEmails.has(email)) {
        matchedLead = seenEmails.get(email);
        reason = `Mismo correo electrónico (${email})`;
      } else if (phoneDigits.length >= 8 && seenPhones.has(phoneDigits)) {
        matchedLead = seenPhones.get(phoneDigits);
        reason = `Mismo número telefónico (${lead.phone})`;
      }

      if (matchedLead) {
        const existingGroup = results.find((r) => r.original.id === matchedLead!.id);
        if (existingGroup) {
          existingGroup.duplicates.push(lead);
        } else {
          results.push({
            original: matchedLead,
            duplicates: [lead],
            reason
          });
        }
      } else {
        if (domain) seenDomains.set(domain, lead);
        if (email) seenEmails.set(email, lead);
        if (phoneDigits.length >= 8) seenPhones.set(phoneDigits, lead);
      }
    }

    return results;
  }
}
