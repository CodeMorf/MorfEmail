/**
 * FreeProviderService - MorfEmail Level 5 Free Webmail Provider Detection
 * Identifica proveedores webmail populares (Gmail, Outlook, Yahoo, Proton, iCloud, etc.).
 * Importante: Un correo de Gmail o Outlook NO es inválido. Se clasifica como VALID DOMAIN / FREE EMAIL PROVIDER.
 */

export class FreeProviderService {
  private static readonly FREE_PROVIDERS: Record<string, string> = {
    // Google
    'gmail.com': 'Google Mail',
    'googlemail.com': 'Google Mail',

    // Microsoft
    'outlook.com': 'Microsoft Outlook',
    'outlook.es': 'Microsoft Outlook',
    'hotmail.com': 'Microsoft Hotmail',
    'hotmail.es': 'Microsoft Hotmail',
    'hotmail.co.uk': 'Microsoft Hotmail',
    'live.com': 'Microsoft Live',
    'live.es': 'Microsoft Live',
    'msn.com': 'Microsoft MSN',

    // Yahoo
    'yahoo.com': 'Yahoo Mail',
    'yahoo.es': 'Yahoo Mail',
    'yahoo.com.mx': 'Yahoo Mail',
    'yahoo.co.uk': 'Yahoo Mail',
    'ymail.com': 'Yahoo Mail',
    'myyahoo.com': 'Yahoo Mail',

    // Apple
    'icloud.com': 'Apple iCloud',
    'me.com': 'Apple MobileMe',
    'mac.com': 'Apple Mac',

    // Privacy & Alternative
    'proton.me': 'Proton Mail',
    'protonmail.com': 'Proton Mail',
    'protonmail.ch': 'Proton Mail',
    'tutanota.com': 'Tuta Mail',
    'tuta.com': 'Tuta Mail',
    'zoho.com': 'Zoho Mail',
    'zohomail.com': 'Zoho Mail',

    // Others
    'aol.com': 'AOL Mail',
    'aim.com': 'AOL Aim',
    'gmx.com': 'GMX Mail',
    'gmx.net': 'GMX Mail',
    'gmx.de': 'GMX Mail',
    'gmx.es': 'GMX Mail',
    'mail.com': 'Mail.com',
    'yandex.com': 'Yandex Mail',
    'yandex.ru': 'Yandex Mail',
    'mail.ru': 'Mail.ru',
    'inbox.lv': 'Inbox.lv',
    'fastmail.com': 'FastMail',
    'laposte.net': 'La Poste Mail',
    'orange.fr': 'Orange Mail',
    'wanadoo.fr': 'Orange Wanadoo',
    'free.fr': 'Free.fr Mail',
    'sfr.fr': 'SFR Mail',
    'web.de': 'Web.de',
    't-online.de': 'Deutsche Telekom'
  };

  /**
   * Comprueba si el dominio es un proveedor de correo gratuito/webmail.
   */
  public static isFreeProvider(domain: string): boolean {
    if (!domain) return false;
    const clean = domain.toLowerCase().trim();
    return clean in this.FREE_PROVIDERS;
  }

  /**
   * Obtiene el nombre comercial del proveedor de webmail.
   */
  public static getProviderName(domain: string): string | null {
    if (!domain) return null;
    const clean = domain.toLowerCase().trim();
    return this.FREE_PROVIDERS[clean] || null;
  }
}
