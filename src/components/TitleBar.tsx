import React, { useState } from 'react';
import { 
  Sparkles, 
  Bell, 
  HelpCircle, 
  Minus, 
  Square, 
  X, 
  Cpu, 
  CheckCircle2, 
  Bot,
  ExternalLink,
  Keyboard,
  ShieldCheck
} from 'lucide-react';
import { ActiveView } from '../types';

interface TitleBarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  engineStatus: 'ready' | 'scanning' | 'paused' | 'idle';
  onShowOnboarding: () => void;
  addToast: (title: string, message?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  setActiveView,
  engineStatus,
  onShowOnboarding,
  addToast
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const handleWindowAction = (action: 'minimize' | 'maximize' | 'close') => {
    if (action === 'minimize') {
      addToast('Ventana minimizada', 'La aplicación continúa ejecutándose en la barra de tareas de Windows.', 'info');
    } else if (action === 'maximize') {
      setIsMaximized(!isMaximized);
      addToast(isMaximized ? 'Ventana restaurada' : 'Ventana maximizada', undefined, 'info');
    } else if (action === 'close') {
      addToast('CodeMorf Leads', 'Minimizado al área de notificación para no interrumpir búsquedas en segundo plano.', 'info');
    }
  };

  return (
    <header className="h-10 bg-[#121417] text-slate-200 flex items-center justify-between px-3 border-b border-[#22262B] select-none text-xs z-40 relative">
      {/* Left: Brand Identity */}
      <div className="flex items-center space-x-2.5">
        <div className="flex items-center space-x-1.5 cursor-pointer" onClick={() => setActiveView('dashboard')}>
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#F04438] to-[#D92D20] flex items-center justify-center shadow-sm shadow-[#F04438]/30">
            <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <path d="M11 8v6M8 11h6" />
            </svg>
          </div>
          <div className="flex items-center space-x-1">
            <span className="font-semibold text-slate-100 tracking-wide text-sm">CodeMorf</span>
            <span className="font-bold text-[#F04438] text-sm">Leads</span>
          </div>
        </div>
        
        <span className="text-slate-600">|</span>
        <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">v2.4.0 Desktop Pro</span>
      </div>

      {/* Center: Engine Status */}
      <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-[#1A1D21] border border-[#2B3037]">
        {engineStatus === 'scanning' ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span className="text-amber-400 font-medium text-[11px] tracking-tight">Motor escaneando</span>
          </>
        ) : engineStatus === 'paused' ? (
          <>
            <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
            <span className="text-yellow-400 font-medium text-[11px]">Motor en pausa</span>
          </>
        ) : (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#12B76A]"></span>
            </span>
            <span className="text-slate-300 font-medium text-[11px]">Motor listo</span>
          </>
        )}
        <span className="text-slate-600 text-[10px]">•</span>
        <span className="text-[10px] text-slate-400 font-mono hidden md:inline">16 Hilos</span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-1">
        {/* Morf AI Quick Button */}
        <button
          onClick={() => setActiveView('morf-ai')}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-gradient-to-r from-red-950/40 to-slate-800 hover:from-red-900/60 hover:to-slate-700 text-red-200 border border-red-500/30 text-[11px] font-medium transition-all mr-1 shadow-sm"
          title="Asistente Morf AI para optimizar prospección"
        >
          <Bot className="w-3.5 h-3.5 text-[#F04438] animate-pulse" />
          <span className="hidden lg:inline">Morf AI</span>
          <span className="text-[9px] bg-[#F04438] text-white px-1 rounded-sm font-bold">IA</span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowHelp(false);
            }}
            className={`p-1.5 rounded hover:bg-[#22262B] text-slate-400 hover:text-slate-200 transition-colors relative ${showNotifications ? 'bg-[#22262B] text-slate-100' : ''}`}
            title="Notificaciones"
          >
            <Bell className="w-3.5 h-3.5" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#F04438] rounded-full"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-[#1A1D21] border border-[#2B3037] rounded-lg shadow-2xl p-3 z-50 text-slate-200 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#2B3037] mb-2 font-semibold">
                <span>Notificaciones</span>
                <span className="text-[10px] text-[#F04438] bg-red-950/40 px-1.5 py-0.5 rounded border border-red-800/30">2 nuevas</span>
              </div>
              <div className="space-y-2">
                <div className="p-2 rounded bg-[#22262B] border border-slate-700/50">
                  <div className="font-medium text-slate-100 flex items-center justify-between">
                    <span>Búsqueda completada</span>
                    <span className="text-[10px] text-slate-400">Hace 15m</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">2,341 leads extraídos para "Restaurantes Santo Domingo".</p>
                </div>
                <div className="p-2 rounded bg-[#22262B] border border-slate-700/50">
                  <div className="font-medium text-slate-100 flex items-center justify-between">
                    <span>Verificación de emails</span>
                    <span className="text-[10px] text-slate-400">Hace 1h</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">93.2% de emails validados con registros MX.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Help */}
        <div className="relative">
          <button 
            onClick={() => {
              setShowHelp(!showHelp);
              setShowNotifications(false);
            }}
            className={`p-1.5 rounded hover:bg-[#22262B] text-slate-400 hover:text-slate-200 transition-colors ${showHelp ? 'bg-[#22262B] text-slate-100' : ''}`}
            title="Ayuda y atajos"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>

          {showHelp && (
            <div className="absolute right-0 mt-2 w-80 bg-[#1A1D21] border border-[#2B3037] rounded-lg shadow-2xl p-3 z-50 text-slate-200 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#2B3037] mb-2 font-semibold">
                <div className="flex items-center space-x-1.5">
                  <Keyboard className="w-3.5 h-3.5 text-[#F04438]" />
                  <span>Guía & Atajos de Teclado</span>
                </div>
              </div>
              <div className="space-y-1.5 text-[11px] text-slate-300">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span>Nueva búsqueda</span>
                  <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-slate-400">Ctrl + N</kbd>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span>Exportar leads</span>
                  <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-slate-400">Ctrl + E</kbd>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span>Asistente Morf AI</span>
                  <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-slate-400">Ctrl + Space</kbd>
                </div>
                <div className="flex justify-between py-1">
                  <span>Verificar seleccionados</span>
                  <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-slate-400">Ctrl + V</kbd>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-[#2B3037] flex items-center justify-between">
                <button
                  onClick={() => {
                    setShowHelp(false);
                    onShowOnboarding();
                  }}
                  className="text-[11px] text-[#F04438] hover:underline flex items-center space-x-1 font-medium"
                >
                  <Sparkles className="w-3 h-3 mr-1" /> Ver Onboarding inicial
                </button>
                <a
                  href="https://codemorf.tech/chat/docs/es/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center space-x-1"
                >
                  <span>Morf AI Docs</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* User / Plan Info */}
        <div 
          onClick={() => setActiveView('license')}
          className="flex items-center space-x-2 px-2 py-1 rounded hover:bg-[#22262B] cursor-pointer transition-colors"
          title="Ver Licencia y Plan"
        >
          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-slate-600 to-slate-400 text-white flex items-center justify-center font-bold text-[10px]">
            J
          </div>
          <span className="font-medium text-slate-200 text-[11px] hidden md:inline">Jhon D.</span>
          <span className="px-1.5 py-0.2 text-[9px] font-bold bg-[#F04438] text-white rounded tracking-wider">
            PRO
          </span>
        </div>

        {/* Windows Window Controls */}
        <div className="flex items-center ml-2 border-l border-[#2B3037] pl-1">
          <button
            onClick={() => handleWindowAction('minimize')}
            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#22262B] transition-colors rounded-sm"
            title="Minimizar"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleWindowAction('maximize')}
            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#22262B] transition-colors rounded-sm"
            title={isMaximized ? "Restaurar" : "Maximizar"}
          >
            <Square className="w-3 h-3" />
          </button>
          <button
            onClick={() => handleWindowAction('close')}
            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#E81123] transition-colors rounded-sm"
            title="Cerrar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
