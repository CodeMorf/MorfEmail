import React from 'react';
import {
  Users,
  Mail,
  Phone,
  CheckCircle,
  Search,
  ArrowUpRight,
  TrendingUp,
  RotateCcw,
  Download,
  Eye,
  Sparkles,
  Bot,
  ExternalLink,
  ChevronRight,
  Calendar
} from 'lucide-react';
import { ActiveView, SearchHistoryItem, ScheduledSearch, LeadList } from '../types';
import { ScheduledSearchesSection } from './ScheduledSearchesSection';

interface DashboardViewProps {
  setActiveView: (view: ActiveView) => void;
  history: SearchHistoryItem[];
  scheduledSearches: ScheduledSearch[];
  lists: LeadList[];
  onRepeatSearch: (item: SearchHistoryItem) => void;
  onOpenResultsFor: (item: SearchHistoryItem) => void;
  openExportModal: () => void;
  onSaveScheduledSearch: (data: any) => void;
  onToggleScheduledStatus: (id: string) => void;
  onDeleteScheduledSearch: (id: string) => void;
  onRunScheduledSearchNow: (id: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  setActiveView,
  history,
  scheduledSearches,
  lists,
  onRepeatSearch,
  onOpenResultsFor,
  openExportModal,
  onSaveScheduledSearch,
  onToggleScheduledStatus,
  onDeleteScheduledSearch,
  onRunScheduledSearchNow
}) => {
  const chartDays = [
    { day: 'Jue 20', count: 1820, height: '48%', label: '1,820' },
    { day: 'Vie 21', count: 2450, height: '65%', label: '2,450' },
    { day: 'Sáb 22', count: 980, height: '26%', label: '980' },
    { day: 'Dom 23', count: 640, height: '18%', label: '640' },
    { day: 'Lun 24', count: 3120, height: '82%', label: '3,120' },
    { day: 'Mar 25', count: 2890, height: '76%', label: '2,890' },
    { day: 'Mié 26', count: 3820, height: '100%', label: '3,820' }
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto">
      {/* Top Welcome Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Panel de Control</span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-emerald-600 font-medium flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1"></span> Base de datos sincronizada
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">Buenos días</h1>
          <p className="text-sm text-slate-600">Encuentra nuevos clientes potenciales y extrae contactos empresariales públicos en segundos.</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveView('morf-ai')}
            className="flex items-center space-x-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all border border-slate-300 cursor-pointer"
          >
            <Bot className="w-4 h-4 text-[#F04438]" />
            <span>Asistente Morf AI</span>
          </button>
          
          <button
            onClick={() => setActiveView('new-search')}
            className="flex items-center space-x-2 px-5 py-2.5 bg-[#F04438] hover:bg-[#D92D20] text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-[#F04438]/20 hover:shadow-lg hover:shadow-[#F04438]/30 cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>+ Nueva búsqueda</span>
          </button>
        </div>
      </div>

      {/* 4 Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Leads Encontrados */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Leads encontrados</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-[#F04438] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">18,420</div>
            <div className="flex items-center space-x-1 text-xs text-emerald-600 font-medium mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+1,284 esta semana</span>
            </div>
          </div>
        </div>

        {/* Emails */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Emails</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">13,845</div>
            <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
              <span className="font-medium text-blue-600">75.1% encontrados</span>
              <span className="text-[11px] text-slate-400">Directos</span>
            </div>
          </div>
        </div>

        {/* Teléfonos */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Teléfonos</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Phone className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">15,291</div>
            <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
              <span className="font-medium text-amber-600">83.0% encontrados</span>
              <span className="text-[11px] text-slate-400">WhatsApp inc.</span>
            </div>
          </div>
        </div>

        {/* Verificados */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Verificados</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">12,903</div>
            <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
              <span className="font-medium text-emerald-600">93.2% válidos</span>
              <span className="text-[11px] text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded font-semibold">MX OK</span>
            </div>
          </div>
        </div>
      </div>

      {/* SCHEDULED SEARCHES & AUTO-REFRESH SECTION */}
      <ScheduledSearchesSection
        scheduledSearches={scheduledSearches}
        lists={lists}
        onSaveScheduledSearch={onSaveScheduledSearch}
        onToggleScheduledStatus={onToggleScheduledStatus}
        onDeleteScheduledSearch={onDeleteScheduledSearch}
        onRunScheduledSearchNow={onRunScheduledSearchNow}
        onOpenList={(listId) => setActiveView('lists')}
      />

      {/* Grid: 7-Day Chart & Morf AI Insight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual Chart: Leads últimos 7 días */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Leads encontrados — últimos 7 días</h2>
              <p className="text-xs text-slate-500">Volumen de extracción diaria y rendimiento del motor</p>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="px-2.5 py-1 rounded bg-slate-100 font-medium text-slate-600">Total: 15,720 leads</span>
            </div>
          </div>

          {/* Interactive Bar Chart Visual */}
          <div className="h-48 pt-6 pb-2 flex items-end justify-between gap-3 px-2 border-b border-slate-100">
            {chartDays.map((col, idx) => (
              <div key={col.day} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded shadow-sm">
                  {col.label}
                </div>
                <div
                  className={`w-full rounded-t-md transition-all duration-500 group-hover:brightness-95 ${
                    idx === chartDays.length - 1
                      ? 'bg-gradient-to-t from-[#F04438] to-[#FC8181]'
                      : 'bg-slate-200 group-hover:bg-slate-300'
                  }`}
                  style={{ height: col.height }}
                ></div>
                <span className="text-[11px] text-slate-500 font-medium text-center">
                  {col.day}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-3">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#F04438]"></span>
                <span>Día actual (Pico de extracción)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-200"></span>
                <span>Días anteriores</span>
              </div>
            </div>
            <span className="text-slate-400 font-mono text-[11px]">Promedio: 2,245 leads/día</span>
          </div>
        </div>

        {/* Morf AI Copilot Recommendation Card */}
        <div className="bg-gradient-to-br from-[#1A1D21] to-[#121417] text-white p-5 rounded-xl border border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-[#F04438]/20 border border-[#F04438]/40 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-[#F04438]" />
                </div>
                <div>
                  <span className="text-xs font-bold tracking-wide text-slate-200">Morf AI Assistant</span>
                  <p className="text-[10px] text-slate-400">By CodeMorf Technologies</p>
                </div>
              </div>
              <span className="text-[9px] bg-[#F04438] text-white px-1.5 py-0.5 rounded font-bold uppercase">Copilot</span>
            </div>

            <div className="p-3 bg-[#22262B] rounded-lg border border-slate-700 text-xs space-y-2">
              <p className="text-slate-200 leading-relaxed">
                💡 <strong className="text-white">Oportunidad detectada:</strong> El sector <span className="text-amber-300">Restaurantes en República Dominicana</span> tiene una tasa de verificación del 94.2% con WhatsApp activo en el 82% de los leads.
              </p>
              <p className="text-slate-400 text-[11px]">
                ¿Deseas generar una campaña de cold outreach o una consulta optimizada para ese nicho?
              </p>
            </div>
          </div>

          <div className="pt-4 space-y-2">
            <button
              onClick={() => setActiveView('morf-ai')}
              className="w-full flex items-center justify-center space-x-1.5 py-2 bg-[#F04438] hover:bg-[#D92D20] text-white rounded-lg text-xs font-semibold transition-all shadow-sm cursor-pointer"
            >
              <span>Abrir Morf AI Studio</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <a
              href="https://codemorf.tech/chat/docs/es/"
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center space-x-1 text-[11px] text-slate-400 hover:text-slate-200 py-1"
            >
              <span>Ver documentación oficial</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Panel: Últimas búsquedas */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Últimas búsquedas</h2>
            <p className="text-xs text-slate-500">Historial reciente de extracciones realizadas</p>
          </div>

          <button
            onClick={() => setActiveView('history')}
            className="text-xs font-semibold text-[#F04438] hover:underline flex items-center space-x-1 cursor-pointer"
          >
            <span>Ver todo el historial</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Búsqueda</th>
                <th className="py-3 px-4">País</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4 text-right">Leads</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {history.slice(0, 4).map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-900 flex items-center space-x-2">
                    <Search className="w-3.5 h-3.5 text-slate-400" />
                    <span>{row.query}</span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="mr-1.5">{row.flag}</span>
                    <span>{row.country}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium">
                      {row.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    {row.leadsFound.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {row.status === 'completed' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1"></span> Completada
                      </span>
                    ) : row.status === 'processing' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1"></span> Procesando
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                        Pausada
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                    <button
                      onClick={() => onOpenResultsFor(row)}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                      title="Ver resultados"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onRepeatSearch(row)}
                      className="p-1.5 text-slate-600 hover:text-[#F04438] hover:bg-slate-200 rounded transition-colors cursor-pointer"
                      title="Repetir búsqueda"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={openExportModal}
                      className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                      title="Exportar leads"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
