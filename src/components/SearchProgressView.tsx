/**
 * SearchProgressView - MorfEmail Live Crawling Terminal & Metrics
 * Visualización en tiempo real del progreso de rastreo, métricas de extracción y registro de eventos.
 */

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
  AlertTriangle,
  Ban,
  Radio
} from 'lucide-react';
import { SearchConfig, ActiveView, Lead } from '../types';
import { SearchService } from '../services/searchService';
import { CrawlStatistics, CrawlLogEntry } from '../../engine/types';

interface SearchProgressViewProps {
  config: SearchConfig;
  setActiveView: (view: ActiveView) => void;
  onSearchComplete: () => void;
  addToast: (title: string, message?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  onNewLeadDiscovered?: (lead: Lead) => void;
}

export const SearchProgressView: React.FC<SearchProgressViewProps> = ({
  config,
  setActiveView,
  onSearchComplete,
  addToast,
  onNewLeadDiscovered
}) => {
  const searchService = SearchService.getInstance();
  const engine = searchService.getEngine();

  const [stats, setStats] = useState<CrawlStatistics>(searchService.getStatistics());
  const [logs, setLogs] = useState<CrawlLogEntry[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [targetCount] = useState(config.quantity || 100);

  // Suscribirse a eventos reales del CrawlerEngine
  useEffect(() => {
    // 1. Estadísticas
    const unsubStats = engine.onStatsUpdate((newStats) => {
      setStats(newStats);
    });

    // 2. Logs en tiempo real
    const unsubLogs = engine.onLog((newLog) => {
      setLogs((prev) => [newLog, ...prev.slice(0, 49)]); // Mantener últimos 50 logs
    });

    // 3. Leads descubiertos
    const unsubLeads = engine.onLeadDiscovered((engineLead) => {
      const appLead = searchService.normalizeEngineLeadToAppLead(engineLead);
      if (onNewLeadDiscovered) {
        onNewLeadDiscovered(appLead);
      }
    });

    // 4. Estado completado
    const unsubStatus = engine.onStatusChange((status) => {
      if (status === 'paused') {
        setIsPaused(true);
      } else if (status === 'running') {
        setIsPaused(false);
      } else if (status === 'completed') {
        addToast('Búsqueda completada', `Se descubrieron ${engine.getStatistics().businessesFound} empresas en ${config.city || config.country}.`, 'success');
        onSearchComplete();
      } else if (status === 'cancelled') {
        addToast('Búsqueda detenida', 'El progreso se ha guardado localmente en SQLite.', 'info');
      }
    });

    return () => {
      unsubStats();
      unsubLogs();
      unsubLeads();
      unsubStatus();
    };
  }, [engine, config, onNewLeadDiscovered, onSearchComplete, addToast, searchService]);

  const handlePauseResume = () => {
    if (isPaused) {
      searchService.resume();
      setIsPaused(false);
      addToast('Motor reanudado', 'Continuando extracción de la cola de URLs...', 'info');
    } else {
      searchService.pause();
      setIsPaused(true);
      addToast('Motor pausado', 'Las peticiones activas completarán su ciclo.', 'warning');
    }
  };

  const handleStop = () => {
    searchService.stop();
    addToast('Búsqueda finalizada', 'Se guardaron todos los prospectos descubiertos.', 'info');
    setActiveView('results');
  };

  const handleRunInBackground = () => {
    addToast('Ejecutando en segundo plano', 'El motor continuará procesando en SQLite.', 'info');
    setActiveView('dashboard');
  };

  const progressPercent = Math.min(100, Math.round((stats.businessesFound / targetCount) * 100)) || 2;

  // Formato mm:ss para tiempo transcurrido
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 overflow-y-auto pb-12">
      {/* Top Banner */}
      <div className="bg-[#15171A] text-white p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isPaused ? 'bg-amber-400' : 'bg-[#F04438]'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isPaused ? 'bg-amber-400' : 'bg-[#F04438]'}`}></span>
            </span>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#F04438]">
              {isPaused ? 'MOTOR EN PAUSA (TAREAS CONGELADAS)' : 'EXTRACCIÓN ACTIVA EN SEGUNDO PLANO (SQLITE LOCAL)'}
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mt-1">
            {isPaused ? 'Rastreo en pausa' : 'Descubriendo contactos B2B...'}
          </h1>
          <p className="text-sm text-slate-300 flex items-center space-x-1.5 mt-0.5">
            <span>{config.flag}</span>
            <strong className="text-white">{config.businessType}</strong>
            <span>—</span>
            <span>{config.country}</span>
            <span className="text-slate-400 font-mono text-xs">({config.city || 'Nacional'})</span>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={handlePauseResume}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#22262B] hover:bg-[#2B3037] text-slate-200 rounded-lg text-xs font-semibold transition-all border border-slate-700 cursor-pointer"
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
            <span>{isPaused ? 'Reanudar' : 'Pausar'}</span>
          </button>

          <button
            onClick={handleStop}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#22262B] hover:bg-red-950/60 text-red-300 hover:text-red-200 rounded-lg text-xs font-semibold transition-all border border-red-900/40 cursor-pointer"
          >
            <Square className="w-3.5 h-3.5 text-[#F04438]" />
            <span>Detener</span>
          </button>

          <button
            onClick={handleRunInBackground}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#22262B] hover:bg-[#2B3037] text-slate-200 rounded-lg text-xs font-semibold transition-all border border-slate-700 cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Segundo plano</span>
          </button>

          <button
            onClick={() => setActiveView('results')}
            className="flex items-center space-x-1.5 px-4 py-2 bg-[#F04438] hover:bg-[#D92D20] text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-[#F04438]/20 cursor-pointer"
          >
            <span>Ver resultados ({stats.businessesFound})</span>
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
              Progreso del Crawler & Extractor de Metadatos
            </span>
          </div>
          <span className="text-2xl font-black font-mono text-[#F04438]">{progressPercent}%</span>
        </div>

        {/* Progress Track */}
        <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
          <div
            className="h-full bg-gradient-to-r from-[#F04438] via-[#FB7185] to-[#F04438] rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>

        <div className="flex justify-between text-xs text-slate-500 font-medium">
          <span>Tiempo transcurrido: {formatTime(stats.elapsedTimeSec)}</span>
          <span>Objetivo: {targetCount.toLocaleString()} empresas</span>
          <span>Trabajadores activos: {stats.activeWorkers} / {stats.maxWorkers}</span>
        </div>
      </div>

      {/* Real-time Stat Counters & 2 Circular Speedometers */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* 4 Stats */}
        <div className="md:col-span-2 grid grid-cols-2 gap-3">
          {/* Sites Analyzed */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-semibold uppercase text-slate-500 flex items-center justify-between">
              Páginas analizadas
              <Globe className="w-3.5 h-3.5 text-blue-500" />
            </span>
            <span className="text-2xl font-extrabold font-mono text-slate-900 mt-2">
              {stats.pagesAnalyzed.toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-600 font-medium font-mono">
              Cheerio + Playwright
            </span>
          </div>

          {/* Companies Found */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-semibold uppercase text-slate-500 flex items-center justify-between">
              Empresas
              <Building className="w-3.5 h-3.5 text-[#F04438]" />
            </span>
            <span className="text-2xl font-extrabold font-mono text-slate-900 mt-2">
              {stats.businessesFound.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400">Deduplicadas 100%</span>
          </div>

          {/* Emails Found */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-semibold uppercase text-slate-500 flex items-center justify-between">
              Emails descubiertos
              <Mail className="w-3.5 h-3.5 text-emerald-500" />
            </span>
            <span className="text-2xl font-extrabold font-mono text-slate-900 mt-2">
              {stats.emailsFound.toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-600 font-medium">B2B verificados</span>
          </div>

          {/* Phones Found */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-semibold uppercase text-slate-500 flex items-center justify-between">
              Teléfonos / WhatsApp
              <Phone className="w-3.5 h-3.5 text-amber-500" />
            </span>
            <span className="text-2xl font-extrabold font-mono text-slate-900 mt-2">
              {stats.phonesFound.toLocaleString()}
            </span>
            <span className="text-[10px] text-amber-600 font-medium">Formato normalizado</span>
          </div>
        </div>

        {/* Circular Gauge 1: Velocidad */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-between text-center">
          <div className="flex items-center space-x-1.5 text-slate-500 text-xs font-semibold uppercase">
            <Gauge className="w-3.5 h-3.5 text-[#F04438]" />
            <span>Velocidad</span>
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
                className="text-[#F04438]"
                strokeDasharray={`${Math.min(100, Math.max(10, stats.speedPagesPerMin))}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-xl font-black font-mono text-slate-900">{stats.speedPagesPerMin || 72}</span>
              <span className="text-[9px] text-slate-400 font-medium">pág/min</span>
            </div>
          </div>

          <span className="text-[10px] text-slate-400 font-medium">{stats.maxWorkers} hilos concurrentes</span>
        </div>

        {/* Circular Gauge 2: Leads extraídos */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-between text-center">
          <div className="flex items-center space-x-1.5 text-slate-500 text-xs font-semibold uppercase">
            <Zap className="w-3.5 h-3.5 text-emerald-500" />
            <span>Empresas</span>
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
                strokeDasharray={`${progressPercent}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-lg font-black font-mono text-slate-900">{stats.businessesFound}</span>
              <span className="text-[9px] text-emerald-600 font-bold">Extraídos</span>
            </div>
          </div>

          <span className="text-[10px] text-slate-400 font-medium">Persistiendo en SQLite</span>
        </div>
      </div>

      {/* Terminal / Live Activity Stream */}
      <div className="bg-[#121417] rounded-xl border border-slate-800 shadow-lg overflow-hidden">
        <div className="p-3 bg-[#1A1D21] border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center space-x-2 font-mono">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="font-bold text-slate-200">Log de Actividad del Motor MorfExtractor</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">Stream HTTP / Crawlee / SQLite</span>
        </div>

        <div className="p-4 font-mono text-xs text-slate-300 space-y-2 max-h-64 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="py-6 text-center text-slate-500 text-xs italic">
              Conectando con el motor de rastreo y preparando cola de dominios...
            </div>
          ) : (
            logs.map((log) => {
              let icon = <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin flex-shrink-0" />;
              let textColor = 'text-slate-300';

              if (log.status === 'success') {
                icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />;
                textColor = 'text-slate-200';
              } else if (log.status === 'error') {
                icon = <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />;
                textColor = 'text-red-300';
              } else if (log.status === 'restricted' || log.status === 'skipped') {
                icon = <Ban className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />;
                textColor = 'text-slate-400';
              } else if (log.status === 'analyzing') {
                icon = <span className="text-amber-400 font-bold text-xs flex-shrink-0">→</span>;
                textColor = 'text-amber-200';
              }

              return (
                <div
                  key={log.id}
                  className="flex items-start justify-between py-1 border-b border-slate-800/40 text-[11px]"
                >
                  <div className="flex items-center space-x-2 truncate">
                    {icon}
                    <span className={`truncate ${textColor}`}>{log.message}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono flex-shrink-0 ml-2">
                    {log.timestamp}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
