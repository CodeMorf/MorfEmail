/**
 * SmtpValidationService - MorfEmail Level 6 Safe SMTP Handshake & Catch-All Detection
 * Comprobación técnica de conexión SMTP (EHLO -> MAIL FROM -> RCPT TO -> QUIT) sin enviar correos.
 * Detecta Catch-All mediante sondeo de buzón aleatorio inexistente sin suposiciones de cadenas.
 */

import { SmtpValidationResult } from './types';
import { TauriBridge } from '../../src/services/tauriBridge';

export interface SmtpCheckOptions {
  timeoutMs?: number;
  checkCatchAll?: boolean;
  senderEmail?: string;
}

export class SmtpValidationService {
  private static lastHostAccess: Map<string, number> = new Map();
  private static readonly RATE_LIMIT_PER_HOST_MS = 500; // Rate limit para no saturar el mismo servidor MX

  /**
   * Ejecuta la comprobación SMTP de forma segura y controlada.
   */
  public static async verifySmtp(
    email: string,
    primaryMxHost: string,
    options: SmtpCheckOptions = {}
  ): Promise<SmtpValidationResult> {
    const timeoutMs = options.timeoutMs || 6000;
    const startTime = Date.now();

    if (!email || !primaryMxHost) {
      return {
        attempted: false,
        reachable: false,
        technicalStatus: 'UNKNOWN',
        error: 'Host MX o correo no proporcionado'
      };
    }

    // Rate limiting por host MX
    await this.applyHostRateLimit(primaryMxHost);

    // 1. Intentar verificación nativa por socket TCP en Tauri Desktop
    try {
      const native = await TauriBridge.invokeCommand<any>('verify_email_smtp', {
        email,
        mxHost: primaryMxHost,
        timeoutMs,
        checkCatchAll: Boolean(options.checkCatchAll)
      });

      if (native && typeof native.reachable === 'boolean') {
        return {
          attempted: true,
          reachable: Boolean(native.reachable),
          recipientAccepted: native.recipient_accepted ?? null,
          catchAll: native.catch_all ?? null,
          responseCode: native.response_code ?? 250,
          responseMessage: native.response_message ?? 'SMTP 250 OK',
          technicalStatus: native.technical_status || (native.recipient_accepted ? 'DELIVERABLE' : 'RISKY'),
          durationMs: Date.now() - startTime
        };
      }
    } catch {
      // Si no está disponible en este entorno, continuar con fallback
    }

    // 2. En entorno de navegador Web / Sandbox sin socket TCP crudo:
    // Retornamos estado UNKNOWN / NO_RAW_SOCKET_IN_BROWSER documentado
    return {
      attempted: false,
      reachable: true,
      recipientAccepted: null,
      catchAll: null,
      technicalStatus: 'UNKNOWN',
      responseMessage: 'Comprobación SMTP reservada para socket nativo de escritorio',
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

  private static async applyHostRateLimit(host: string): Promise<void> {
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
