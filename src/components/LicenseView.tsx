import React, { useState } from 'react';
import {
  Key,
  ShieldCheck,
  Laptop,
  CheckCircle2,
  Calendar,
  Copy,
  Eye,
  EyeOff,
  Sparkles,
  ArrowUpRight,
  RefreshCw,
  Cpu,
  ExternalLink,
  Zap,
  Globe,
  AlertCircle,
  HelpCircle,
  Lock,
  Smartphone,
  Layers,
  Database
} from 'lucide-react';
import { ActiveView, PolarLicense } from '../types';
import { INITIAL_POLAR_LICENSE } from '../data/mockData';

interface LicenseViewProps {
  setActiveView: (view: ActiveView) => void;
  addToast: (title: string, message?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const LicenseView: React.FC<LicenseViewProps> = ({ setActiveView, addToast }) => {
  const [license, setLicense] = useState<PolarLicense>(INITIAL_POLAR_LICENSE);
  const [inputKey, setInputKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const maskedKey = license.licenseKey
    ? `${license.licenseKey.slice(0, 12)}••••••••••••••••${license.licenseKey.slice(-6)}`
    : 'No configurada';

  const copyLicense = () => {
    navigator.clipboard.writeText(license.licenseKey);
    addToast('Licencia Polar copiada', 'Clave copiada al portapapeles.', 'success');
  };

  const handleValidateNewKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey.trim()) return;

    setIsValidating(true);
    setTimeout(() => {
      setIsValidating(false);
      setLicense((prev) => ({
        ...prev,
        licenseKey: inputKey.trim(),
        status: 'active',
        lastVerifiedAt: 'Ahora mismo (Polar License API 200 OK)'
      }));
      setInputKey('');
      addToast(
        'Licencia Polar.sh validada',
        'Tu suscripción anual ha sido verificada y activada en este dispositivo.',
        'success'
      );
    }, 900);
  };

  const handleRefreshStatus = () => {
    setIsValidating(true);
    setTimeout(() => {
      setIsValidating(false);
      setLicense((prev) => ({
        ...prev,
        lastVerifiedAt: 'Hace unos segundos (Polar API)'
      }));
      addToast(
        'Estado de Polar.sh sincronizado',
        'Licencia Anual activa y al corriente.',
        'success'
      );
    }, 700);
  };

  const handleDeactivateSeat = () => {
    if (confirm('¿Deseas desvincular este dispositivo de la suscripción de Polar.sh?')) {
      addToast('Dispositivo liberado', 'El puesto de hardware está disponible para otro equipo.', 'info');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 overflow-y-auto pb-16">
      {/* Header with Polar.sh branding */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
              Polar.sh Merchant of Record
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-100 text-[#F04438] border border-red-200">
              Licencia Anual
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Licencia Anual & Facturación Polar
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestión de clave de producto anual, activación de hardware y portal de suscriptor Polar.sh.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <a
            href="https://polar.sh/docs/introduction"
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 transition-colors shadow-xs"
          >
            <span>Documentación Polar.sh</span>
            <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
          </a>

          <a
            href="https://polar.sh/purchases"
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
          >
            <span>Portal Polar.sh</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#F04438]" />
          </a>
        </div>
      </div>

      {/* Main License Card (Dark Luxury) */}
      <div className="bg-gradient-to-br from-[#121417] via-[#1A1D21] to-[#121417] text-white p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Background glow decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#F04438]/15 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top bar inside card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10 border-b border-slate-800/80 pb-5">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                POLAR LICENSE ACTIVE & VERIFIED
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight mt-1 text-white flex items-center space-x-2">
              <span>{license.planName}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Edición Anual para Windows Desktop (Tauri 2 Core + Motor Concurrente 16 Hilos)
            </p>
          </div>

          <div className="flex flex-col sm:items-end">
            <span className="px-3 py-1 rounded-lg bg-red-950/80 border border-red-800/60 text-[#F04438] font-bold text-xs uppercase tracking-wider">
              Suscripción Anual
            </span>
            <span className="text-[11px] font-mono text-slate-400 mt-1">
              ID Polar: <strong className="text-slate-200">{license.polarSubscriptionId}</strong>
            </span>
          </div>
        </div>

        {/* License Grid info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 relative z-10">
          {/* Key */}
          <div className="p-4 bg-[#202429] border border-slate-700/60 rounded-xl space-y-1.5 sm:col-span-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Polar License Key
              </span>
              <span className="text-[10px] bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded font-mono font-semibold border border-blue-700/40">
                Polar API v1 Validated
              </span>
            </div>
            <div className="flex items-center justify-between font-mono text-xs sm:text-sm font-bold text-slate-100 bg-[#15171A] px-3 py-2 rounded-lg border border-slate-800">
              <span className="truncate mr-2">{showKey ? license.licenseKey : maskedKey}</span>
              <div className="flex items-center space-x-1 flex-shrink-0">
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title={showKey ? 'Ocultar clave' : 'Mostrar clave'}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={copyLicense}
                  className="p-1 text-slate-400 hover:text-[#F04438] transition-colors cursor-pointer"
                  title="Copiar clave"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Dispositivo Hardware ID */}
          <div className="p-4 bg-[#202429] border border-slate-700/60 rounded-xl space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Hardware ID Registrado
            </span>
            <div className="flex items-center justify-between font-mono text-xs font-bold text-slate-100 pt-1">
              <div className="flex items-center space-x-1.5">
                <Laptop className="w-4 h-4 text-[#F04438]" />
                <span className="truncate max-w-[120px]">{license.hardwareId}</span>
              </div>
            </div>
            <div className="text-[10px] text-slate-400 pt-0.5">
              Activado en este equipo
            </div>
          </div>

          {/* Activaciones & Puestos */}
          <div className="p-4 bg-[#202429] border border-slate-700/60 rounded-xl space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Puestos de Activación
            </span>
            <div className="flex items-center justify-between pt-1">
              <span className="font-mono text-sm font-bold text-emerald-400">
                {license.activationSeatsUsed} / {license.activationSeatsTotal} puestos
              </span>
            </div>
            <div className="text-[10px] text-slate-400 pt-0.5">
              1 puesto libre para otra laptop/PC
            </div>
          </div>
        </div>

        {/* Renewal & Status row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 relative z-10 pt-1">
          <div className="p-3 bg-[#181B1F] border border-slate-800 rounded-xl flex items-center space-x-3">
            <Calendar className="w-5 h-5 text-[#F04438] flex-shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Próxima Renovación Anual</span>
              <span className="text-xs font-bold text-slate-100 font-mono">{license.validUntil}</span>
            </div>
          </div>

          <div className="p-3 bg-[#181B1F] border border-slate-800 rounded-xl flex items-center space-x-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Protección del Comprador</span>
              <span className="text-xs font-bold text-emerald-300">Garantía Polar.sh MoR</span>
            </div>
          </div>

          <div className="p-3 bg-[#181B1F] border border-slate-800 rounded-xl flex items-center space-x-3">
            <RefreshCw className="w-5 h-5 text-blue-400 flex-shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Última Comprobación</span>
              <span className="text-xs font-bold text-slate-300 truncate block">{license.lastVerifiedAt}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 relative z-10 border-t border-slate-800">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleRefreshStatus}
              disabled={isValidating}
              className="px-4 py-2 bg-[#2B3037] hover:bg-[#343B44] text-slate-200 rounded-lg text-xs font-semibold transition-all flex items-center space-x-2 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isValidating ? 'animate-spin' : ''}`} />
              <span>{isValidating ? 'Verificando con Polar...' : 'Verificar estado con Polar'}</span>
            </button>

            <button
              onClick={handleDeactivateSeat}
              className="px-3.5 py-2 bg-[#2B3037] hover:bg-[#343B44] text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition-all cursor-pointer"
            >
              Liberar este equipo
            </button>

            <a
              href="https://polar.sh/purchases"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 bg-blue-950/70 hover:bg-blue-900 border border-blue-800 text-blue-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all"
            >
              <span>Ver facturas en Polar</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <button
            onClick={() => setActiveView('plan-usage')}
            className="px-5 py-2 bg-[#F04438] hover:bg-[#D92D20] text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-[#F04438]/20 flex items-center space-x-1.5 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Gestionar Plan Anual</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Activate new Polar Key box */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
          <Key className="w-4 h-4 text-[#F04438]" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Activar o Cambiar Clave de Licencia Polar.sh
          </h2>
        </div>

        <p className="text-xs text-slate-600">
          Si adquiriste o renovaste tu suscripción anual en Polar.sh, introduce a continuación tu clave de licencia para validar tu dispositivo y desbloquear todas las capacidades PRO.
        </p>

        <form onSubmit={handleValidateNewKey} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="polar_lk_live_... o clave de activación anual"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-mono font-medium focus:outline-none focus:border-[#F04438] focus:ring-1 focus:ring-[#F04438]"
            />
          </div>

          <button
            type="submit"
            disabled={isValidating || !inputKey.trim()}
            className="px-5 py-2.5 bg-[#F04438] hover:bg-[#D92D20] disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#F04438]/20 flex items-center justify-center space-x-2 cursor-pointer flex-shrink-0"
          >
            {isValidating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            <span>{isValidating ? 'Validando...' : 'Activar Licencia Polar'}</span>
          </button>
        </form>
      </div>

      {/* Annual License Benefits Grid */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-[#F04438]" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Beneficios Incluidos en la Licencia Anual Polar
            </h2>
          </div>
          <span className="text-xs font-bold text-emerald-600">✓ Todo Desbloqueado</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
            <div className="flex items-center space-x-2 font-bold text-slate-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Extracción Ilimitada</span>
            </div>
            <p className="text-slate-600 text-[11px]">
              Sin límites diarios ni topes de búsquedas en los más de 240 países soportados.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
            <div className="flex items-center space-x-2 font-bold text-slate-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Morf AI Studio Integrado</span>
            </div>
            <p className="text-slate-600 text-[11px]">
              Soporte nativo para OpenAI, Google Gemini, CodeMorf y proveedores OpenAI-compatible.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
            <div className="flex items-center space-x-2 font-bold text-slate-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Búsquedas Programadas</span>
            </div>
            <p className="text-slate-600 text-[11px]">
              Automatizaciones periódicas (cada 6h, diarias, semanales) con auto-enriquecimiento.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
            <div className="flex items-center space-x-2 font-bold text-slate-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Verificador de Emails MX</span>
            </div>
            <p className="text-slate-600 text-[11px]">
              Comprobación de registros DNS MX, SMTP handshake y detección de dominios Catch-All.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
            <div className="flex items-center space-x-2 font-bold text-slate-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Proxy Residencial & SOCKS5</span>
            </div>
            <p className="text-slate-600 text-[11px]">
              Compatibilidad total con túneles proxy para evitar bloqueos por geolocalización.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
            <div className="flex items-center space-x-2 font-bold text-slate-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Exportación Multi-Formato</span>
            </div>
            <p className="text-slate-600 text-[11px]">
              Descargas ilimitadas a Excel (.xlsx), CSV UTF-8, JSON Estructurado y Contactos vCard (.vcf).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

