import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Play,
  Pause,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Layers,
  ArrowUpRight,
  Zap,
  Sparkles,
  Search,
  Filter,
  Check,
  AlertCircle
} from 'lucide-react';
import { ScheduledSearch, LeadList, ScheduleInterval } from '../types';
import { ScheduledSearchModal } from './ScheduledSearchModal';

interface ScheduledSearchesSectionProps {
  scheduledSearches: ScheduledSearch[];
  lists: LeadList[];
  onSaveScheduledSearch: (data: any) => void;
  onToggleScheduledStatus: (id: string) => void;
  onDeleteScheduledSearch: (id: string) => void;
  onRunScheduledSearchNow: (id: string) => void;
  onOpenList?: (listId: string) => void;
}

export const ScheduledSearchesSection: React.FC<ScheduledSearchesSectionProps> = ({
  scheduledSearches,
  lists,
  onSaveScheduledSearch,
  onToggleScheduledStatus,
  onDeleteScheduledSearch,
  onRunScheduledSearchNow,
  onOpenList
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduledSearch | null>(null);
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'paused'>('all');
  const [runningId, setRunningId] = useState<string | null>(null);

  const activeCount = scheduledSearches.filter((s) => s.status === 'active').length;
  const pausedCount = scheduledSearches.filter((s) => s.status === 'paused').length;
  const totalHarvested = scheduledSearches.reduce((acc, s) => acc + s.leadsHarvestedTotal, 0);

  const filteredItems = scheduledSearches.filter((s) => {
    if (filterTab === 'active') return s.status === 'active';
    if (filterTab === 'paused') return s.status === 'paused';
    return true;
  });

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: ScheduledSearch) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleTriggerRunNow = (id: string) => {
    setRunningId(id);
    onRunScheduledSearchNow(id);
    setTimeout(() => {
      setRunningId(null);
    }, 1200);
  };

  const getIntervalLabel = (interval: ScheduleInterval) => {
    switch (interval) {
      case 'hourly_6':
        return 'Cada 6 horas';
      case 'daily':
        return 'Diario (Cada 24h)';
      case 'weekly':
        return 'Semanal (7 días)';
      case 'biweekly':
        return 'Quincenal (15 días)';
      case 'monthly':
        return 'Mensual (30 días)';
      default:
        return interval;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-slate-50/70 via-white to-red-50/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#F04438] animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Automatizaciones en segundo plano
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-[#F04438]">
                Auto-Refresh
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <span>Búsquedas Programadas & Refresco de Listas</span>
            </h2>
            <p className="text-xs text-slate-600">
              Programa extracciones recurrentes para mantener tus listas de leads siempre enriquecidas con nuevos contactos.
            </p>
          </div>

          {/* Action Button */}
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center space-x-2 px-4 py-2 bg-[#F04438] hover:bg-[#D92D20] text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-[#F04438]/20 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Programar búsqueda</span>
          </button>
        </div>

        {/* Quick KPI stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-200/80">
          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Activas</span>
            <span className="text-lg font-bold text-emerald-600 font-mono">{activeCount}</span>
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Pausadas</span>
            <span className="text-lg font-bold text-slate-500 font-mono">{pausedCount}</span>
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Leads Auto-cosechados</span>
            <span className="text-lg font-bold text-slate-900 font-mono">
              {totalHarvested.toLocaleString()}
            </span>
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Próxima Ejecución</span>
            <span className="text-xs font-bold text-[#F04438] truncate block mt-1">
              {scheduledSearches.find(s => s.status === 'active')?.nextRun || 'Ninguna'}
            </span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center space-x-2 mt-4 text-xs">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
              filterTab === 'all'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            Todas ({scheduledSearches.length})
          </button>
          <button
            onClick={() => setFilterTab('active')}
            className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
              filterTab === 'active'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            Activas ({activeCount})
          </button>
          <button
            onClick={() => setFilterTab('paused')}
            className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
              filterTab === 'paused'
                ? 'bg-slate-600 text-white'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            Pausadas ({pausedCount})
          </button>
        </div>
      </div>

      {/* List / Cards of Scheduled Searches */}
      <div className="divide-y divide-slate-100">
        {filteredItems.map((item) => {
          const isRunning = runningId === item.id;
          const isActive = item.status === 'active';

          return (
            <div
              key={item.id}
              className={`p-4 sm:p-5 hover:bg-slate-50/90 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                !isActive ? 'opacity-75 bg-slate-50/40' : ''
              }`}
            >
              {/* Left Details */}
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xl leading-none">{item.flag}</span>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                    {item.title}
                  </h3>

                  {/* Status Badge */}
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full mr-1 ${
                        isActive ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                    ></span>
                    {isActive ? 'Activo (Monitoreando)' : 'Pausado'}
                  </span>

                  {/* Interval Badge */}
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                    <Clock className="w-3 h-3 text-blue-600" />
                    <span>{getIntervalLabel(item.interval)}</span>
                  </span>

                  {/* Quota per run */}
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    ~{item.quantityPerRun} leads / ciclo
                  </span>
                </div>

                {/* Location, Target List & Enrichment Flags */}
                <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500">
                  <span className="flex items-center space-x-1 text-slate-700 font-medium">
                    <span>📍</span>
                    <span>
                      {item.city || item.state ? `${item.city || ''}, ${item.state || ''}` : 'Nacional'} ({item.country})
                    </span>
                  </span>

                  <span className="text-slate-300">•</span>

                  {/* Target List */}
                  <div className="flex items-center space-x-1 font-semibold text-slate-700">
                    <Layers className="w-3.5 h-3.5 text-[#F04438]" />
                    <span>Lista destino:</span>
                    <button
                      onClick={() => onOpenList && onOpenList(item.targetListId)}
                      className="text-[#F04438] hover:underline font-bold"
                    >
                      {item.targetListName}
                    </button>
                  </div>

                  <span className="text-slate-300">•</span>

                  {/* Tags */}
                  <div className="flex items-center space-x-1.5">
                    {item.autoVerifyEmails && (
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 font-semibold flex items-center space-x-0.5">
                        <ShieldCheck className="w-2.5 h-2.5" />
                        <span>MX Verificado</span>
                      </span>
                    )}
                    {item.autoDeduplicate && (
                      <span className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded font-semibold">
                        Auto-Deduplicado
                      </span>
                    )}
                    {item.notifyEmail && (
                      <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded font-semibold">
                        Alerta Email
                      </span>
                    )}
                  </div>
                </div>

                {/* Stats Bar */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs pt-1">
                  <span className="text-slate-600 font-mono">
                    Total cosechados:{' '}
                    <strong className="text-slate-900 font-bold">
                      {item.leadsHarvestedTotal.toLocaleString()}
                    </strong>
                  </span>
                  <span className="text-emerald-600 font-mono font-medium">
                    Último ciclo: <strong>+{item.newLeadsLastRun} leads</strong> ({item.lastRun})
                  </span>
                  <span className="text-slate-500 font-mono text-[11px]">
                    Próxima ejecución: <strong className="text-slate-800">{item.nextRun}</strong>
                  </span>
                </div>
              </div>

              {/* Right Action Controls */}
              <div className="flex items-center space-x-2.5 self-end lg:self-center">
                {/* Instant Run Button */}
                <button
                  type="button"
                  onClick={() => handleTriggerRunNow(item.id)}
                  disabled={isRunning}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer ${
                    isRunning
                      ? 'bg-amber-500 text-white animate-pulse'
                      : 'bg-slate-900 hover:bg-slate-800 text-white hover:shadow-md'
                  }`}
                  title="Ejecutar ciclo de rastreo inmediatamente"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
                  <span>{isRunning ? 'Extrayendo...' : 'Ejecutar ahora'}</span>
                </button>

                {/* Pause / Resume toggle button */}
                <button
                  type="button"
                  onClick={() => onToggleScheduledStatus(item.id)}
                  className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                    isActive
                      ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                  title={isActive ? 'Pausar automatización' : 'Reanudar automatización'}
                >
                  {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>

                {/* Edit button */}
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(item)}
                  className="p-2 border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="Editar programación"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => onDeleteScheduledSearch(item.id)}
                  className="p-2 border border-slate-200 hover:border-red-200 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Eliminar programación"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="p-8 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-600">
              No hay búsquedas programadas en esta pestaña
            </p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Crea tu primera automatización para que el motor extraiga y verifique leads periódicamente en segundo plano.
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="mt-2 inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#F04438] hover:bg-[#D92D20] text-white rounded-lg text-xs font-bold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Programar búsqueda ahora</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal for creating/editing */}
      <ScheduledSearchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={onSaveScheduledSearch}
        editItem={editingItem}
        lists={lists}
      />
    </div>
  );
};
