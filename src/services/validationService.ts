/**
 * ValidationService - MorfEmail UI Validation Service
 * Expone la validación de emails y deduplicación a las vistas de la aplicación.
 */

import { EmailValidationService } from '../../engine/validation/emailValidationService';
import { EmailValidationResult, ValidationOptions, ValidationProgress } from '../../engine/validation/types';
import { ValidationQueue } from '../../engine/validation/validationQueue';
import { EmailVerificationItem, Lead } from '../types';

export class ValidationService {
  /**
   * Crea una sesión de cola interactiva que permite pausar, reanudar o cancelar el lote en ejecución.
   */
  public static createQueueSession(options: ValidationOptions = {}): {
    queue: ValidationQueue;
    start: (
      emails: string[],
      callbacks?: {
        onProgress?: (progress: ValidationProgress) => void;
        onItem?: (item: EmailVerificationItem) => void;
      }
    ) => Promise<EmailVerificationItem[]>;
  } {
    const queue = EmailValidationService.createQueue(options);

    const start = async (
      emails: string[],
      callbacks?: {
        onProgress?: (progress: ValidationProgress) => void;
        onItem?: (item: EmailVerificationItem) => void;
      }
    ): Promise<EmailVerificationItem[]> => {
      const rawResults = await queue.process(emails, {
        onProgress: callbacks?.onProgress,
        onItem: callbacks?.onItem
          ? (res) => callbacks.onItem!(ValidationService.mapResultToVerificationItem(res))
          : undefined
      });
      return rawResults.map(ValidationService.mapResultToVerificationItem);
    };

    return { queue, start };
  }

  /**
   * Valida un lote de correos electrónicos con soporte de progreso en tiempo real.
   */
  public static async verifyBatch(
    emails: string[],
    options: ValidationOptions = {},
    onProgress?: (progress: ValidationProgress) => void
  ): Promise<EmailVerificationItem[]> {
    const rawResults = await EmailValidationService.validateBatch(emails, options, onProgress);

    return rawResults.map(this.mapResultToVerificationItem);
  }

  /**
   * Valida un correo electrónico individual.
   */
  public static async verifySingle(
    email: string,
    options: ValidationOptions = {}
  ): Promise<EmailVerificationItem> {
    const raw = await EmailValidationService.validate(email, options);
    return this.mapResultToVerificationItem(raw);
  }

  /**
   * Transforma el resultado del motor detallado al formato de UI EmailVerificationItem.
   */
  public static mapResultToVerificationItem(result: EmailValidationResult): EmailVerificationItem {
    return {
      id: result.id,
      email: result.email,
      syntax: result.syntaxValid,
      domain: result.domain,
      mxRecord: result.mxExists,
      smtpCheck: result.smtpAttempted ? Boolean(result.smtpReachable) : result.mxExists,
      status: result.status.toLowerCase() as 'valid' | 'risky' | 'invalid' | 'unknown',
      confidence: result.confidence,
      reason: result.reason,
      mxRecords: result.mxRecords,
      nullMx: result.nullMx,
      disposable: result.disposable,
      freeProvider: result.freeProvider,
      catchAll: result.catchAll,
      checkedAt: result.checkedAt
    };
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
