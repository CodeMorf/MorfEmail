import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Globe,
  Mail,
  Phone,
  MessageCircle,
  Share2,
  Trash2,
  Bookmark,
  CheckSquare,
  Square,
  Eye,
  SlidersHorizontal,
  Sparkles,
  ArrowUpDown
} from 'lucide-react';
import { Lead, LeadList } from '../types';

interface ResultsViewProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  openExportModal: () => void;
  lists: LeadList[];
  onAddToListBulk: (leadIds: string[], listId: string) => void;
  onDeleteLeads: (leadIds: string[]) => void;
  addToast: (title: string, message?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  leads,
  onSelectLead,
  openExportModal,
  lists,
  onAddToListBulk,
  onDeleteLeads,
  addToast
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filterHasEmail, setFilterHasEmail] = useState(false);
  const [filterHasPhone, setFilterHasPhone] = useState(false);
  const [filterHasWhatsApp, setFilterHasWhatsApp] = useState(false);
  const [filterVerifiedOnly, setFilterVerifiedOnly] = useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [bulkListTarget, setBulkListTarget] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<'companyName' | 'confidenceScore' | 'city'>('companyName');
  const [sortAsc, setSortAsc] = useState(true);

  const pageSize = 8;

  // Filtered leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchSearch =
        lead.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm) ||
        lead.city.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCountry = selectedCountry === 'all' || lead.country === selectedCountry;
      const matchCategory = selectedCategory === 'all' || lead.category === selectedCategory;
      const matchEmail = !filterHasEmail || !!lead.email;
      const matchPhone = !filterHasPhone || !!lead.phone;
      const matchWhatsApp = !filterHasWhatsApp || !!lead.whatsapp;
      const matchVerified = !filterVerifiedOnly || lead.verified === 'verified';

      return matchSearch && matchCountry && matchCategory && matchEmail && matchPhone && matchWhatsApp && matchVerified;
    }).sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === 'string') {
        return sortAsc ? (valA as string).localeCompare(valB as string) : (valB as string).localeCompare(valA as string);
      }
      return sortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });
  }, [
    leads,
    searchTerm,
    selectedCountry,
    selectedCategory,
    filterHasEmail,
    filterHasPhone,
    filterHasWhatsApp,
    filterVerifiedOnly,
    sortField,
    sortAsc
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredLeads.length / pageSize) || 1;
  const paginatedLeads = filteredLeads.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedLeadIds.length === paginatedLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(paginatedLeads.map(l => l.id));
    }
  };

  const handleToggleOne = (id: string) => {
    if (selectedLeadIds.includes(id)) {
      setSelectedLeadIds(selectedLeadIds.filter(i => i !== id));
    } else {
      setSelectedLeadIds([...selectedLeadIds, id]);
    }
  };

  const handleBulkAddToList = () => {
    if (!bulkListTarget || selectedLeadIds.length === 0) return;
    onAddToListBulk(selectedLeadIds, bulkListTarget);
    setBulkListTarget('');
    setSelectedLeadIds([]);
  };

  const handleBulkDelete = () => {
    if (selectedLeadIds.length === 0) return;
    onDeleteLeads(selectedLeadIds);
    setSelectedLeadIds([]);
    addToast('Leads eliminados', 'Se han removido los registros seleccionados.', 'info');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5 overflow-y-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Resultados</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-900 text-white">
              {filteredLeads.length.toLocaleString()} empresas encontradas
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Explora, filtra y organiza contactos empresariales antes de exportar.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={openExportModal}
            className="flex items-center space-x-2 px-4 py-2.5 bg-[#F04438] hover:bg-[#D92D20] text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-[#F04438]/20 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Exportar resultados</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        {/* Search input and Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative lg:col-span-2">
            <input
              type="text"
              placeholder="Buscar empresa, email, teléfono, ciudad..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:outline-none focus:border-[#F04438]"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <div>
            <select
              value={selectedCountry}
              onChange={(e) => {
                setSelectedCountry(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:outline-none focus:border-[#F04438]"
            >
              <option value="all">🌍 Todos los países</option>
              <option value="República Dominicana">🇩🇴 República Dominicana</option>
              <option value="España">🇪🇸 España</option>
              <option value="Estados Unidos">🇺🇸 Estados Unidos</option>
              <option value="México">🇲🇽 México</option>
              <option value="Italia">🇮🇹 Italia</option>
            </select>
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:outline-none focus:border-[#F04438]"
            >
              <option value="all">📁 Todas las categorías</option>
              <option value="Restaurante">Restaurantes</option>
              <option value="Hoteles">Hoteles</option>
              <option value="Abogados">Abogados</option>
              <option value="Ecommerce">Ecommerce</option>
              <option value="Tecnología">Tecnología</option>
              <option value="Dentistas">Dentistas</option>
              <option value="Inmobiliarias">Inmobiliarias</option>
            </select>
          </div>
        </div>

        {/* Filter Toggle Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase mr-1">Filtros rápidos:</span>
            
            <button
              onClick={() => setFilterHasEmail(!filterHasEmail)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all flex items-center space-x-1 ${
                filterHasEmail ? 'bg-red-50 text-[#F04438] border border-red-200 font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Mail className="w-3 h-3" />
              <span>Tiene email</span>
            </button>

            <button
              onClick={() => setFilterHasPhone(!filterHasPhone)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all flex items-center space-x-1 ${
                filterHasPhone ? 'bg-red-50 text-[#F04438] border border-red-200 font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Phone className="w-3 h-3" />
              <span>Tiene teléfono</span>
            </button>

            <button
              onClick={() => setFilterHasWhatsApp(!filterHasWhatsApp)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all flex items-center space-x-1 ${
                filterHasWhatsApp ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <MessageCircle className="w-3 h-3" />
              <span>Tiene WhatsApp</span>
            </button>

            <button
              onClick={() => setFilterVerifiedOnly(!filterVerifiedOnly)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all flex items-center space-x-1 ${
                filterVerifiedOnly ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Solo verificados</span>
            </button>
          </div>

          {/* Reset Filters */}
          {(searchTerm || selectedCountry !== 'all' || selectedCategory !== 'all' || filterHasEmail || filterHasPhone || filterHasWhatsApp || filterVerifiedOnly) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCountry('all');
                setSelectedCategory('all');
                setFilterHasEmail(false);
                setFilterHasPhone(false);
                setFilterHasWhatsApp(false);
                setFilterVerifiedOnly(false);
              }}
              className="text-[#F04438] hover:underline text-[11px] font-semibold"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Batch Action Bar if items selected */}
      {selectedLeadIds.length > 0 && (
        <div className="bg-[#15171A] text-white p-3 rounded-xl shadow-lg border border-slate-800 flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center space-x-2 text-xs font-semibold">
            <span className="w-5 h-5 rounded bg-[#F04438] text-white flex items-center justify-center font-bold font-mono text-[10px]">
              {selectedLeadIds.length}
            </span>
            <span>leads seleccionados</span>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={bulkListTarget}
              onChange={(e) => setBulkListTarget(e.target.value)}
              className="px-2.5 py-1.5 bg-[#22262B] border border-slate-700 rounded text-xs text-slate-200 font-medium focus:outline-none"
            >
              <option value="">➕ Guardar en Lista...</option>
              {lists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>

            {bulkListTarget && (
              <button
                onClick={handleBulkAddToList}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-all"
              >
                Guardar
              </button>
            )}

            <button
              onClick={openExportModal}
              className="px-3 py-1.5 bg-[#F04438] hover:bg-[#D92D20] text-white rounded text-xs font-bold transition-all flex items-center space-x-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar</span>
            </button>

            <button
              onClick={handleBulkDelete}
              className="p-1.5 bg-[#22262B] hover:bg-red-950 text-red-400 hover:text-red-300 rounded transition-colors"
              title="Eliminar de la vista"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main CRM Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 select-none">
              <tr>
                <th className="py-3.5 px-4 w-10 text-center">
                  <button onClick={handleSelectAll} className="flex items-center justify-center">
                    {selectedLeadIds.length > 0 && selectedLeadIds.length === paginatedLeads.length ? (
                      <CheckSquare className="w-4 h-4 text-[#F04438]" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300 hover:text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="py-3.5 px-4 cursor-pointer hover:text-slate-900" onClick={() => { setSortField('companyName'); setSortAsc(!sortAsc); }}>
                  <div className="flex items-center space-x-1">
                    <span>Empresa</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3.5 px-4">Email comercial</th>
                <th className="py-3.5 px-4">Teléfono</th>
                <th className="py-3.5 px-4 cursor-pointer hover:text-slate-900" onClick={() => { setSortField('city'); setSortAsc(!sortAsc); }}>
                  <div className="flex items-center space-x-1">
                    <span>Ciudad</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3.5 px-4">Website</th>
                <th className="py-3.5 px-4">Categoría</th>
                <th className="py-3.5 px-4 text-center">Redes</th>
                <th className="py-3.5 px-4 text-center">Estado</th>
                <th className="py-3.5 px-4 text-right">Acción</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {paginatedLeads.map((lead) => {
                const isSelected = selectedLeadIds.includes(lead.id);
                return (
                  <tr
                    key={lead.id}
                    onClick={() => onSelectLead(lead)}
                    className={`hover:bg-red-50/30 transition-colors cursor-pointer ${
                      isSelected ? 'bg-red-50/50' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3.5 px-4 text-center" onClick={(e) => { e.stopPropagation(); handleToggleOne(lead.id); }}>
                      <button className="flex items-center justify-center">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-[#F04438]" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 hover:text-slate-400" />
                        )}
                      </button>
                    </td>

                    {/* Empresa */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                        <span className="text-sm">{lead.flag}</span>
                        <span className="hover:text-[#F04438] transition-colors">{lead.companyName}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-xs">{lead.address}</div>
                    </td>

                    {/* Email */}
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-800">
                      <div className="flex items-center space-x-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#F04438] flex-shrink-0" />
                        <span className="truncate max-w-[180px]">{lead.email}</span>
                      </div>
                    </td>

                    {/* Teléfono */}
                    <td className="py-3.5 px-4 font-mono text-slate-800 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <Phone className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                        <span>{lead.phone}</span>
                      </div>
                    </td>

                    {/* Ciudad */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-medium">
                      {lead.city}
                    </td>

                    {/* Website */}
                    <td className="py-3.5 px-4 font-medium text-blue-600 truncate max-w-[140px]">
                      <a
                        href={`https://${lead.website}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="hover:underline flex items-center space-x-1"
                      >
                        <Globe className="w-3 h-3 text-slate-400" />
                        <span className="truncate">{lead.website}</span>
                      </a>
                    </td>

                    {/* Categoría */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold">
                        {lead.category}
                      </span>
                    </td>

                    {/* Redes Icons */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1 text-slate-400">
                        {lead.whatsapp && <span title="WhatsApp" className="text-emerald-500 font-bold">💬</span>}
                        {lead.instagram && <span title="Instagram" className="text-pink-500 font-bold">📸</span>}
                        {lead.linkedin && <span title="LinkedIn" className="text-sky-600 font-bold">💼</span>}
                        {lead.facebook && <span title="Facebook" className="text-blue-600 font-bold">📘</span>}
                      </div>
                    </td>

                    {/* Estado */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {lead.verified === 'verified' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 mr-1" />
                          Verificado
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          Pendiente
                        </span>
                      )}
                    </td>

                    {/* Acción */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onSelectLead(lead)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-bold transition-colors inline-flex items-center space-x-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Ver</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty state if no results */}
        {paginatedLeads.length === 0 && (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="font-bold text-slate-700">No se encontraron leads con estos filtros</div>
            <p className="text-xs text-slate-400">Prueba ajustando la búsqueda o eliminando los filtros activos.</p>
          </div>
        )}

        {/* Table Footer with Pagination */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Mostrando <strong className="text-slate-800">{paginatedLeads.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</strong> a{' '}
            <strong className="text-slate-800">{Math.min(currentPage * pageSize, filteredLeads.length)}</strong> de{' '}
            <strong className="text-slate-800">{filteredLeads.length}</strong> leads
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-7 h-7 rounded text-xs font-bold transition-colors ${
                  currentPage === i + 1
                    ? 'bg-[#F04438] text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
