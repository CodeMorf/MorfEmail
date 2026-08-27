/**
 * CancellationToken - MorfEmail Async Task & Queue Cancellation Controller
 * Proporciona soporte de cancelación inmediata (AbortSignal) y pausa para operaciones asíncronas.
 */

export class CancellationToken {
  private _isCancelled: boolean = false;
  private _isPaused: boolean = false;
  private _abortController: AbortController = new AbortController();
  private _cancelListeners: Array<() => void> = [];

  public get isCancelled(): boolean {
    return this._isCancelled;
  }

  public get isPaused(): boolean {
    return this._isPaused;
  }

  public get signal(): AbortSignal {
    return this._abortController.signal;
  }

  /**
   * Dispara la cancelación inmediata:
   * - Aborta todas las peticiones de red activas asociadas al AbortSignal.
   * - Notifica a los oyentes de cancelación.
   */
  public cancel(): void {
    if (this._isCancelled) return;
    this._isCancelled = true;
    this._isPaused = false;
    this._abortController.abort();
    for (const listener of this._cancelListeners) {
      try {
        listener();
      } catch {
        // Ignorar errores de oyentes
      }
    }
  }

  public pause(): void {
    this._isPaused = true;
  }

  public resume(): void {
    this._isPaused = false;
  }

  public onCancel(listener: () => void): () => void {
    this._cancelListeners.push(listener);
    return () => {
      this._cancelListeners = this._cancelListeners.filter(l => l !== listener);
    };
  }

  public throwIfCancelled(): void {
    if (this._isCancelled) {
      throw new Error('Operación cancelada por el usuario');
    }
  }
}
