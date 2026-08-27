import React, { useState } from 'react';
import {
  Search,
  RotateCcw,
  Download,
  Trash2,
  Eye,
  Calendar,
  Clock,
  CheckCircle2,
  Loader2,
  Filter,
  AlertCircle
} from 'lucide-react';
import { SearchHistoryItem } from '../types';

interface HistoryViewProps {
  history: SearchHistoryItem[];
  onRepeatSearch: (item: SearchHistoryItem) => void;
  onOpenResultsFor: (item: SearchHistoryItem) => void;
  onDeleteHistoryItem: (id: string) => void;
  openExportModal: () => void;
  addToast: (title: string, message?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  onRepeatSearch,
  onOpenResultsFor,
  onDeleteHistoryItem,
  openExportModal,
  addToast
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredHistory = history.filter(h =>
    h.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 overflow-y-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Historial de Búsquedas</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro de todas las consultas realizadas, leads encontrados y exportaciones.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Filtrar por término, país..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-[#F04438]"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Fecha & Hora</th>
                <th className="py-3.5 px-4">Búsqueda / Objetivo</th>
                <th className="py-3.5 px-4">País & Ciudad</th>
                <th className="py-3.5 px-4">Categoría</th>
                <th className="py-3.5 px-4 text-right">Leads</th>
                <th className="py-3.5 px-4 text-right">Exportados</th>
                <th className="py-3.5 px-4 text-center">Duración</th>
                <th className="py-3.5 px-4 text-center">Estado</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredHistory.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Fecha */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.date}</span>
                    </div>
                  </td>

                  {/* Búsqueda */}
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    <div className="flex items-center space-x-2">
                      <Search className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.query}</span>
                    </div>
                  </td>

                  {/* País y Ciudad */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="mr-1.5">{item.flag}</span>
                    <span>{item.country}</span>
                    <span className="text-slate-400 text-[11px] block">{item.city}</span>
                  </td>

                  {/* Categoría */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold">
                      {item.category}
                    </span>
                  </td>

                  {/* Encontrados */}
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                    {item.leadsFound.toLocaleString()}
                  </td>

                  {/* Exportados */}
                  <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                    {item.exportedCount > 0 ? (
                      <span className="text-emerald-700 font-semibold">{item.exportedCount.toLocaleString()}</span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  {/* Duración */}
                  <td className="py-3.5 px-4 text-center font-mono text-slate-500 text-[11px]">
                    <div className="flex items-center justify-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{item.duration}</span>
                    </div>
                  </td>

                  {/* Estado */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    {item.status === 'completed' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 mr-1" />
                        Completada
                      </span>
                    ) : item.status === 'processing' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                        <Loader2 className="w-3 h-3 text-amber-600 mr-1 animate-spin" />
                        Procesando
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                        Pausada
                      </span>
                    )}
                  </td>

                  {/* Acciones */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end space-x-1">
                      <button
                        onClick={() => onOpenResultsFor(item)}
                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors"
                        title="Abrir resultados"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onRepeatSearch(item)}
                        className="p-1.5 text-slate-600 hover:text-[#F04438] hover:bg-slate-200 rounded transition-colors"
                        title="Repetir búsqueda"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={openExportModal}
                        className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-200 rounded transition-colors"
                        title="Exportar archivo"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          onDeleteHistoryItem(item.id);
                          addToast('Historial actualizado', 'Entrada eliminada.', 'info');
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-200 rounded transition-colors"
                        title="Eliminar registro"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredHistory.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <span className="font-bold text-sm">No se encontraron registros</span>
          </div>
        )}
      </div>
    </div>
  );
};
