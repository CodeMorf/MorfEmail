/**
 * SmtpValidationService - MorfEmail Level 6 Safe SMTP Handshake, Multi-MX & Catch-All Detection
 * Comprobación técnica de conexión SMTP (EHLO -> MAIL FROM -> RCPT TO -> RSET -> QUIT) sin enviar correos.
 * Soporta failover de hasta 3 servidores MX, parseo de respuestas multilínea, detección de greylisting y AbortSignal.
 */

import { MxRecord, SmtpValidationResult } from './types';
import { TauriBridge } from '../../src/services/tauriBridge';

export interface SmtpCheckOptions {
  timeoutMs?: number;
  checkCatchAll?: boolean;
  senderEmail?: string;
  signal?: AbortSignal;
}

export interface SmtpParsedResponse {
  code: number;
  message: string;
  lines: string[];
  isComplete: boolean;
  isMultiline: boolean;
  isGreylisted: boolean;
}

export class SmtpValidationService {
  private static lastHostAccess: Map<string, number> = new Map();
  private static readonly RATE_LIMIT_PER_HOST_MS = 300; // Rate limit para no saturar el mismo servidor MX

  /**
   * Parsea una respuesta SMTP cruda (RFC 5321), manejando respuestas multilínea (250- ... 250 OK)
   */
  public static parseMultilineResponse(raw: string): SmtpParsedResponse {
    const lines = (raw || '').split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) {
      return {
        code: 0,
        message: '',
        lines: [],
        isComplete: false,
        isMultiline: false,
        isGreylisted: false
      };
    }

    const lastLine = lines[lines.length - 1];
    const codeMatch = lastLine.match(/^(\d{3})([ -])(.*)$/);
    const code = codeMatch ? parseInt(codeMatch[1], 10) : 0;
    const isContinuation = codeMatch ? codeMatch[2] === '-' : false;
    const isComplete = code > 0 && !isContinuation;
    const isMultiline = lines.length > 1;

    const fullMessage = lines.join(' ');
    const lowerMessage = fullMessage.toLowerCase();
    const isGreylisted =
      code === 450 ||
      code === 451 ||
      lowerMessage.includes('greylist') ||
      lowerMessage.includes('try again later') ||
      lowerMessage.includes('deferred') ||
      lowerMessage.includes('temporarily rejected');

    return {
      code,
      message: fullMessage,
      lines,
      isComplete,
      isMultiline,
      isGreylisted
    };
  }

  /**
   * Evalúa el código y mensaje SMTP según RFC 5321 / RFC 5322 para determinar el estado técnico.
   */
  public static evaluateSmtpCode(code: number, message: string = ''): {
    technicalStatus: 'DELIVERABLE' | 'UNDELIVERABLE' | 'RISKY' | 'UNKNOWN';
    recipientAccepted: boolean | null;
    isGreylisted: boolean;
    isTemporary: boolean;
  } {
    const lower = message.toLowerCase();
    const isGreylisted =
      code === 450 ||
      code === 451 ||
      lower.includes('greylist') ||
      lower.includes('try again') ||
      lower.includes('deferred');

    if (code === 250) {
      return {
        technicalStatus: 'DELIVERABLE',
        recipientAccepted: true,
        isGreylisted: false,
        isTemporary: false
      };
    }

    if (isGreylisted || code === 450 || code === 451 || code === 452) {
      return {
        technicalStatus: 'RISKY',
        recipientAccepted: null,
        isGreylisted: true,
        isTemporary: true
      };
    }

    if (code === 550 || code === 551 || code === 552 || code === 553 || code === 554) {
      return {
        technicalStatus: 'UNDELIVERABLE',
        recipientAccepted: false,
        isGreylisted: false,
        isTemporary: false
      };
    }

    if (code === 421) {
      // Service unavailable / channel closing -> temporary failure (UNKNOWN / try next MX)
      return {
        technicalStatus: 'UNKNOWN',
        recipientAccepted: null,
        isGreylisted: false,
        isTemporary: true
      };
    }

    return {
      technicalStatus: 'UNKNOWN',
      recipientAccepted: null,
      isGreylisted: false,
      isTemporary: true
    };
  }

  /**
   * Ejecuta la comprobación SMTP Multi-MX (probando hasta 3 servidores MX con failover automático).
   */
  public static async verifySmtp(
    email: string,
    mxHostOrList: string | string[] | MxRecord[],
    options: SmtpCheckOptions = {}
  ): Promise<SmtpValidationResult> {
    const timeoutMs = options.timeoutMs || 6000;
    const startTime = Date.now();

    if (options.signal?.aborted) {
      return {
        attempted: false,
        reachable: false,
        technicalStatus: 'UNKNOWN',
        error: 'Operación cancelada por el usuario',
        durationMs: 0
      };
    }

    // Normalizar lista de servidores MX
    const mxHosts: string[] = [];
    if (typeof mxHostOrList === 'string') {
      if (mxHostOrList.trim()) mxHosts.push(mxHostOrList.trim());
    } else if (Array.isArray(mxHostOrList)) {
      for (const item of mxHostOrList) {
        const host = typeof item === 'string' ? item : item?.exchange;
        if (host && host.trim() && !mxHosts.includes(host.trim())) {
          mxHosts.push(host.trim());
        }
      }
    }

    if (!email || mxHosts.length === 0) {
      return {
        attempted: false,
        reachable: false,
        technicalStatus: 'UNKNOWN',
        error: 'Host MX o correo no proporcionado'
      };
    }

    const maxMxToTry = Math.min(mxHosts.length, 3);
    const candidateHosts = mxHosts.slice(0, maxMxToTry);

    // 1. Intentar verificación nativa por socket TCP en Tauri Desktop
    try {
      if (options.signal?.aborted) {
        throw new Error('Aborted');
      }

      const native = await TauriBridge.invokeCommand<any>('verify_email_smtp', {
        email,
        mxHost: candidateHosts[0],
        mxHosts: candidateHosts,
        timeoutMs,
        checkCatchAll: Boolean(options.checkCatchAll)
      });

      if (native && typeof native.reachable === 'boolean') {
        const isGreylisted = Boolean(
          native.response_code === 450 ||
          native.response_code === 451 ||
          (native.response_message && native.response_message.toLowerCase().includes('greylist'))
        );

        return {
          attempted: true,
          reachable: Boolean(native.reachable),
          recipientAccepted: native.recipient_accepted ?? null,
          catchAll: native.catch_all ?? null,
          greylisted: isGreylisted,
          responseCode: native.response_code ?? (native.reachable ? 250 : undefined),
          responseMessage: native.response_message ?? 'SMTP OK',
          selectedMx: candidateHosts[0],
          triedMxCount: candidateHosts.length,
          technicalStatus: native.technical_status || (native.recipient_accepted ? 'DELIVERABLE' : 'UNKNOWN'),
          durationMs: Date.now() - startTime
        };
      }
    } catch (e: any) {
      if (options.signal?.aborted) {
        return {
          attempted: false,
          reachable: false,
          technicalStatus: 'UNKNOWN',
          error: 'Operación cancelada por el usuario',
          durationMs: Date.now() - startTime
        };
      }
    }

    // 2. En entorno Web / Browser Sandbox:
    // Retornamos estado UNKNOWN documentado (sin asumir falso INVALID ni falso VALID)
    return {
      attempted: false,
      reachable: true,
      recipientAccepted: null,
      catchAll: null,
      greylisted: false,
      selectedMx: candidateHosts[0],
      triedMxCount: candidateHosts.length,
      technicalStatus: 'UNKNOWN',
      responseMessage: 'Comprobación SMTP de sockets TCP reservada para cliente desktop nativo',
      durationMs: Date.now() - startTime
    };
  }

  /**
   * Genera una dirección de correo aleatoria no existente para probar si el servidor MX es Catch-All.
   */
  public static generateRandomProbeAddress(domain: string): string {
    const randomHex = Math.random().toString(36).substring(2, 10);
    const timestamp = Date.now().toString(36);
    return `morf_probe_${timestamp}_${randomHex}@${domain}`;
  }

  public static async applyHostRateLimit(host: string): Promise<void> {
    const cleanHost = host.toLowerCase().trim();
    const lastTime = this.lastHostAccess.get(cleanHost) || 0;
    const now = Date.now();
    const diff = now - lastTime;

    if (diff < this.RATE_LIMIT_PER_HOST_MS) {
      const waitTime = this.RATE_LIMIT_PER_HOST_MS - diff;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastHostAccess.set(cleanHost, Date.now());
  }
}
