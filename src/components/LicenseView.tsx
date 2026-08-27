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
  Cpu
} from 'lucide-react';
import { ActiveView } from '../types';

interface LicenseViewProps {
  setActiveView: (view: ActiveView) => void;
  addToast: (title: string, message?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const LicenseView: React.FC<LicenseViewProps> = ({ setActiveView, addToast }) => {
  const [showKey, setShowKey] = useState(false);
  const fullKey = 'CM-LEADS-9824-7719-82K1';
  const maskedKey = 'CM-LEADS-••••-••••-82K1';

  const copyLicense = () => {
    navigator.clipboard.writeText(fullKey);
    addToast('Licencia copiada', 'Clave de activación en el portapapeles.', 'success');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 overflow-y-auto pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Licencia de Software</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Información de registro del producto y activación de hardware para Windows.
        </p>
      </div>

      {/* Main License Card */}
      <div className="bg-gradient-to-br from-[#1A1D21] via-[#15171A] to-[#121417] text-white p-8 rounded-2xl border border-slate-800 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Background glow decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#F04438]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                LICENCIA ACTIVA & VALIDADA
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight mt-1 text-white">
              CodeMorf Leads PRO
            </h2>
            <p className="text-xs text-slate-400">
              Edición Profesional para Windows Desktop (Tauri 2 Core)
            </p>
          </div>

          <span className="px-3.5 py-1.5 rounded-xl bg-red-950/80 border border-red-800/50 text-[#F04438] font-bold text-xs uppercase tracking-wider self-start sm:self-auto">
            Plan PRO Lifetime Updates
          </span>
        </div>

        {/* License Grid info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
          {/* Key */}
          <div className="p-4 bg-[#22262B] border border-slate-700/60 rounded-xl space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Clave de Licencia (License Key)
            </span>
            <div className="flex items-center justify-between font-mono text-sm font-bold text-slate-100">
              <span>{showKey ? fullKey : maskedKey}</span>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="p-1 text-slate-400 hover:text-white transition-colors"
                  title={showKey ? 'Ocultar clave' : 'Mostrar clave'}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={copyLicense}
                  className="p-1 text-slate-400 hover:text-[#F04438] transition-colors"
                  title="Copiar clave"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Dispositivo */}
          <div className="p-4 bg-[#22262B] border border-slate-700/60 rounded-xl space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Dispositivo Registrado (Hardware ID)
            </span>
            <div className="flex items-center justify-between font-mono text-sm font-bold text-slate-100">
              <div className="flex items-center space-x-2">
                <Laptop className="w-4 h-4 text-[#F04438]" />
                <span>DESKTOP-JHON</span>
              </div>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                Win 11 x64
              </span>
            </div>
          </div>

          {/* Activaciones */}
          <div className="p-4 bg-[#22262B] border border-slate-700/60 rounded-xl space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Límite de Activaciones
            </span>
            <div className="flex items-center justify-between">
              <span className="font-mono text-base font-bold text-emerald-400">1 / 2 dispositivos</span>
              <span className="text-xs text-slate-400">1 puesto disponible</span>
            </div>
          </div>

          {/* Renovación */}
          <div className="p-4 bg-[#22262B] border border-slate-700/60 rounded-xl space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Próxima Renovación
            </span>
            <div className="flex items-center space-x-2 font-mono text-sm font-bold text-slate-200">
              <Calendar className="w-4 h-4 text-[#F04438]" />
              <span>26 septiembre 2026</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2 relative z-10 border-t border-slate-800">
          <button
            onClick={() => addToast('Verificación de licencia', 'Licencia validada exitosamente con el servidor CodeMorf.', 'success')}
            className="px-4 py-2 bg-[#2B3037] hover:bg-[#343B44] text-slate-200 rounded-lg text-xs font-semibold transition-all flex items-center space-x-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Verificar estado</span>
          </button>

          <button
            onClick={() => addToast('Gestión de dispositivos', 'Puedes desvincular un equipo desde el portal de clientes.', 'info')}
            className="px-4 py-2 bg-[#2B3037] hover:bg-[#343B44] text-slate-200 rounded-lg text-xs font-semibold transition-all"
          >
            Cambiar dispositivo
          </button>

          <button
            onClick={() => setActiveView('plan-usage')}
            className="px-5 py-2 bg-[#F04438] hover:bg-[#D92D20] text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-[#F04438]/20 flex items-center space-x-1.5"
          >
            <span>Mejorar plan</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
