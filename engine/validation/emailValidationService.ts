/**
 * EmailValidationService - MorfEmail High-Performance Email Validation Engine
 * Orquesta la validación por capas: Sintaxis RFC, Normalización, Dominio, DNS real, Registros MX,
 * Detección de Null MX, Detección de Correos Desechables, Identificación Webmail y Handshake SMTP seguro.
 */

import { EmailValidationResult, ValidationOptions, ValidationProgress } from './types';
import { SyntaxValidator } from './syntaxValidator';
import { DomainNormalizer } from './domainNormalizer';
import { DisposableDomainService } from './disposableDomainService';
import { FreeProviderService } from './freeProviderService';
import { DnsResolverService } from './dnsResolverService';
import { SmtpValidationService } from './smtpValidationService';
import { ConfidenceCalculator } from './confidenceCalculator';
import { ValidationQueue, ProgressCallback } from './validationQueue';

export class EmailValidationService {
  /**
   * Valida un correo electrónico individual de forma real y asíncrona.
   */
  public static async validate(
    rawEmail: string,
    options: ValidationOptions = {}
  ): Promise<EmailValidationResult> {
    const startTime = Date.now();
    const id = `ev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const trimmed = (rawEmail || '').trim();

    // 1. Nivel 1: Validación de Sintaxis RFC 5321 / RFC 5322
    const syntaxResult = SyntaxValidator.validate(trimmed);
    const normalizedEmail = DomainNormalizer.normalizeEmail(trimmed);
    const domain = syntaxResult.domainPart
      ? DomainNormalizer.normalizeDomain(syntaxResult.domainPart)
      : DomainNormalizer.normalizeDomain(trimmed);

    // Si la sintaxis es inválida, no se realizan consultas de red DNS
    if (!syntaxResult.isValid) {
      return {
        id,
        email: trimmed,
        normalizedEmail,
        syntaxValid: false,
        domain,
        domainExists: false,
        mxExists: false,
        mxRecords: [],
        nullMx: false,
        disposable: false,
        freeProvider: false,
        smtpAttempted: false,
        smtpReachable: false,
        status: 'INVALID',
        confidence: 0,
        reason: syntaxResult.error || 'Sintaxis de correo RFC 5322 inválida',
        checkedAt: new Date().toISOString(),
        durationMs: Date.now() - startTime
      };
    }

    // 2. Nivel 4 & 5: Detección de dominios temporales y proveedores gratuitos
    const disposableService = DisposableDomainService.getInstance();
    const isDisposable = disposableService.isDisposable(domain);
    const isFreeProvider = FreeProviderService.isFreeProvider(domain);

    // 3. Nivel 3: Consulta DNS Real (MX, A, AAAA, Null MX RFC 7505)
    const timeoutMs = options.timeoutMs || 5000;
    const dnsResult = await DnsResolverService.resolveDomainDns(domain, timeoutMs);

    // 4. Nivel 6: Comprobación SMTP segura (opcional)
    let smtpResult = null;
    if (options.checkSmtp && dnsResult.mxExists && dnsResult.mxRecords.length > 0 && !dnsResult.nullMx) {
      const primaryMx = dnsResult.mxRecords[0].exchange;
      smtpResult = await SmtpValidationService.verifySmtp(normalizedEmail, primaryMx, {
        timeoutMs: 4000,
        checkCatchAll: options.checkCatchAll
      });
    }

    // 5. Detectar cuenta departamental (info@, ventas@, soporte@)
    const localPart = syntaxResult.localPart.toLowerCase();
    const isRoleAccount = ['info', 'sales', 'ventas', 'contacto', 'contact', 'support', 'soporte', 'admin', 'billing', 'press'].includes(localPart);

    // 6. Cálculo del puntaje de confianza y estado técnico
    const breakdown = ConfidenceCalculator.calculate({
      syntaxValid: true,
      dnsResult,
      isDisposable,
      isFreeProvider,
      smtpResult,
      isRoleAccount
    });

    return {
      id,
      email: trimmed,
      normalizedEmail,
      syntaxValid: true,
      domain,
      domainExists: dnsResult.domainExists,
      mxExists: dnsResult.mxExists,
      mxRecords: dnsResult.mxRecords,
      nullMx: dnsResult.nullMx,
      disposable: isDisposable,
      freeProvider: isFreeProvider,
      smtpAttempted: smtpResult ? smtpResult.attempted : false,
      smtpReachable: smtpResult ? smtpResult.reachable : false,
      recipientAccepted: smtpResult ? smtpResult.recipientAccepted : null,
      catchAll: smtpResult ? smtpResult.catchAll : null,
      status: breakdown.status,
      confidence: breakdown.score,
      reason: breakdown.reason,
      checkedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime
    };
  }

  /**
   * Valida un lote de correos electrónicos mediante la cola de concurrencia.
   */
  public static async validateBatch(
    emails: string[],
    options: ValidationOptions = {},
    onProgress?: ProgressCallback
  ): Promise<EmailValidationResult[]> {
    const queue = new ValidationQueue(options);
    return await queue.process(emails, { onProgress });
  }
}
