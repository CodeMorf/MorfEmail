/**
 * TauriBridge - MorfEmail Desktop IPC Layer (Tauri 2)
 * Proporciona una interfaz segura entre el Frontend React y el núcleo de Rust / Engine Desktop.
 */

export interface TauriEnvironmentInfo {
  isTauri: boolean;
  platform: 'windows' | 'macos' | 'linux' | 'web';
  appVersion: string;
  hardwareId: string;
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
      hardwareId: this.getHardwareId()
    };
  }

  public static getHardwareId(): string {
    let hwid = localStorage.getItem('morfemail_hwid');
    if (!hwid) {
      hwid = `HWID-WIN11-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
      localStorage.setItem('morfemail_hwid', hwid);
    }
    return hwid;
  }

  /**
   * Invoca un comando Tauri seguro con fallback para entorno web.
   */
  public static async invokeCommand<T>(cmd: string, args?: Record<string, any>): Promise<T> {
    if (this.isTauriDetected()) {
      try {
        const tauri = (window as any).__TAURI__;
        if (tauri && tauri.core && tauri.core.invoke) {
          return await tauri.core.invoke(cmd, args);
        }
      } catch (e) {
        console.warn(`[TauriBridge] Native command '${cmd}' failed, executing fallback.`, e);
      }
    }

    // Modo Web / Fallback
    return {} as T;
  }
}
