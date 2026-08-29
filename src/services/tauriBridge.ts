/**
 * TauriBridge - MorfEmail Desktop IPC Layer (Tauri 2)
 * Proporciona una interfaz segura entre el Frontend React y el núcleo de Rust / Engine Desktop.
 */

export interface TauriEnvironmentInfo {
  isTauri: boolean;
  platform: 'windows' | 'macos' | 'linux' | 'web';
  appVersion: string;
  installationId: string;
}

export class TauriBridge {
  private static isTauriDetected(): boolean {
    return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
  }

  public static async getEnvironment(): Promise<TauriEnvironmentInfo> {
    const isTauri = this.isTauriDetected();
    return {
      isTauri,
      platform: isTauri ? 'windows' : 'web',
      appVersion: '2.0.0',
      installationId: this.getInstallationId()
    };
  }

  /**
   * Identificador opaco y estable de esta instalación.
   * No intenta leer ni exponer seriales, nombres de equipo o huellas invasivas.
   */
  public static getInstallationId(): string {
    const storageKey = 'morfemail_installation_id';
    let installationId = localStorage.getItem(storageKey);
    if (!installationId) {
      installationId = globalThis.crypto?.randomUUID?.();
      if (!installationId) throw new Error('El navegador no ofrece un generador criptográfico para la instalación.');
      localStorage.setItem(storageKey, installationId);
    }
    return installationId;
  }

  /** @deprecated Usa getInstallationId(): el producto no usa un HWID de hardware. */
  public static getHardwareId(): string {
    return this.getInstallationId();
  }

  /**
   * Invoca un comando Tauri seguro con fallback para entorno web.
   */
  public static async invokeCommand<T>(cmd: string, args?: Record<string, any>): Promise<T> {
    if (this.isTauriDetected()) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        return await invoke<T>(cmd, args);
      } catch (e) {
        console.warn(`[TauriBridge] Native command '${cmd}' failed, executing fallback.`, e);
      }
    }

    // Modo Web / Fallback
    return {} as T;
  }
}
