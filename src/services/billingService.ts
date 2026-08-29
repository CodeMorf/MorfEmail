import type { PolarBillingState, PolarPlan } from '../types';
import { localApiUrl } from './localApi';

type PolarPlansResponse = {
  configured: boolean;
  plans: PolarPlan[];
  errors?: string[];
};

export type CentralLicenseValidation = {
  valid: boolean;
  error?: string;
  reason?: string;
  serviceName?: string | null;
  plan?: string | null;
  status?: string | null;
  activatedAt?: string | null;
  expiresAt?: string | null;
  remainingDays?: number | null;
  maxDevices?: number | null;
  currentDevices?: number | null;
  subscriptionId?: string;
  offlineToken?: string | null;
  offlineGraceUntil?: string | null;
};

export function getMorfEmailInstallationId(): string {
  if (typeof window === 'undefined') return 'morfemail-server';
  const existing = window.localStorage.getItem('morfemail_installation_id');
  if (existing) return existing;
  const generated = window.crypto?.randomUUID?.();
  if (!generated) throw new Error('El navegador no ofrece un generador criptográfico para la instalación.');
  window.localStorage.setItem('morfemail_installation_id', generated);
  return generated;
}

export function getStoredMorfEmailLicenseKey(): string {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem('morfemail_license_key')?.trim() || '';
}

const centralLicenseVerifyUrl = import.meta.env.VITE_MORFEMAIL_LICENSE_API_URL ||
  'https://codemorf.tech/api/public/licenses/verify';
const offlinePublicKey = String(import.meta.env.VITE_MORFEMAIL_LICENSE_PUBLIC_KEY || '').trim();

function normalizeLicenseKey(value: string): string {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function base64ToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4);
  const binary = window.atob(normalized);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return bytesToHex(new Uint8Array(digest));
}

async function verifyOfflineToken(token: string, licenseKey: string, installationId: string): Promise<CentralLicenseValidation | null> {
  if (!offlinePublicKey || !token) return null;
  const [payloadPart, signaturePart] = token.split('.');
  if (!payloadPart || !signaturePart) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(base64ToBytes(payloadPart))) as CentralLicenseValidation & {
      app?: string;
      licenseHash?: string;
      installationId?: string;
      graceUntil?: string;
    };
    if (payload.valid !== true || payload.app !== 'morfemail' || payload.status !== 'active') return null;
    if (payload.installationId && payload.installationId !== installationId) return null;
    if (!payload.graceUntil || new Date(payload.graceUntil).getTime() <= Date.now()) return null;
    if (payload.expiresAt && new Date(payload.expiresAt).getTime() <= Date.now()) return null;
    if (!payload.licenseHash || payload.licenseHash !== await sha256Hex(normalizeLicenseKey(licenseKey))) return null;

    const pem = offlinePublicKey.replace(/\\n/g, '\n').replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----/g, '').replace(/\s/g, '');
    const publicKey = await window.crypto.subtle.importKey(
      'spki',
      base64ToBytes(pem),
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const validSignature = await window.crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      publicKey,
      base64ToBytes(signaturePart),
      new TextEncoder().encode(payloadPart)
    );
    return validSignature ? { ...payload, reason: 'offline_grace' } : null;
  } catch {
    return null;
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `Solicitud de facturación fallida (${response.status})`);
  return payload as T;
}

export const billingService = {
  async getState(): Promise<PolarBillingState> {
    const response = await fetch(localApiUrl('/api/billing/state'));
    const payload = await parseResponse<{ state: PolarBillingState }>(response);
    return payload.state;
  },

  async getPlans(): Promise<PolarPlansResponse> {
    const response = await fetch(localApiUrl('/api/billing/plans'));
    const local = await parseResponse<PolarPlansResponse>(response);
    if (local.plans.length > 0) return local;

    // Polar está desactivado en este entorno, pero el portal CodeMorf sí
    // publica el catálogo real. Se muestran esos planes y el checkout se deja
    // en el portal hasta que Polar tenga sus productos y webhook configurados.
    const centralResponse = await fetch('https://codemorf.tech/api/public/license-plans');
    const central = await parseResponse<{ plans?: Array<{ id: string; name: string; description?: string; price: number; currency: string; cycle: string }> }>(centralResponse);
    const plans = (central.plans || []).map((plan) => {
      const isLifetime = plan.cycle === 'unico';
      const isAnnual = plan.cycle === 'anual';
      return {
        key: isLifetime ? 'morfemail-lifetime' : isAnnual ? 'morfemail-annual' : 'morfemail-monthly',
        productId: plan.id,
        name: plan.name,
        description: plan.description || 'Licencia de MorfEmail',
        isRecurring: !isLifetime,
        recurringInterval: isAnnual ? 'year' : 'month',
        recurringIntervalCount: 1,
        prices: [{ id: plan.id, amountType: 'fixed', currency: plan.currency, amount: Math.round(plan.price * 100) }],
        source: 'codemorf' as const,
        purchaseUrl: 'https://codemorf.tech/license/'
      };
    });
    return { configured: false, plans, errors: local.errors || [] };
  },

  async createCheckout(planKey: string, customerEmail?: string): Promise<{ id: string; url: string; planKey: string }> {
    const response = await fetch(localApiUrl('/api/billing/checkout'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planKey, customerEmail: customerEmail?.trim() || undefined })
    });
    return parseResponse(response);
  },

  async openCustomerPortal(): Promise<{ url: string }> {
    const response = await fetch(localApiUrl('/api/billing/portal'), { method: 'POST' });
    return parseResponse(response);
  },

  async verifyCentralLicense(licenseKey: string, installationId: string): Promise<CentralLicenseValidation> {
    const response = await fetch(centralLicenseVerifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ licenseKey, app: 'morfemail', installationId })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok && !payload.valid) return payload as CentralLicenseValidation;
    return payload as CentralLicenseValidation;
  },

  async validateLicense(licenseKey: string, installationId: string): Promise<CentralLicenseValidation> {
    const normalized = licenseKey.trim();
    try {
      const online = await this.verifyCentralLicense(normalized, installationId);
      if (online.valid) {
        if (online.offlineToken) window.localStorage.setItem('morfemail_license_offline_token', online.offlineToken);
        return online;
      }
      window.localStorage.removeItem('morfemail_license_offline_token');
      return online;
    } catch (error) {
      const token = window.localStorage.getItem('morfemail_license_offline_token') || '';
      const offline = await verifyOfflineToken(token, normalized, installationId);
      if (offline) return offline;
      throw error;
    }
  }
};
