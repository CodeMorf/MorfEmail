import React, { useEffect, useState } from 'react';
import { 
  Sparkles, 
  Bell, 
  HelpCircle, 
  Minus, 
  Maximize2,
  Minimize2,
  Expand,
  Shrink,
  X, 
  Bot,
  ExternalLink,
  Keyboard
} from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { ActiveView, AppNotification, PolarBillingState } from '../types';
import morfEmailMark from '../assets/branding/morfemail-mark.png';
import type { CentralLicenseValidation } from '../services/billingService';

interface TitleBarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  engineStatus: 'ready' | 'scanning' | 'paused' | 'idle';
  billingState: PolarBillingState | null;
  centralLicense: CentralLicenseValidation | null;
  notifications: AppNotification[];
  onClearNotifications: () => void;
  onShowOnboarding: () => void;
  addToast: (title: string, message?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  setActiveView,
  engineStatus,
  billingState,
  centralLicense,
  notifications,
  onClearNotifications,
  onShowOnboarding,
  addToast
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isNativeWindow, setIsNativeWindow] = useState(false);

  useEffect(() => {
    const nativeWindow = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
    setIsNativeWindow(nativeWindow);

    if (!nativeWindow) return;

    const syncWindowState = async () => {
      const currentWindow = getCurrentWindow();
      const [maximized, fullscreen] = await Promise.all([
        currentWindow.isMaximized(),
        currentWindow.isFullscreen()
      ]);
      setIsMaximized(maximized);
      setIsFullscreen(fullscreen);
    };

    void syncWindowState().catch(() => {
      // The controls remain available even if the initial state cannot be read.
    });
  }, []);

  const syncWindowState = async () => {
    const currentWindow = getCurrentWindow();
    const [maximized, fullscreen] = await Promise.all([
      currentWindow.isMaximized(),
      currentWindow.isFullscreen()
    ]);
    setIsMaximized(maximized);
    setIsFullscreen(fullscreen);
  };

  const handleWindowAction = async (action: 'minimize' | 'maximize' | 'fullscreen' | 'close') => {
    try {
      if (action === 'fullscreen') {
        if (isNativeWindow) {
          const currentWindow = getCurrentWindow();
          await currentWindow.setFullscreen(!isFullscreen);
          await syncWindowState();
        } else if (document.fullscreenElement) {
          await document.exitFullscreen();
          setIsFullscreen(false);
        } else {
          await document.documentElement.requestFullscreen();
          setIsFullscreen(true);
        }
        return;
      }

      if (!isNativeWindow) return;

      const currentWindow = getCurrentWindow();
      if (action === 'minimize') {
        await currentWindow.minimize();
      } else if (action === 'maximize') {
        await currentWindow.toggleMaximize();
        await syncWindowState();
      } else {
        await currentWindow.close();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo cambiar el estado de la ventana.';
      addToast('Control de ventana no disponible', message, 'error');
    }
  };

  const handleTitleBarMouseDown = (event: React.MouseEvent<HTMLElement>) => {
    if (!isNativeWindow || event.button !== 0) return;

    const target = event.target as HTMLElement;
    if (target.closest('button, a, input, select, textarea')) return;

    void getCurrentWindow().startDragging().catch((error) => {
      const message = error instanceof Error ? error.message : 'No se pudo mover la ventana.';
      addToast('Ventana no disponible', message, 'error');
    });
  };

  const handleTitleBarDoubleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (!isNativeWindow || event.button !== 0) return;

    const target = event.target as HTMLElement;
    if (target.closest('button, a, input, select, textarea')) return;

    void handleWindowAction('maximize');
  };

  return (
    <header
      className="h-10 bg-[#121417] text-slate-200 flex items-center justify-between px-3 border-b border-[#22262B] select-none text-xs z-40 relative"
      onMouseDown={handleTitleBarMouseDown}
      onDoubleClick={handleTitleBarDoubleClick}
    >
      {/* Left: Brand Identity */}
      <div className="flex items-center space-x-2.5">
        <div className="flex items-center space-x-1.5 cursor-pointer" onClick={() => setActiveView('dashboard')}>
          <img src={morfEmailMark} alt="" aria-hidden="true" className="h-6 w-6 rounded-md object-cover shadow-sm shadow-[#F04438]/30" />
          <div className="flex items-center space-x-1">
            <span className="font-semibold text-slate-100 tracking-wide text-sm">Morf</span>
            <span className="font-bold text-[#F04438] text-sm">Email</span>
          </div>
        </div>
        
        <span className="text-slate-600">|</span>
        <span className="text-[11px] text-slate-400 hidden sm:inline">Aplicación de escritorio</span>
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
            {notifications.length > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-3.5 h-3.5 px-0.5 rounded-full bg-[#F04438] text-white text-[8px] font-bold leading-3.5 text-center">{Math.min(notifications.length, 9)}</span>}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-[#1A1D21] border border-[#2B3037] rounded-lg shadow-2xl p-3 z-50 text-slate-200 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#2B3037] mb-2"><div className="font-semibold">Notificaciones</div>{notifications.length > 0 && <button onClick={onClearNotifications} className="text-[10px] text-slate-400 hover:text-white">Limpiar</button>}</div>
              {notifications.length === 0 ? <p className="text-[11px] text-slate-400">No hay notificaciones recientes.</p> : <div className="space-y-2">{notifications.slice(0, 5).map((notification) => <div key={notification.id} className="rounded-md bg-[#22262B] p-2"><div className="text-[11px] font-semibold text-slate-100">{notification.title}</div><p className="mt-0.5 text-[10px] leading-snug text-slate-400">{notification.message}</p><div className="mt-1 text-[9px] text-slate-500">{notification.createdAt}</div></div>)}</div>}
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
          <span className="font-medium text-slate-200 text-[11px] hidden md:inline">Cuenta local</span>
          <span className="px-1.5 py-0.2 text-[9px] font-bold bg-[#22262B] text-slate-300 rounded tracking-wider">
            {centralLicense?.valid ? (centralLicense.serviceName || centralLicense.plan || 'MorfEmail') : billingState?.planName || (billingState ? 'SIN PLAN' : 'CARGANDO')}
          </span>
        </div>

        {/* Controles nativos: solo se muestran dentro del instalador Tauri. */}
        {isNativeWindow && (
          <div className="flex items-center ml-2 border-l border-[#2B3037] pl-1">
            <button
              onClick={() => void handleWindowAction('minimize')}
              className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#22262B] transition-colors rounded-sm"
              title="Minimizar"
              aria-label="Minimizar ventana"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => void handleWindowAction('maximize')}
              className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#22262B] transition-colors rounded-sm"
              title={isMaximized ? 'Restaurar ventana' : 'Maximizar ventana'}
              aria-label={isMaximized ? 'Restaurar ventana' : 'Maximizar ventana'}
            >
              {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => void handleWindowAction('fullscreen')}
              className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#22262B] transition-colors rounded-sm"
              title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
              aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            >
              {isFullscreen ? <Shrink className="w-3.5 h-3.5" /> : <Expand className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => void handleWindowAction('close')}
              className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#E81123] transition-colors rounded-sm"
              title="Cerrar aplicación"
              aria-label="Cerrar aplicación"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
