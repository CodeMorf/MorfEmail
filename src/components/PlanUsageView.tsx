import React, { useEffect, useState } from 'react';
import { ArrowRight, Check, ExternalLink, RefreshCw, ShieldCheck } from 'lucide-react';
import type { PolarBillingState, PolarPlan } from '../types';
import { billingService, type CentralLicenseValidation } from '../services/billingService';

interface PlanUsageViewProps {
  addToast: (title: string, message?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  centralLicense?: CentralLicenseValidation | null;
}

function priceLabel(plan: PolarPlan): string {
  const price = plan.prices[0];
  if (!price) return 'Precio disponible al elegir el plan';
  if (price.amount === null || !price.currency) return 'Precio disponible al elegir el plan';
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency: price.currency.toUpperCase() }).format(price.amount / 100);
}

function intervalLabel(plan: PolarPlan): string {
  if (!plan.isRecurring) return 'pago único';
  const count = plan.recurringIntervalCount || 1;
  const interval = plan.recurringInterval || 'ciclo';
  return `cada ${count > 1 ? `${count} ` : ''}${interval}`;
}

function isActiveStatus(status: PolarBillingState['status']): boolean {
  return status === 'active' || status === 'trialing';
}

function matchesCentralPlan(plan: PolarPlan, license: CentralLicenseValidation | null | undefined): boolean {
  const values = [license?.plan, license?.serviceName].filter(Boolean).map((value) => String(value).toLowerCase());
  if (values.length === 0) return false;
  if (values.includes(plan.key.toLowerCase()) || values.includes(plan.name.toLowerCase())) return true;
  if (plan.key.endsWith('annual')) return values.some((value) => value.includes('anual') || value.includes('annual'));
  if (plan.key.endsWith('monthly')) return values.some((value) => value.includes('mensual') || value.includes('monthly'));
  if (plan.key.endsWith('lifetime')) return values.some((value) => value.includes('vida') || value.includes('lifetime'));
  return false;
}

export const PlanUsageView: React.FC<PlanUsageViewProps> = ({ addToast, centralLicense }) => {
  const [plans, setPlans] = useState<PolarPlan[]>([]);
  const [state, setState] = useState<PolarBillingState | null>(null);
  const [customerEmail, setCustomerEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [checkoutPlan, setCheckoutPlan] = useState<string | null>(null);
  const [planErrors, setPlanErrors] = useState<string[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const [billingState, planResponse] = await Promise.all([billingService.getState(), billingService.getPlans()]);
      setState(billingState);
      setPlans(planResponse.plans);
      setPlanErrors(planResponse.errors || []);
    } catch (error) {
      addToast('No se pudieron cargar los planes', error instanceof Error ? error.message : String(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const centralActive = Boolean(centralLicense?.valid && centralLicense.status === 'active');
  const effectivePlanName = centralLicense?.serviceName || centralLicense?.plan || state?.planName;

  const startCheckout = async (plan: PolarPlan) => {
    setCheckoutPlan(plan.key);
    try {
      if (plan.source === 'codemorf' && plan.purchaseUrl) {
        window.open(plan.purchaseUrl, '_blank', 'noopener,noreferrer');
        addToast('Compra en CodeMorf', 'El portal abrirá la compra y la activación de tu licencia.', 'info');
        return;
      }
      const checkout = await billingService.createCheckout(plan.key, customerEmail);
      window.open(checkout.url, '_blank', 'noopener,noreferrer');
      addToast('Pago iniciado', 'La pantalla de pago se abrió en una pestaña nueva.', 'success');
    } catch (error) {
      addToast('No se pudo iniciar el pago', error instanceof Error ? error.message : String(error), 'error');
    } finally {
      setCheckoutPlan(null);
    }
  };

  const openPortal = async () => {
    try {
      const portal = await billingService.openCustomerPortal();
      window.open(portal.url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      addToast('Gestión de cuenta no disponible', error instanceof Error ? error.message : String(error), 'warning');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 overflow-y-auto pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">Pago seguro</span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">Planes disponibles</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">Elige tu plan MorfEmail</h1>
          <p className="text-xs text-slate-500 mt-0.5">Consulta los planes, elige el que necesitas y aplica tu cupón durante la compra.</p>
        </div>
        <button onClick={() => void load()} disabled={loading} className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-lg text-xs font-bold self-start"><RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /><span>Actualizar catálogo</span></button>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div><h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">Datos de compra</h2><p className="text-xs text-slate-500 mt-1">El correo se usará para enviarte la confirmación y tu licencia.</p></div>
          <label className="text-xs text-slate-600">Email de compra<input type="email" value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} placeholder="tu@empresa.com" className="block mt-1 w-full sm:w-64 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-[#F04438]" /></label>
        </div>
      </div>

      {plans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => {
            const current = (centralActive && matchesCentralPlan(plan, centralLicense)) || (state?.productId === plan.productId && state ? isActiveStatus(state.status) : false);
            return <div key={plan.productId} className={`p-5 rounded-2xl border flex flex-col justify-between transition-all relative ${current ? 'bg-[#15171A] text-white border-slate-800 shadow-xl ring-2 ring-[#F04438]' : 'bg-white text-slate-900 border-slate-200 shadow-sm'}`}>
              {current && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#F04438] text-white text-[10px] font-extrabold uppercase rounded-full shadow-sm tracking-wider whitespace-nowrap">PLAN ACTIVO</div>}
              <div className="space-y-4"><div><h3 className={`font-black text-lg ${current ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h3><div className="font-mono text-xs font-bold text-[#F04438] mt-1">{intervalLabel(plan)}</div><p className={`text-xs mt-2 ${current ? 'text-slate-400' : 'text-slate-500'}`}>{plan.description || 'Plan de MorfEmail'}</p></div><div className="pt-2"><div className={`text-3xl font-black font-mono ${current ? 'text-white' : 'text-slate-900'}`}>{priceLabel(plan)}</div></div><div className="space-y-2 pt-2 border-t border-slate-100/20 text-xs"><div className="flex items-start space-x-2"><Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" /><span className={current ? 'text-slate-300' : 'text-slate-600'}>Pago seguro y comprobante incluido</span></div><div className="flex items-start space-x-2"><Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" /><span className={current ? 'text-slate-300' : 'text-slate-600'}>Tu acceso se actualiza automáticamente</span></div></div></div>
              <div className="pt-6">{current ? <div className="w-full py-2.5 bg-emerald-900/60 border border-emerald-700/50 text-emerald-300 rounded-xl text-center text-xs font-bold font-mono">Plan activo</div> : <button onClick={() => void startCheckout(plan)} disabled={checkoutPlan !== null} className="w-full py-2.5 bg-[#F04438] hover:bg-[#D92D20] disabled:bg-slate-400 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center space-x-1.5"><span>{checkoutPlan === plan.key ? 'Abriendo pago...' : 'Elegir este plan'}</span>{checkoutPlan === plan.key ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}</button>}</div>
            </div>;
          })}
        </div>
      ) : <div className="bg-white p-8 rounded-2xl border border-amber-200 shadow-sm text-center space-y-3"><ShieldCheck className="w-8 h-8 text-amber-600 mx-auto" /><h2 className="text-sm font-bold text-slate-900">Planes no disponibles</h2><p className="text-xs text-slate-600 max-w-xl mx-auto">El catálogo CodeMorf no respondió. Vuelve a intentarlo más tarde o activa una licencia que ya hayas recibido.</p></div>}

      {planErrors.length > 0 && <div className="bg-white p-4 rounded-xl border border-amber-200 text-xs text-amber-800">No pudimos cargar algunos planes. Intenta actualizar de nuevo.</div>}

      <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600"><div className="flex items-center space-x-3"><ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" /><span>Tus pagos, facturas y cancelación se gestionan de forma segura.</span></div><button onClick={() => void openPortal()} disabled={!state?.portalAvailable} className="text-xs text-blue-700 disabled:text-slate-400 font-bold whitespace-nowrap flex items-center space-x-1"><span>Gestionar mi suscripción</span><ExternalLink className="w-3.5 h-3.5" /></button></div>
    </div>
  );
};
