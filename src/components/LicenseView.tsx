import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowUpRight,
  Calendar,
  Check,
  ExternalLink,
  KeyRound,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Zap
} from 'lucide-react';
import type { ActiveView, PolarBillingState } from '../types';
import { billingService, getMorfEmailInstallationId, type CentralLicenseValidation } from '../services/billingService';

interface LicenseViewProps {
  setActiveView: (view: ActiveView) => void;
  addToast: (title: string, message?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  requiredAccess?: boolean;
  onLicenseValidated?: (license: CentralLicenseValidation) => void;
}

function statusLabel(state: PolarBillingState | null): string {
  if (!state || state.status === 'unconfigured') return 'Planes no disponibles';
  if (state.status === 'active' && state.cancelAtPeriodEnd) return 'Activa; cancelación programada';
  return {
    inactive: 'Sin plan activo',
    incomplete: 'Pago pendiente',
    trialing: 'En período de prueba',
    active: 'Plan activo',
    past_due: 'Pago atrasado',
    canceled: 'Plan cancelado',
    revoked: 'Acceso retirado',
    paused: 'Plan pausado',
    unknown: 'Estado no reconocido'
  }[state.status] || 'Estado no disponible';
}

function statusTone(state: PolarBillingState | null): string {
  if (state?.status === 'active' && !state.cancelAtPeriodEnd) return 'text-emerald-300';
  if (state?.status === 'trialing') return 'text-blue-300';
  return 'text-amber-300';
}

function remainingLabel(license: CentralLicenseValidation): string {
  if (license.expiresAt == null) return 'Sin vencimiento';
  const days = license.remainingDays ?? Math.max(0, Math.ceil((new Date(license.expiresAt).getTime() - Date.now()) / 86400000));
  if (days <= 0) return 'Vencida';
  if (days < 30) return `${days} día${days === 1 ? '' : 's'}`;
  const months = Math.floor(days / 30);
  const rest = days % 30;
  return `${months} mes${months === 1 ? '' : 'es'}${rest ? ` y ${rest} día${rest === 1 ? '' : 's'}` : ''}`;
}

export const LicenseView: React.FC<LicenseViewProps> = ({ setActiveView, addToast, requiredAccess = false, onLicenseValidated }) => {
  const [state, setState] = useState<PolarBillingState | null>(null);
  const [loading, setLoading] = useState(true);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [centralKey, setCentralKey] = useState(() => localStorage.getItem('morfemail_license_key') || '');
  const [centralLicense, setCentralLicense] = useState<CentralLicenseValidation | null>(null);
  const [validatingCentral, setValidatingCentral] = useState(false);
  const [centralError, setCentralError] = useState('');

  const installationId = getMorfEmailInstallationId();

  const loadState = useCallback(async () => {
    setLoading(true);
    try {
      setState(await billingService.getState());
    } catch (error) {
      addToast('No se pudo actualizar la cuenta', error instanceof Error ? error.message : String(error), 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    void loadState();
  }, [loadState]);

  const verifyCentralLicense = async (key = centralKey) => {
    const normalized = key.trim();
    setCentralError('');
    setCentralLicense(null);
    if (!normalized) {
      setCentralError('Pega la clave que recibiste en codemorf.tech/license/.');
      return;
    }
    setValidatingCentral(true);
    try {
      const result = await billingService.validateLicense(normalized, installationId);
      if (!result.valid) {
        setCentralError(result.error || 'La licencia no está activa o ya venció.');
        return;
      }
      localStorage.setItem('morfemail_license_key', normalized);
      setCentralKey(normalized);
      setCentralLicense(result);
      onLicenseValidated?.(result);
    } catch (error) {
      setCentralError(error instanceof Error ? error.message : 'No se pudo verificar la licencia central.');
    } finally {
      setValidatingCentral(false);
    }
  };

  useEffect(() => {
    if (centralKey) void verifyCentralLicense(centralKey);
  // The stored key is intentionally checked once when this view opens.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onLicenseValidated]);

  const openPortal = async () => {
    setOpeningPortal(true);
    try {
      const portal = await billingService.openCustomerPortal();
      window.open(portal.url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      addToast('Portal no disponible', error instanceof Error ? error.message : String(error), 'warning');
    } finally {
      setOpeningPortal(false);
    }
  };

  const centralActive = Boolean(centralLicense?.valid && centralLicense.status === 'active');
  const isActive = centralActive || state?.status === 'active' || state?.status === 'trialing';
  const effectivePlanName = centralLicense?.serviceName || centralLicense?.plan || state?.planName;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 overflow-y-auto pb-16">
      {requiredAccess && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-950 shadow-sm">
          <div className="font-extrabold">Activa una licencia para continuar</div>
          <p className="mt-1 text-xs text-amber-800">MorfEmail requiere una suscripción activa. Compra el plan en CodeMorf o pega aquí la key que ya recibiste.</p>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">Pago seguro</span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">MorfEmail</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">Tu plan y licencia</h1>
          <p className="text-xs text-slate-500 mt-0.5">Activa MorfEmail y consulta el estado de tu cuenta.</p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button onClick={() => void loadState()} disabled={loading} className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-lg text-xs font-bold"><RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /><span>Actualizar</span></button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-blue-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex items-start space-x-3">
            <KeyRound className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Clave de licencia MorfEmail</h2>
            <p className="text-xs text-slate-600 mt-1">Pega aquí la licencia que recibiste al comprar MorfEmail.</p>
            </div>
          </div>
          <a href="https://codemorf.tech/license/" target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-700 hover:text-blue-900 whitespace-nowrap">Comprar o recuperar key ↗</a>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input value={centralKey} onChange={event => setCentralKey(event.target.value)} placeholder="MORF-EMAIL-…" className="min-w-0 flex-1 px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button onClick={() => void verifyCentralLicense()} disabled={validatingCentral} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center space-x-2"><span>{validatingCentral ? 'Verificando…' : 'Validar key'}</span>{validatingCentral ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}</button>
        </div>
        {centralLicense?.valid && <div className="space-y-3"><div className="text-xs text-emerald-700 font-semibold flex items-center space-x-2"><Check className="w-4 h-4" /><span>Licencia activa{centralLicense.serviceName ? ` · ${centralLicense.serviceName}` : ''}{centralLicense.reason === 'offline_grace' ? ' · gracia offline' : ''}.</span></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4"><div className="rounded-lg bg-emerald-50 px-3 py-2"><span className="block text-[10px] font-bold uppercase text-slate-500">Plan</span><span className="text-xs font-bold text-slate-900">{centralLicense.plan || centralLicense.serviceName || 'MorfEmail'}</span></div><div className="rounded-lg bg-emerald-50 px-3 py-2"><span className="block text-[10px] font-bold uppercase text-slate-500">Activada</span><span className="text-xs font-bold text-slate-900">{centralLicense.activatedAt ? new Date(centralLicense.activatedAt).toLocaleDateString('es-DO') : 'Ahora'}</span></div><div className="rounded-lg bg-emerald-50 px-3 py-2"><span className="block text-[10px] font-bold uppercase text-slate-500">Vence</span><span className="text-xs font-bold text-slate-900">{centralLicense.expiresAt ? new Date(centralLicense.expiresAt).toLocaleDateString('es-DO') : 'Sin vencimiento'}</span></div><div className="rounded-lg bg-emerald-50 px-3 py-2"><span className="block text-[10px] font-bold uppercase text-slate-500">Tiempo restante</span><span className="text-xs font-bold text-slate-900">{remainingLabel(centralLicense)}</span></div></div></div>}
        {centralError && <div className="text-xs text-red-700 font-semibold">{centralError}</div>}
      </div>

      <div className="bg-gradient-to-br from-[#121417] via-[#1A1D21] to-[#121417] text-white p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-2xl space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#F04438]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10 border-b border-slate-800/80 pb-5">
          <div>
            <div className="flex items-center space-x-2"><span className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} /><span className={`text-xs font-mono font-bold uppercase tracking-wider ${centralActive ? 'text-emerald-300' : statusTone(state)}`}>{centralActive ? 'Licencia CodeMorf activa' : statusLabel(state)}</span></div>
            <h2 className="text-2xl font-black tracking-tight mt-1 text-white">{effectivePlanName || 'Plan pendiente de activación'}</h2>
            <p className="text-xs text-slate-400 mt-0.5">Tu cuenta se actualizará automáticamente después del pago.</p>
          </div>
          <span className="px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider">Cuenta</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 relative z-10">
          <div className="p-4 bg-[#202429] border border-slate-700/60 rounded-xl space-y-1.5"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cuenta</span><span className="text-xs text-slate-100">{centralActive ? 'Licencia CodeMorf vinculada' : state?.polarCustomerId ? 'Cuenta vinculada' : 'Se vincula al completar la compra'}</span></div>
          <div className="p-4 bg-[#202429] border border-slate-700/60 rounded-xl space-y-1.5"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Suscripción</span><span className="text-xs text-slate-100">{isActive ? 'Activa' : 'Pendiente de activación'}</span></div>
          <div className="p-4 bg-[#202429] border border-slate-700/60 rounded-xl space-y-1.5"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Acceso</span><span className="text-xs text-slate-100">{isActive ? 'Disponible' : 'Disponible después de comprar'}</span></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 relative z-10 pt-1">
          <div className="p-3 bg-[#181B1F] border border-slate-800 rounded-xl flex items-center space-x-3"><Calendar className="w-5 h-5 text-[#F04438] flex-shrink-0" /><div><span className="text-[10px] text-slate-400 uppercase font-semibold block">Vigencia</span><span className="text-xs font-bold text-slate-100">{centralActive ? (centralLicense?.expiresAt ? `Hasta ${new Date(centralLicense.expiresAt).toLocaleDateString('es-DO')}` : 'Sin vencimiento') : state?.currentPeriodEnd ? `Hasta ${new Date(state.currentPeriodEnd).toLocaleDateString()}` : 'Se mostrará al activar tu plan'}</span></div></div>
          <div className="p-3 bg-[#181B1F] border border-slate-800 rounded-xl flex items-center space-x-3"><ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" /><div><span className="text-[10px] text-slate-400 uppercase font-semibold block">Estado de la cuenta</span><span className="text-xs font-bold text-slate-300">{centralActive ? 'Licencia validada' : state?.lastEventAt ? 'Actualizada recientemente' : 'Pendiente de activación'}</span></div></div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 relative z-10 border-t border-slate-800">
          <button onClick={() => void openPortal()} disabled={openingPortal || !state?.portalAvailable} className="px-4 py-2 bg-[#2B3037] hover:bg-[#343B44] disabled:opacity-50 text-slate-200 rounded-lg text-xs font-semibold flex items-center space-x-2"><ExternalLink className="w-3.5 h-3.5" /><span>{openingPortal ? 'Abriendo...' : 'Gestionar mi suscripción'}</span></button>
          <button onClick={() => setActiveView('plan-usage')} className="px-5 py-2 bg-[#F04438] hover:bg-[#D92D20] text-white rounded-lg text-xs font-bold shadow-md flex items-center space-x-1.5"><Zap className="w-3.5 h-3.5" /><span>Ver planes</span><ArrowUpRight className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {!state?.configured && !centralActive && (
        <div className="bg-white p-6 rounded-2xl border border-amber-200 shadow-sm space-y-3"><div className="flex items-center space-x-2"><Sparkles className="w-4 h-4 text-amber-600" /><h2 className="text-sm font-bold text-slate-900">Compra en CodeMorf</h2></div><p className="text-xs text-slate-600">Los planes se consultan en el portal CodeMorf. Allí se procesa la compra y se genera tu licencia; Polar todavía no está conectado en este entorno.</p><a href="https://codemorf.tech/license/" target="_blank" rel="noreferrer" className="inline-flex text-xs font-bold text-blue-700 hover:text-blue-900">Ver planes y comprar ↗</a></div>
      )}

      {state?.configured && !state.webhookConfigured && <div className="bg-white p-6 rounded-2xl border border-amber-200 shadow-sm text-xs text-amber-800">Tu compra está en proceso de actualización. Si acabas de pagar, espera unos minutos y pulsa “Actualizar”.</div>}
    </div>
  );
};
