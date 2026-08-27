/**
 * Types & Interfaces for MorfEmail Validation Engine
 */

export interface MxRecord {
  priority: number;
  exchange: string;
}

export type ValidationStatus = 'VALID' | 'RISKY' | 'INVALID' | 'UNKNOWN';

export interface DnsValidationResult {
  domain: string;
  domainExists: boolean;
  mxExists: boolean;
  mxRecords: MxRecord[];
  nullMx: boolean;
  aRecords?: string[];
  error?: string;
  fromCache?: boolean;
  durationMs?: number;
}

export interface SmtpValidationResult {
  attempted: boolean;
  reachable: boolean;
  recipientAccepted?: boolean | null;
  catchAll?: boolean | null;
  responseCode?: number;
  responseMessage?: string;
  technicalStatus: 'DELIVERABLE' | 'UNDELIVERABLE' | 'RISKY' | 'UNKNOWN';
  error?: string;
  durationMs?: number;
}

export interface EmailValidationResult {
  id: string;
  email: string;
  normalizedEmail: string;
  syntaxValid: boolean;
  domain: string;
  domainExists: boolean;
  mxExists: boolean;
  mxRecords: MxRecord[];
  nullMx: boolean;
  disposable: boolean;
  freeProvider: boolean;
  smtpAttempted: boolean;
  smtpReachable: boolean;
  recipientAccepted?: boolean | null;
  catchAll?: boolean | null;
  status: ValidationStatus;
  confidence: number;
  reason: string;
  checkedAt: string;
  durationMs?: number;
}

export interface ValidationProgress {
  current: number;
  total: number;
  percent: number;
  currentEmail: string;
  stepLabel: string;
  validCount: number;
  riskyCount: number;
  invalidCount: number;
  isPaused: boolean;
  isCancelled: boolean;
}

export interface ValidationOptions {
  checkSmtp?: boolean;
  checkCatchAll?: boolean;
  timeoutMs?: number;
  dnsConcurrency?: number;
  smtpConcurrency?: number;
  useCache?: boolean;
}
