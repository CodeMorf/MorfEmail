import React, { useState, useEffect } from 'react';
import {
  Loader2,
  Pause,
  Play,
  Square,
  Eye,
  CheckCircle2,
  Globe,
  Mail,
  Phone,
  Building,
  Activity,
  Gauge,
  Zap,
  Clock,
  Layers,
  ArrowRight
} from 'lucide-react';
import { SearchConfig, ActiveView } from '../types';
import { MOCK_ACTIVITY_LOGS } from '../data/mockData';

interface SearchProgressViewProps {
  config: SearchConfig;
  setActiveView: (view: ActiveView) => void;
  onSearchComplete: () => void;
  addToast: (title: string, message?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const SearchProgressView: React.FC<SearchProgressViewProps> = ({
  config,
  setActiveView,
  onSearchComplete,
  addToast
}) => {
  const [progress, setProgress] = useState(68);
  const [isPaused, setIsPaused] = useState(false);
  const [sitesAnalyzed, setSitesAnalyzed] = useState(8241);
  const [companiesFound, setCompaniesFound] = useState(4192);
  const [emailsFound, setEmailsFound] = useState(3128);
  const [phonesFound, setPhonesFound] = useState(3672);
  const [speed, setSpeed] = useState(124);
  const [logs, setLogs] = useState(MOCK_ACTIVITY_LOGS);

  // Real-time ticking simulation
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          addToast('Búsqueda completada', 'Se extrajeron 4,192 empresas con éxito.', 'success');
          return 100;
        }
        return prev + 1;
      });

      setSitesAnalyzed((prev) => prev + Math.floor(Math.random() * 8 + 3));
      setCompaniesFound((prev) => prev + (Math.random() > 0.4 ? 1 : 0));
      setEmailsFound((prev) => prev + (Math.random() > 0.5 ? 1 : 0));
      setPhonesFound((prev) => prev + (Math.random() > 0.4 ? 1 : 0));
      setSpeed(Math.floor(120 + Math.random() * 10 - 5));
    }, 1200);

    return () => clearInterval(interval);
  }, [isPaused]);

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
    addToast(isPaused ? 'Motor reanudado' : 'Motor en pausa', undefined, 'info');
  };

  const handleStop = () => {
    addToast('Búsqueda detenida', 'Los datos encontrados se han guardado en Resultados.', 'warning');
    setActiveView('results');
  };

  const handleRunInBackground = () => {
    addToast('Ejecutando en segundo plano', 'Puedes seguir navegando o cerrar la app sin perder progreso.', 'info');
    setActiveView('dashboard');
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 overflow-y-auto pb-12">
      {/* Top Banner */}
      <div className="bg-[#15171A] text-white p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F04438] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#F04438]"></span>
            </span>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#F04438]">
              {isPaused ? 'MOTOR EN PAUSA' : 'EXTRACCIÓN EN VIVO EN PROGRESO'}
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mt-1">
            Buscando clientes...
          </h1>
          <p className="text-sm text-slate-300 flex items-center space-x-1.5 mt-0.5">
            <span>{config.flag}</span>
            <strong className="text-white">{config.businessType}</strong>
            <span>—</span>
            <span>{config.country}</span>
            <span className="text-slate-500">({config.city || 'Nacional'})</span>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={handlePauseResume}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#22262B] hover:bg-[#2B3037] text-slate-200 rounded-lg text-xs font-semibold transition-all border border-slate-700"
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
            <span>{isPaused ? 'Reanudar' : 'Pausar'}</span>
          </button>

          <button
            onClick={handleStop}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#22262B] hover:bg-red-950/60 text-red-300 hover:text-red-200 rounded-lg text-xs font-semibold transition-all border border-red-900/40"
          >
            <Square className="w-3.5 h-3.5 text-[#F04438]" />
            <span>Detener</span>
          </button>

          <button
            onClick={handleRunInBackground}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#22262B] hover:bg-[#2B3037] text-slate-200 rounded-lg text-xs font-semibold transition-all border border-slate-700"
          >
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Segundo plano</span>
          </button>

          <button
            onClick={() => setActiveView('results')}
            className="flex items-center space-x-1.5 px-4 py-2 bg-[#F04438] hover:bg-[#D92D20] text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-[#F04438]/20"
          >
            <span>Ver resultados</span>
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Big Progress Bar Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-[#F04438] animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Progreso de rastreo y parsing
            </span>
          </div>
          <span className="text-2xl font-black font-mono text-[#F04438]">{progress}%</span>
        </div>

        {/* Progress Track */}
        <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
          <div
            className="h-full bg-gradient-to-r from-[#F04438] via-[#FB7185] to-[#F04438] rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <div className="flex justify-between text-xs text-slate-500 font-medium">
          <span>Tiempo transcurrido: 03:42</span>
          <span>Objetivo: {config.quantity.toLocaleString()} leads</span>
          <span>Tiempo restante: ~04:18</span>
        </div>
      </div>

      {/* Real-time Stat Counters & 2 Circular Speedometers */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* 4 Stats */}
        <div className="md:col-span-2 grid grid-cols-2 gap-3">
          {/* Sites Analyzed */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-semibold uppercase text-slate-500 flex items-center justify-between">
              Sitios analizados
              <Globe className="w-3.5 h-3.5 text-blue-500" />
            </span>
            <span className="text-2xl font-extrabold font-mono text-slate-900 mt-2">
              {sitesAnalyzed.toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-600 font-medium">+18 páginas/seg</span>
          </div>

          {/* Companies Found */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-semibold uppercase text-slate-500 flex items-center justify-between">
              Empresas
              <Building className="w-3.5 h-3.5 text-[#F04438]" />
            </span>
            <span className="text-2xl font-extrabold font-mono text-slate-900 mt-2">
              {companiesFound.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400">100% únicas</span>
          </div>

          {/* Emails Found */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-semibold uppercase text-slate-500 flex items-center justify-between">
              Emails
              <Mail className="w-3.5 h-3.5 text-emerald-500" />
            </span>
            <span className="text-2xl font-extrabold font-mono text-slate-900 mt-2">
              {emailsFound.toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-600 font-medium">74.6% tasa</span>
          </div>

          {/* Phones Found */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-semibold uppercase text-slate-500 flex items-center justify-between">
              Teléfonos
              <Phone className="w-3.5 h-3.5 text-amber-500" />
            </span>
            <span className="text-2xl font-extrabold font-mono text-slate-900 mt-2">
              {phonesFound.toLocaleString()}
            </span>
            <span className="text-[10px] text-amber-600 font-medium">87.5% tasa</span>
          </div>
        </div>

        {/* Circular Gauge 1: Velocidad */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-between text-center">
          <div className="flex items-center space-x-1.5 text-slate-500 text-xs font-semibold uppercase">
            <Gauge className="w-3.5 h-3.5 text-[#F04438]" />
            <span>Velocidad</span>
          </div>

          {/* Circular SVG Gauge */}
          <div className="relative w-24 h-24 my-2 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
              <path
                className="text-slate-100"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-[#F04438]"
                strokeDasharray="78, 100"
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-xl font-black font-mono text-slate-900">{speed}</span>
              <span className="text-[9px] text-slate-400 font-medium">pág/min</span>
            </div>
          </div>

          <span className="text-[10px] text-slate-400 font-medium">16 hilos concurrentes</span>
        </div>

        {/* Circular Gauge 2: Leads extraídos */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-between text-center">
          <div className="flex items-center space-x-1.5 text-slate-500 text-xs font-semibold uppercase">
            <Zap className="w-3.5 h-3.5 text-emerald-500" />
            <span>Leads</span>
          </div>

          <div className="relative w-24 h-24 my-2 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
              <path
                className="text-slate-100"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-emerald-500"
                strokeDasharray="68, 100"
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-lg font-black font-mono text-slate-900">{companiesFound}</span>
              <span className="text-[9px] text-emerald-600 font-bold">Extraídos</span>
            </div>
          </div>

          <span className="text-[10px] text-slate-400 font-medium">93.2% verif. MX</span>
        </div>
      </div>

      {/* Terminal / Live Activity Stream */}
      <div className="bg-[#121417] rounded-xl border border-slate-800 shadow-lg overflow-hidden">
        <div className="p-3 bg-[#1A1D21] border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center space-x-2 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-bold text-slate-200">Actividad en tiempo real</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">Stream TLS 1.3 / HTTP2</span>
        </div>

        <div className="p-4 font-mono text-xs text-slate-300 space-y-2 max-h-56 overflow-y-auto">
          {logs.map((log, index) => (
            <div
              key={index}
              className={`flex items-start justify-between py-1 border-b border-slate-800/40 ${
                log.text.startsWith('→') ? 'text-amber-300 animate-pulse' : 'text-slate-300'
              }`}
            >
              <div className="flex items-center space-x-2 truncate">
                {log.text.startsWith('✓') ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                ) : (
                  <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin flex-shrink-0" />
                )}
                <span className="truncate">{log.text}</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono flex-shrink-0 ml-2">
                {log.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
