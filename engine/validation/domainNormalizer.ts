/**
 * DomainNormalizer - MorfEmail Level 2 Domain Normalizer
 * Normaliza dominios y correos: limpieza de espacios, minúsculas, eliminación de prefijos www., punycode/IDN.
 */

export class DomainNormalizer {
  /**
   * Extrae y normaliza el dominio a partir de un correo electrónico o cadena de dominio.
   */
  public static normalizeDomain(input: string): string {
    if (!input || typeof input !== 'string') return '';

    let domain = input.trim().toLowerCase();

    // Si viene en formato email (ej: ventas@empresa.com)
    if (domain.includes('@')) {
      const parts = domain.split('@');
      domain = parts[parts.length - 1];
    }

    // Limpiar posibles protocolos si vino como URL (ej: https://empresa.com/)
    domain = domain.replace(/^https?:\/\//i, '');
    domain = domain.replace(/\/.*$/, ''); // Quitar rutas

    // Quitar prefijo www. si fue añadido por error en el dominio de email
    domain = domain.replace(/^www\./i, '');

    // Quitar puntos finales
    domain = domain.replace(/\.+$/, '');

    // Normalización Unicode (NFC)
    try {
      domain = domain.normalize('NFC');
    } catch {
      // Ignorar si el runtime no soporta normalize
    }

    return domain.trim();
  }

  /**
   * Normaliza un correo electrónico completo.
   */
  public static normalizeEmail(email: string): string {
    if (!email || typeof email !== 'string') return '';
    const trimmed = email.trim();
    const atIndex = trimmed.lastIndexOf('@');
    if (atIndex === -1) return trimmed.toLowerCase();

    const localPart = trimmed.slice(0, atIndex).trim();
    const domainPart = this.normalizeDomain(trimmed.slice(atIndex + 1));

    return `${localPart}@${domainPart}`;
  }
}
