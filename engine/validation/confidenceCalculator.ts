/**
 * ConfidenceCalculator - MorfEmail Score & Status Calculation Engine
 * Calcula el puntaje de confianza (0-100) y clasifica el estado (VALID, RISKY, INVALID, UNKNOWN)
 * basado estrictamente en señales técnicas reales y ponderadas.
 */

import { DnsValidationResult, SmtpValidationResult, ValidationStatus } from './types';

export interface ScoreBreakdown {
  score: number;
  status: ValidationStatus;
  reason: string;
  signals: {
    syntaxScore: number;
    domainScore: number;
    mxScore: number;
    disposablePenalty: number;
    providerReputation: number;
    smtpScore: number;
    catchAllPenalty: number;
  };
}

export class ConfidenceCalculator {
  /**
   * Calcula el estado y puntaje de confianza a partir de todas las capas de validación.
   */
  public static calculate(params: {
    syntaxValid: boolean;
    dnsResult: DnsValidationResult;
    isDisposable: boolean;
    isFreeProvider: boolean;
    smtpResult?: SmtpValidationResult | null;
    isRoleAccount?: boolean;
  }): ScoreBreakdown {
    const {
      syntaxValid,
      dnsResult,
      isDisposable,
      isFreeProvider,
      smtpResult,
      isRoleAccount
    } = params;

    // 1. Caso crítico: Sintaxis inválida
    if (!syntaxValid) {
      return {
        score: 0,
        status: 'INVALID',
        reason: 'Sintaxis de correo RFC 5321/5322 inválida',
        signals: {
          syntaxScore: 0,
          domainScore: 0,
          mxScore: 0,
          disposablePenalty: 0,
          providerReputation: 0,
          smtpScore: 0,
          catchAllPenalty: 0
        }
      };
    }

    // 2. Caso crítico: Null MX (RFC 7505)
    if (dnsResult.nullMx) {
      return {
        score: 0,
        status: 'INVALID',
        reason: 'El dominio declara que no acepta correo electrónico (Null MX RFC 7505)',
        signals: {
          syntaxScore: 15,
          domainScore: 15,
          mxScore: 0,
          disposablePenalty: 0,
          providerReputation: 0,
          smtpScore: 0,
          catchAllPenalty: 0
        }
      };
    }

    // 3. Caso crítico: Dominio no existe (NXDOMAIN) o sin registros de correo
    if (!dnsResult.domainExists) {
      return {
        score: 5,
        status: 'INVALID',
        reason: 'El dominio no existe en la zona DNS raíz (NXDOMAIN)',
        signals: {
          syntaxScore: 15,
          domainScore: 0,
          mxScore: 0,
          disposablePenalty: 0,
          providerReputation: 0,
          smtpScore: 0,
          catchAllPenalty: 0
        }
      };
    }

    if (!dnsResult.mxExists) {
      return {
        score: 10,
        status: 'INVALID',
        reason: 'El dominio no cuenta con registros MX de correo electrónico activos',
        signals: {
          syntaxScore: 15,
          domainScore: 15,
          mxScore: 0,
          disposablePenalty: 0,
          providerReputation: 0,
          smtpScore: 0,
          catchAllPenalty: 0
        }
      };
    }

    // 4. Caso: Dominio temporal o desechable
    if (isDisposable) {
      return {
        score: 15,
        status: 'INVALID',
        reason: 'Proveedor de correo temporal o desechable (Spam / Fake Mailbox)',
        signals: {
          syntaxScore: 15,
          domainScore: 15,
          mxScore: 30,
          disposablePenalty: -45,
          providerReputation: 0,
          smtpScore: 0,
          catchAllPenalty: 0
        }
      };
    }

    // 5. Cálculo progresivo de señales
    let syntaxScore = 20;
    let domainScore = 20;
    let mxScore = 35;
    let disposablePenalty = 0;
    let providerReputation = isFreeProvider ? 10 : 15;
    let smtpScore = 0;
    let catchAllPenalty = 0;

    let status: ValidationStatus = 'VALID';
    let reason = isFreeProvider
      ? 'Webmail conocido con infraestructura MX de alta reputación'
      : 'Dominio corporativo con servidores MX activos verificados';

    // Evaluar SMTP si fue ejecutado
    if (smtpResult && smtpResult.attempted) {
      if (smtpResult.recipientAccepted === true) {
        if (smtpResult.catchAll === true) {
          status = 'RISKY';
          catchAllPenalty = -20;
          smtpScore = 5;
          reason = 'Servidor configurado en modo Catch-All (acepta cualquier dirección entrante)';
        } else {
          status = 'VALID';
          smtpScore = 15;
          reason = 'Buzón verificado y aceptado por el servidor de correo (250 OK)';
        }
      } else if (smtpResult.recipientAccepted === false) {
        status = 'INVALID';
        reason = 'Buzón rechazado por el servidor de correo (550 Mailbox not found / Recipient rejected)';
        smtpScore = -50;
      } else if (smtpResult.greylisted || smtpResult.responseCode === 450 || smtpResult.responseCode === 451) {
        status = 'RISKY';
        smtpScore = -10;
        reason = 'Servidor respondió con Greylisting temporal (450/451); reintento posterior requerido';
      } else if (smtpResult.technicalStatus === 'UNKNOWN') {
        // Cuando SMTP fue activado pero resultó inconcluso (timeout/puerto 25 bloqueado), NO se marca como VALID
        status = 'UNKNOWN';
        reason = smtpResult.responseMessage || 'Servidores MX no alcanzables en puerto 25 (Timeout o bloqueo de cortafuegos)';
      }
    }

    // Ajuste por cuenta departamental o genérica (info@, ventas@, soporte@)
    if (isRoleAccount && status === 'VALID') {
      reason = isFreeProvider
        ? 'Webmail verificado con registros DNS activos'
        : 'Buzón corporativo con registros DNS MX verificados';
    }

    // Sumar y normalizar a [0, 100]
    let totalScore = syntaxScore + domainScore + mxScore + disposablePenalty + providerReputation + smtpScore + catchAllPenalty;
    totalScore = Math.max(0, Math.min(100, totalScore));

    return {
      score: totalScore,
      status,
      reason,
      signals: {
        syntaxScore,
        domainScore,
        mxScore,
        disposablePenalty,
        providerReputation,
        smtpScore,
        catchAllPenalty
      }
    };
  }
}
