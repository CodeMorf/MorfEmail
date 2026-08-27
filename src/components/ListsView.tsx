import React, { useState } from 'react';
import {
  Bookmark,
  Plus,
  Users,
  Clock,
  Trash2,
  Download,
  ExternalLink,
  Search,
  CheckCircle2,
  Eye,
  FolderPlus
} from 'lucide-react';
import { LeadList, Lead, ActiveView } from '../types';

interface ListsViewProps {
  lists: LeadList[];
  leads: Lead[];
  onCreateList: (name: string, description: string, color: string) => void;
  onDeleteList: (id: string) => void;
  onSelectLead: (lead: Lead) => void;
  openExportModal: () => void;
  setActiveView: (view: ActiveView) => void;
  addToast: (title: string, message?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const ListsView: React.FC<ListsViewProps> = ({
  lists,
  leads,
  onCreateList,
  onDeleteList,
  onSelectLead,
  openExportModal,
  setActiveView,
  addToast
}) => {
  const [selectedListId, setSelectedListId] = useState<string>(lists[0]?.id || 'list-1');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDesc, setNewListDesc] = useState('');
  const [newListColor, setNewListColor] = useState('#F04438');

  const currentList = lists.find(l => l.id === selectedListId) || lists[0];
  const listLeads = leads.filter(l => l.listId === selectedListId);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    onCreateList(newListName, newListDesc, newListColor);
    setNewListName('');
    setNewListDesc('');
    setShowCreateModal(false);
    addToast('Lista creada', `La lista "${newListName}" está lista para recibir leads.`, 'success');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 overflow-y-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Listas de Prospectos</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Organiza y segmenta tus leads por campañas de outreach, estados y llamadas prioritarias.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-[#F04438] hover:bg-[#D92D20] text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-[#F04438]/20 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Crear nueva lista</span>
        </button>
      </div>

      {/* Grid: Left Lists Directory & Right Leads Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Lists Directory */}
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Tus listas ({lists.length})
          </span>

          <div className="space-y-2">
            {lists.map((list) => {
              const isSelected = list.id === selectedListId;
              return (
                <div
                  key={list.id}
                  onClick={() => setSelectedListId(list.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-white border-[#F04438] shadow-md ring-1 ring-[#F04438]'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <span className="text-lg">{list.name.split(' ')[0]}</span>
                      <div>
                        <h3 className="font-bold text-slate-900 text-xs">{list.name}</h3>
                        <p className="text-[11px] text-slate-500 truncate max-w-[180px]">{list.description}</p>
                      </div>
                    </div>
                    
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">
                      {list.leadCount.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2.5 pt-2 border-t border-slate-100">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{list.updatedAt}</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`¿Eliminar la lista "${list.name}"?`)) {
                          onDeleteList(list.id);
                          addToast('Lista eliminada', undefined, 'info');
                        }
                      }}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                      title="Eliminar lista"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Member Leads Table */}
        <div className="lg:col-span-2 space-y-3">
          {currentList && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
              {/* Header */}
              <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                    <span>{currentList.name}</span>
                    <span className="text-xs font-mono font-normal text-slate-500">
                      ({currentList.leadCount.toLocaleString()} leads guardados)
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500">{currentList.description}</p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={openExportModal}
                    className="px-3 py-1.5 bg-[#F04438] hover:bg-[#D92D20] text-white text-xs font-bold rounded-lg transition-all flex items-center space-x-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Exportar lista</span>
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-white text-slate-400 font-semibold border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4">Empresa</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Teléfono</th>
                      <th className="py-3 px-4">Ciudad</th>
                      <th className="py-3 px-4 text-right">Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {leads.slice(0, 6).map((lead) => (
                      <tr
                        key={lead.id}
                        onClick={() => onSelectLead(lead)}
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-4 font-bold text-slate-900">
                          <div className="flex items-center space-x-1.5">
                            <span>{lead.flag}</span>
                            <span>{lead.companyName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-800 text-[11px] truncate max-w-[140px]">
                          {lead.email}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-800 text-[11px]">
                          {lead.phone}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {lead.city}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectLead(lead);
                            }}
                            className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-[10px]"
                          >
                            Ver
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3 border-t border-slate-100 bg-slate-50 text-center text-xs text-slate-500">
                <button
                  onClick={() => setActiveView('results')}
                  className="text-[#F04438] hover:underline font-semibold"
                >
                  Ver todos los leads en vista completa CRM →
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Create List Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <FolderPlus className="w-4 h-4 text-[#F04438]" />
                <span>Nueva Lista de Leads</span>
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre de la lista</label>
                <input
                  type="text"
                  placeholder="Ej. 🚀 Campaña Q4 o 📞 Leads para llamar hoy"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#F04438]"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descripción (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej. Empresas de retail con WhatsApp directo"
                  value={newListDesc}
                  onChange={(e) => setNewListDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#F04438]"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg font-semibold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#F04438] hover:bg-[#D92D20] text-white rounded-lg font-bold shadow-sm"
                >
                  Guardar lista
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
