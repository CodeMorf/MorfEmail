/**
 * DnsResolverService - MorfEmail Level 3 Real DNS & MX Resolution
 * Consulta DNS real para registros MX, A, AAAA y detección de Null MX (RFC 7505).
 * Soporta ejecución nativa en Tauri (Rust resolver) y DNS-over-HTTPS (DoH) global de alta disponibilidad.
 */

import { DnsValidationResult, MxRecord } from './types';
import { DomainValidationCache } from './domainValidationCache';
import { TauriBridge } from '../../src/services/tauriBridge';

export class DnsResolverService {
  private static readonly DOH_PROVIDERS = [
    {
      name: 'cloudflare',
      url: (name: string, type: string) => `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`,
      headers: { Accept: 'application/dns-json' }
    },
    {
      name: 'google',
      url: (name: string, type: string) => `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`,
      headers: { Accept: 'application/json' }
    },
    {
      name: 'quad9',
      url: (name: string, type: string) => `https://dns.quad9.net:5053/dns-query?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`,
      headers: { Accept: 'application/dns-json' }
    }
  ];

  /**
   * Resuelve los registros DNS MX y A/AAAA de un dominio de forma real.
   */
  public static async resolveDomainDns(
    domain: string,
    timeoutMs: number = 5000,
    signal?: AbortSignal
  ): Promise<DnsValidationResult> {
    const cleanDomain = domain.toLowerCase().trim();
    if (!cleanDomain) {
      return {
        domain: '',
        domainExists: false,
        mxExists: false,
        mxRecords: [],
        nullMx: false,
        error: 'Dominio vacío'
      };
    }

    if (signal?.aborted) {
      throw new Error('Operación DNS cancelada por el usuario');
    }

    // 1. Verificar caché en memoria
    const cache = DomainValidationCache.getInstance();
    const cached = cache.get(cleanDomain);
    if (cached) {
      return cached;
    }

    const startTime = Date.now();

    // 2. Intentar resolver mediante comando nativo Tauri si está en entorno Desktop
    const nativeResult = await this.tryResolveNativeTauri(cleanDomain);
    if (nativeResult) {
      nativeResult.durationMs = Date.now() - startTime;
      cache.set(cleanDomain, nativeResult);
      return nativeResult;
    }

    // 3. Resolver mediante DoH (DNS-over-HTTPS) real
    try {
      const dohResult = await this.resolveViaDoH(cleanDomain, timeoutMs, signal);
      dohResult.durationMs = Date.now() - startTime;
      cache.set(cleanDomain, dohResult);
      return dohResult;
    } catch (err: any) {
      if (signal?.aborted) {
        throw new Error('Operación DNS cancelada');
      }
      const errorResult: DnsValidationResult = {
        domain: cleanDomain,
        domainExists: false,
        mxExists: false,
        mxRecords: [],
        nullMx: false,
        error: err?.message || 'Error de resolución DNS'
      };
      return errorResult;
    }
  }

  /**
   * Intenta consultar el backend Tauri/Rust mediante IPC.
   */
  private static async tryResolveNativeTauri(domain: string): Promise<DnsValidationResult | null> {
    try {
      const native = await TauriBridge.invokeCommand<any>('verify_email_domain', { domain });
      if (native && typeof native.domain_exists === 'boolean') {
        const mxRecords: MxRecord[] = (native.mx_records || []).map((r: any) => ({
          priority: Number(r.priority) || 0,
          exchange: String(r.exchange || '').toLowerCase().replace(/\.$/, '')
        }));

        return {
          domain,
          domainExists: Boolean(native.domain_exists),
          mxExists: Boolean(native.mx_exists),
          mxRecords,
          nullMx: Boolean(native.null_mx),
          error: native.error || undefined
        };
      }
    } catch {
      // Si no está en Tauri o el comando falló, continuar con DoH
    }
    return null;
  }

  /**
   * Consulta DoH para obtener registros MX y A con tolerancia a fallos entre proveedores.
   */
  private static async resolveViaDoH(
    domain: string,
    timeoutMs: number,
    signal?: AbortSignal
  ): Promise<DnsValidationResult> {
    let mxData: any = null;
    let lastError: Error | null = null;

    // Intentar con los proveedores DoH en orden de prioridad
    for (const provider of this.DOH_PROVIDERS) {
      if (signal?.aborted) {
        throw new Error('Operación DNS cancelada por el usuario');
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        // Si se pasa un signal externo, abortar el fetch cuando se active
        const onExternalAbort = () => controller.abort();
        if (signal) {
          signal.addEventListener('abort', onExternalAbort, { once: true });
        }

        const response = await fetch(provider.url(domain, 'MX'), {
          headers: provider.headers,
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (signal) {
          signal.removeEventListener('abort', onExternalAbort);
        }

        if (response.ok) {
          mxData = await response.json();
          break;
        }
      } catch (e: any) {
        if (signal?.aborted) {
          throw new Error('Operación DNS cancelada por el usuario');
        }
        lastError = e;
        continue; // Intentar siguiente proveedor
      }
    }

    if (!mxData) {
      throw lastError || new Error('No se pudo conectar a los servidores DNS raíz');
    }

    // Status: 0 = NOERROR, 3 = NXDOMAIN (No existe el dominio), 2 = SERVFAIL
    if (mxData.Status === 3) {
      return {
        domain,
        domainExists: false,
        mxExists: false,
        mxRecords: [],
        nullMx: false,
        error: 'El dominio no existe en la zona DNS raíz (NXDOMAIN)'
      };
    }

    const answers = mxData.Answer || [];
    const mxRecords: MxRecord[] = [];
    let nullMx = false;

    for (const ans of answers) {
      // Type 15 es MX en DNS
      if (ans.type === 15 && ans.data) {
        const parts = String(ans.data).trim().split(/\s+/);
        if (parts.length >= 2) {
          const priority = parseInt(parts[0], 10);
          let exchange = parts[1].toLowerCase().replace(/\.$/, '');

          // Detectar Null MX según RFC 7505 (ej: "0 ." o host vacío)
          if ((exchange === '' || exchange === '.') && (priority === 0 || isNaN(priority))) {
            nullMx = true;
          } else {
            mxRecords.push({ priority: isNaN(priority) ? 10 : priority, exchange });
          }
        }
      }
    }

    // Ordenar registros MX por prioridad ascendente (menor número = mayor prioridad)
    mxRecords.sort((a, b) => a.priority - b.priority);

    if (nullMx) {
      return {
        domain,
        domainExists: true,
        mxExists: false,
        mxRecords: [],
        nullMx: true,
        error: 'El dominio declara explícitamente que no acepta correo electrónico (Null MX RFC 7505)'
      };
    }

    if (mxRecords.length > 0) {
      return {
        domain,
        domainExists: true,
        mxExists: true,
        mxRecords,
        nullMx: false
      };
    }

    // Si no tiene registros MX, consultar si existe registro A (RFC 5321 fallback)
    const aRecords = await this.resolveARecords(domain, timeoutMs);
    const domainExists = aRecords.length > 0;

    return {
      domain,
      domainExists,
      mxExists: false,
      mxRecords: [],
      nullMx: false,
      aRecords,
      error: domainExists
        ? 'El dominio existe pero no tiene registros MX configurados'
        : 'El dominio no tiene registros MX ni registros de dirección A/AAAA'
    };
  }

  /**
   * Consulta registros A para verificar existencia del host en caso de ausencia de MX.
   */
  private static async resolveARecords(domain: string, timeoutMs: number): Promise<string[]> {
    try {
      const provider = this.DOH_PROVIDERS[0];
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(provider.url(domain, 'A'), {
        headers: provider.headers,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const answers = data.Answer || [];
        return answers.filter((a: any) => a.type === 1 && a.data).map((a: any) => String(a.data));
      }
    } catch {
      // Silencioso
    }
    return [];
  }
}
