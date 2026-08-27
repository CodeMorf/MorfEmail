/**
 * ValidationQueue - MorfEmail Concurrency & Batch Queue Engine
 * Gestiona el procesamiento concurrente de lotes (1 a 50,000+ correos)
 * con control de flujo, pausas, cancelaciones y emisión de progreso reactivo.
 */

import { EmailValidationResult, ValidationOptions, ValidationProgress } from './types';
import { EmailValidationService } from './emailValidationService';

export type ProgressCallback = (progress: ValidationProgress) => void;
export type ItemCallback = (result: EmailValidationResult) => void;

export class ValidationQueue {
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private isCancelled: boolean = false;
  private queue: string[] = [];
  private totalCount: number = 0;
  private completedCount: number = 0;
  private validCount: number = 0;
  private riskyCount: number = 0;
  private invalidCount: number = 0;
  private concurrency: number = 10;
  private options: ValidationOptions = {};

  private onProgress?: ProgressCallback;
  private onItem?: ItemCallback;

  constructor(options: ValidationOptions = {}) {
    this.options = options;
    this.concurrency = options.dnsConcurrency || 10;
  }

  /**
   * Ejecuta la cola de validación sobre una lista de correos electrónicos.
   */
  public async process(
    emails: string[],
    callbacks?: { onProgress?: ProgressCallback; onItem?: ItemCallback }
  ): Promise<EmailValidationResult[]> {
    this.queue = [...emails];
    this.totalCount = emails.length;
    this.completedCount = 0;
    this.validCount = 0;
    this.riskyCount = 0;
    this.invalidCount = 0;
    this.isRunning = true;
    this.isPaused = false;
    this.isCancelled = false;

    this.onProgress = callbacks?.onProgress;
    this.onItem = callbacks?.onItem;

    const results: EmailValidationResult[] = new Array(emails.length);
    const workerPromises: Promise<void>[] = [];

    let currentIndex = 0;

    const worker = async () => {
      while (currentIndex < this.queue.length && !this.isCancelled) {
        if (this.isPaused) {
          await new Promise(resolve => setTimeout(resolve, 200));
          continue;
        }

        const index = currentIndex++;
        if (index >= this.queue.length) break;

        const email = this.queue[index];

        this.emitProgress(email, 'Consultando registros de zona DNS y MX...');

        try {
          const result = await EmailValidationService.validate(email, this.options);
          results[index] = result;

          if (result.status === 'VALID') this.validCount++;
          else if (result.status === 'RISKY') this.riskyCount++;
          else this.invalidCount++;

          this.completedCount++;

          if (this.onItem) {
            this.onItem(result);
          }

          this.emitProgress(email, 'Completado');
        } catch (err: any) {
          const fallbackResult: EmailValidationResult = {
            id: `ev-${Date.now()}-${index}`,
            email,
            normalizedEmail: email.toLowerCase().trim(),
            syntaxValid: false,
            domain: '',
            domainExists: false,
            mxExists: false,
            mxRecords: [],
            nullMx: false,
            disposable: false,
            freeProvider: false,
            smtpAttempted: false,
            smtpReachable: false,
            status: 'UNKNOWN',
            confidence: 0,
            reason: `Error en procesamiento: ${err?.message || 'Error desconocido'}`,
            checkedAt: new Date().toISOString()
          };
          results[index] = fallbackResult;
          this.completedCount++;
        }
      }
    };

    const actualConcurrency = Math.min(this.concurrency, emails.length || 1);
    for (let i = 0; i < actualConcurrency; i++) {
      workerPromises.push(worker());
    }

    await Promise.all(workerPromises);
    this.isRunning = false;

    return results.filter(Boolean);
  }

  public pause(): void {
    this.isPaused = true;
  }

  public resume(): void {
    this.isPaused = false;
  }

  public cancel(): void {
    this.isCancelled = true;
    this.isRunning = false;
  }

  public getStatus(): { isRunning: boolean; isPaused: boolean; isCancelled: boolean } {
    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      isCancelled: this.isCancelled
    };
  }

  private emitProgress(currentEmail: string, stepLabel: string): void {
    if (!this.onProgress) return;

    const percent = this.totalCount > 0 ? Math.round((this.completedCount / this.totalCount) * 100) : 0;

    this.onProgress({
      current: this.completedCount,
      total: this.totalCount,
      percent,
      currentEmail,
      stepLabel,
      validCount: this.validCount,
      riskyCount: this.riskyCount,
      invalidCount: this.invalidCount,
      isPaused: this.isPaused,
      isCancelled: this.isCancelled
    });
  }
}
