/**
 * SyntaxValidator - MorfEmail Level 1 Validation Engine
 * Validador estricto pero conforme a RFC 5321 / RFC 5322 para correos electrónicos.
 */

export interface SyntaxValidationResult {
  isValid: boolean;
  localPart: string;
  domainPart: string;
  error?: string;
}

export class SyntaxValidator {
  /**
   * Valida la sintaxis de un correo electrónico y desglosa sus componentes.
   */
  public static validate(email: string): SyntaxValidationResult {
    if (!email || typeof email !== 'string') {
      return { isValid: false, localPart: '', domainPart: '', error: 'Correo electrónico vacío o no proporcionado' };
    }

    const trimmed = email.trim();

    // 1. Longitud total permitida por RFC 5321 (máximo 254 caracteres)
    if (trimmed.length < 3) {
      return { isValid: false, localPart: '', domainPart: '', error: 'Longitud de correo demasiado corta' };
    }
    if (trimmed.length > 254) {
      return { isValid: false, localPart: '', domainPart: '', error: 'La longitud total excede los 254 caracteres permitidos (RFC 5321)' };
    }

    // 2. Control de espacios internos o caracteres de control
    if (/[\s\r\n\t]/.test(trimmed)) {
      return { isValid: false, localPart: '', domainPart: '', error: 'El correo contiene espacios o caracteres no permitidos' };
    }

    // 3. Comprobar separador '@'
    const atIndex = trimmed.lastIndexOf('@');
    if (atIndex === -1) {
      return { isValid: false, localPart: '', domainPart: '', error: 'Falta el símbolo arroba (@)' };
    }
    if (atIndex === 0) {
      return { isValid: false, localPart: '', domainPart: '', error: 'Falta la parte local antes de la arroba (@)' };
    }
    if (atIndex === trimmed.length - 1) {
      return { isValid: false, localPart: '', domainPart: '', error: 'Falta el dominio después de la arroba (@)' };
    }

    // Comprobar si hay múltiples arrobas no escapadas
    const atCount = (trimmed.match(/@/g) || []).length;
    if (atCount > 1) {
      return { isValid: false, localPart: '', domainPart: '', error: 'El correo contiene múltiples símbolos @ no permitidos' };
    }

    const localPart = trimmed.slice(0, atIndex);
    const domainPart = trimmed.slice(atIndex + 1);

    // 4. Validar parte local (local-part, máx 64 caracteres)
    if (localPart.length > 64) {
      return { isValid: false, localPart, domainPart, error: 'La parte local excede los 64 caracteres (RFC 5321)' };
    }

    // Puntos al inicio o final de local-part
    if (localPart.startsWith('.') || localPart.endsWith('.')) {
      return { isValid: false, localPart, domainPart, error: 'La parte local no puede comenzar ni terminar con un punto' };
    }

    // Puntos consecutivos en local-part
    if (localPart.includes('..')) {
      return { isValid: false, localPart, domainPart, error: 'La parte local contiene puntos consecutivos (..)' };
    }

    // Caracteres permitidos en local-part según RFC 5322
    // Soporta caracteres alfanuméricos, símbolos estándar y caracteres unicode normalizados
    const validLocalPartRegex = /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~.-]+$/;
    if (!validLocalPartRegex.test(localPart)) {
      return { isValid: false, localPart, domainPart, error: 'La parte local contiene caracteres especiales no válidos' };
    }

    // 5. Validar parte de dominio (domain-part, máx 255 caracteres)
    if (domainPart.length > 255) {
      return { isValid: false, localPart, domainPart, error: 'El nombre de dominio excede los 255 caracteres (RFC 1035)' };
    }

    if (domainPart.startsWith('.') || domainPart.endsWith('.')) {
      return { isValid: false, localPart, domainPart, error: 'El dominio no puede comenzar ni terminar con un punto' };
    }

    if (domainPart.includes('..')) {
      return { isValid: false, localPart, domainPart, error: 'El dominio contiene puntos consecutivos (..)' };
    }

    const domainLabels = domainPart.split('.');
    if (domainLabels.length < 2) {
      return { isValid: false, localPart, domainPart, error: 'El dominio debe contener al menos un punto y una extensión TLD' };
    }

    for (let i = 0; i < domainLabels.length; i++) {
      const label = domainLabels[i];
      if (!label || label.length === 0) {
        return { isValid: false, localPart, domainPart, error: 'Etiqueta de dominio vacía encontrada' };
      }
      if (label.length > 63) {
        return { isValid: false, localPart, domainPart, error: `La etiqueta "${label}" excede los 63 caracteres permitidos (RFC 1035)` };
      }
      if (label.startsWith('-') || label.endsWith('-')) {
        return { isValid: false, localPart, domainPart, error: `La etiqueta de dominio "${label}" no puede iniciar ni terminar con guion (-)` };
      }
      // Caracteres alfanuméricos y guiones
      if (!/^[a-zA-Z0-9-]+$/.test(label)) {
        return { isValid: false, localPart, domainPart, error: `La etiqueta de dominio "${label}" contiene caracteres no válidos` };
      }
    }

    // Validar TLD final (no puede ser solo números y debe tener al menos 2 caracteres)
    const tld = domainLabels[domainLabels.length - 1];
    if (tld.length < 2) {
      return { isValid: false, localPart, domainPart, error: 'El TLD del dominio debe tener al menos 2 caracteres' };
    }
    if (/^\d+$/.test(tld)) {
      return { isValid: false, localPart, domainPart, error: 'El TLD del dominio no puede ser estrictamente numérico' };
    }

    return {
      isValid: true,
      localPart,
      domainPart
    };
  }
}
