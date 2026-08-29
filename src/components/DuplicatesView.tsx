import React, { useMemo, useState } from 'react';
import { Building, Copy, Layers, Trash2 } from 'lucide-react';
import { Lead } from '../types';

interface DuplicatesViewProps {
  leads: Lead[];
  onDeleteLeads?: (leadIds: string[]) => void;
  addToast: (title: string, message?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

type MatchCriteria = 'email' | 'phone' | 'domain';

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const normalizePhone = (phone: string) => phone.replace(/\D/g, '');

const normalizeDomain = (website: string) => {
  const value = website.trim().toLowerCase();
  if (!value) return '';

  try {
    const url = new URL(value.match(/^https?:\/\//) ? value : `https://${value}`);
    return url.hostname.replace(/^www\./, '');
  } catch {
    return value.replace(/^https?:\/\//, '').split('/')[0].replace(/^www\./, '');
  }
};

const getMatchValue = (lead: Lead, criteria: MatchCriteria) => {
  if (criteria === 'email') {
    const email = normalizeEmail(lead.email);
    return email.includes('@') ? email : '';
  }

  if (criteria === 'phone') {
    const phone = normalizePhone(lead.phone || lead.whatsapp || '');
    return phone.length >= 7 ? phone : '';
  }

  return normalizeDomain(lead.website);
};

const leadCompleteness = (lead: Lead) =>
  [lead.companyName, lead.email, lead.phone, lead.website, lead.address, lead.city].filter(Boolean).length;

const formatDate = (value: string) => {
  if (!value) return 'Fecha no disponible';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('es-DO');
};

export const DuplicatesView: React.FC<DuplicatesViewProps> = ({ leads, onDeleteLeads, addToast }) => {
  const [matchCriteria, setMatchCriteria] = useState<MatchCriteria>('email');

  const duplicateGroups = useMemo(() => {
    const grouped = new Map<string, Lead[]>();

    for (const lead of leads) {
      const value = getMatchValue(lead, matchCriteria);
      if (!value) continue;
      const current = grouped.get(value) || [];
      current.push(lead);
      grouped.set(value, current);
    }

    return Array.from(grouped.entries())
      .filter(([, items]) => items.length > 1)
      .map(([value, items]) => ({
        key: value,
        items: [...items].sort((a, b) => {
          const completenessDifference = leadCompleteness(b) - leadCompleteness(a);
          if (completenessDifference !== 0) return completenessDifference;
          return new Date(b.extractedAt).getTime() - new Date(a.extractedAt).getTime();
        })
      }));
  }, [leads, matchCriteria]);

  const duplicateIds = duplicateGroups.flatMap((group) => group.items.slice(1).map((lead) => lead.id));
  const criteriaLabel = matchCriteria === 'email' ? 'Email' : matchCriteria === 'phone' ? 'Teléfono' : 'Dominio';

  const removeLeads = (ids: string[]) => {
    if (!ids.length) return;
    if (!onDeleteLeads) {
      addToast('Acción no disponible', 'No se configuró el almacenamiento para eliminar duplicados.', 'warning');
      return;
    }
    onDeleteLeads(ids);
  };

  const handleMergeAll = () => {
    if (!duplicateIds.length) {
      addToast('Sin duplicados reales', `No hay registros repetidos por ${criteriaLabel.toLowerCase()}.`, 'info');
      return;
    }

    removeLeads(duplicateIds);
    addToast(
      'Duplicados eliminados',
      `Se conservaron ${duplicateGroups.length} registros principales y se eliminaron ${duplicateIds.length} repetidos.`,
      'success'
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 overflow-y-auto pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Limpieza de duplicados</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Revisa tus registros guardados y elimina repetidos conservando el registro más completo.
          </p>
        </div>

        <button
          onClick={handleMergeAll}
          disabled={!duplicateIds.length}
          className="px-5 py-2.5 bg-[#F04438] hover:bg-[#D92D20] disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-[#F04438]/20 flex items-center space-x-2 cursor-pointer disabled:cursor-not-allowed self-start sm:self-auto"
        >
          <Layers className="w-4 h-4" />
          <span>{duplicateIds.length ? `Eliminar duplicados (${duplicateIds.length})` : 'Sin duplicados reales'}</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3 text-xs">
          <span className="font-bold text-slate-700 uppercase tracking-wider">Criterio:</span>
          <div className="flex flex-wrap gap-1.5">
            {([
              ['email', 'Email comercial'],
              ['phone', 'Teléfono / WhatsApp'],
              ['domain', 'Dominio web']
            ] as const).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setMatchCriteria(value)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  matchCriteria === value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <span className="text-xs text-slate-400 font-medium">
          {duplicateIds.length} repetidos en {leads.length.toLocaleString('es-DO')} registros guardados
        </span>
      </div>

      {duplicateGroups.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <Copy className="w-10 h-10 mx-auto text-slate-300" />
          <h2 className="mt-3 text-sm font-bold text-slate-800">
            {leads.length ? 'No hay duplicados con este criterio' : 'Todavía no hay leads guardados'}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {leads.length
              ? `No se encontraron registros repetidos por ${criteriaLabel.toLowerCase()}.`
              : 'Los duplicados aparecerán aquí después de ejecutar una búsqueda real.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {duplicateGroups.map((group) => (
            <div key={`${matchCriteria}-${group.key}`} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 flex items-center space-x-2">
                  <Copy className="w-3.5 h-3.5 text-[#F04438]" />
                  <span>{criteriaLabel}: {group.key}</span>
                </span>
                <button
                  onClick={() => {
                    const ids = group.items.slice(1).map((lead) => lead.id);
                    removeLeads(ids);
                    addToast('Duplicados eliminados', `${ids.length} registro(s) repetido(s) eliminado(s).`, 'success');
                  }}
                  className="text-[#F04438] hover:underline font-bold text-[11px]"
                >
                  Eliminar repetidos
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {group.items.map((lead, index) => (
                  <div key={lead.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                        <Building className="w-4 h-4 text-slate-500" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900">{lead.companyName || 'Empresa sin nombre'}</span>
                          {index === 0 && (
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                              Conservar
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 text-slate-500 text-[11px] mt-0.5 font-mono">
                          {lead.email && <span>{lead.email}</span>}
                          {lead.phone && <span>{lead.phone}</span>}
                          {lead.city && <span>{lead.city}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                      <span>{formatDate(lead.extractedAt)}</span>
                      {index > 0 && (
                        <button
                          onClick={() => {
                            removeLeads([lead.id]);
                            addToast('Registro eliminado', 'El duplicado fue eliminado del almacenamiento local.', 'success');
                          }}
                          className="p-1 text-slate-400 hover:text-red-500 rounded"
                          title="Eliminar este duplicado"
                          aria-label={`Eliminar duplicado de ${lead.companyName || 'empresa'}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
