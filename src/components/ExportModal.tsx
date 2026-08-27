/**
 * ExportModal - MorfEmail Export Window
 * Genera descargas locales en CSV (RFC 4180 con UTF-8 BOM), Excel (.XLSX) y JSON.
 */

import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  FileText,
  FileCode,
  Download,
  CheckSquare,
  Square,
  Table
} from 'lucide-react';
import { Lead } from '../types';
import { CsvExporter } from '../../exports/csvExporter';
import { ExcelExporter } from '../../exports/excelExporter';
import { JsonExporter } from '../../exports/jsonExporter';
import { SqliteClient } from '../../engine/database/sqliteClient';
import { NormalizedLead } from '../../engine/types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: Lead[];
  addToast: (title: string, message?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  leads,
  addToast
}) => {
  const [format, setFormat] = useState<'xlsx' | 'csv' | 'json' | 'txt'>('csv');
  const [filterMode, setFilterMode] = useState<'all' | 'verified_only' | 'with_phone'>('all');

  const [fields, setFields] = useState({
    companyName: true,
    email: true,
    phone: true,
    whatsapp: true,
    website: true,
    city: true,
    country: true,
    category: true,
    socials: true,
    address: true,
    postalCode: false
  });

  if (!isOpen) return null;

  const toggleField = (key: keyof typeof fields) => {
    setFields((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getFilteredLeads = (): Lead[] => {
    if (filterMode === 'verified_only') return leads.filter((l) => l.verified === 'verified');
    if (filterMode === 'with_phone') return leads.filter((l) => !!l.phone);
    return leads;
  };

  const handleExport = () => {
    const rawFiltered = getFilteredLeads();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

    // Convertir a NormalizedLead para los exportadores de datos
    const normalizedLeads: NormalizedLead[] = rawFiltered.map((l) => ({
      id: l.id,
      businessName: l.companyName,
      category: l.category,
      website: l.website,
      domain: l.website.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0],
      email: l.email,
      emailStatus: l.verified === 'verified' ? 'valid' : l.verified === 'risky' ? 'risky' : 'unverified',
      phone: l.phone,
      whatsapp: l.whatsapp,
      address: l.address,
      city: l.city,
      region: l.state,
      postalCode: l.postalCode,
      country: l.country,
      countryCode: l.countryCode,
      facebook: l.facebook,
      instagram: l.instagram,
      linkedin: l.linkedin,
      sourceUrl: l.source,
      discoveredAt: l.extractedAt,
      updatedAt: l.extractedAt,
      confidenceScore: l.confidenceScore
    }));

    const filename = `morfemail_leads_${timestamp}.${format}`;

    if (format === 'csv') {
      CsvExporter.downloadCsv(normalizedLeads, filename);
    } else if (format === 'xlsx') {
      ExcelExporter.downloadExcel(normalizedLeads, filename);
    } else if (format === 'json') {
      JsonExporter.downloadJson(normalizedLeads, filename);
    } else if (format === 'txt') {
      const txtContent = normalizedLeads
        .map((l) => `${l.businessName} | ${l.email} | ${l.phone} | ${l.website} | ${l.city}`)
        .join('\r\n');
      const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    }

    // Registrar exportación en SQLite local
    SqliteClient.getInstance().recordExport({
      id: `exp-${Date.now()}`,
      file_name: filename,
      format: format === 'txt' ? 'csv' : format,
      record_count: normalizedLeads.length,
      file_size_bytes: normalizedLeads.length * 180,
      created_at: new Date().toISOString()
    });

    addToast(
      'Archivo exportado con éxito',
      `${normalizedLeads.length} leads guardados en formato .${format.toUpperCase()}`,
      'success'
    );
    onClose();
  };

  const targetCount = getFilteredLeads().length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-6 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#F04438]">
              Motor de Exportación Local
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Exportar {targetCount.toLocaleString()} prospectos
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Format Selection Cards */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Formato de Archivo
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Excel */}
            <div
              onClick={() => setFormat('xlsx')}
              className={`p-3.5 rounded-xl border text-center cursor-pointer transition-all ${
                format === 'xlsx'
                  ? 'border-[#F04438] bg-red-50/40 ring-1 ring-[#F04438]'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50'
              }`}
            >
              <FileSpreadsheet
                className={`w-6 h-6 mx-auto mb-1.5 ${format === 'xlsx' ? 'text-[#F04438]' : 'text-slate-500'}`}
              />
              <div className="font-bold text-xs text-slate-900">Excel</div>
              <div className="text-[10px] text-slate-500">.XLSX Nativo</div>
            </div>

            {/* CSV */}
            <div
              onClick={() => setFormat('csv')}
              className={`p-3.5 rounded-xl border text-center cursor-pointer transition-all ${
                format === 'csv'
                  ? 'border-[#F04438] bg-red-50/40 ring-1 ring-[#F04438]'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50'
              }`}
            >
              <Table
                className={`w-6 h-6 mx-auto mb-1.5 ${format === 'csv' ? 'text-[#F04438]' : 'text-slate-500'}`}
              />
              <div className="font-bold text-xs text-slate-900">CSV</div>
              <div className="text-[10px] text-slate-500">UTF-8 BOM</div>
            </div>

            {/* JSON */}
            <div
              onClick={() => setFormat('json')}
              className={`p-3.5 rounded-xl border text-center cursor-pointer transition-all ${
                format === 'json'
                  ? 'border-[#F04438] bg-red-50/40 ring-1 ring-[#F04438]'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50'
              }`}
            >
              <FileCode
                className={`w-6 h-6 mx-auto mb-1.5 ${format === 'json' ? 'text-[#F04438]' : 'text-slate-500'}`}
              />
              <div className="font-bold text-xs text-slate-900">JSON</div>
              <div className="text-[10px] text-slate-500">Estructurado</div>
            </div>

            {/* TXT */}
            <div
              onClick={() => setFormat('txt')}
              className={`p-3.5 rounded-xl border text-center cursor-pointer transition-all ${
                format === 'txt'
                  ? 'border-[#F04438] bg-red-50/40 ring-1 ring-[#F04438]'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50'
              }`}
            >
              <FileText
                className={`w-6 h-6 mx-auto mb-1.5 ${format === 'txt' ? 'text-[#F04438]' : 'text-slate-500'}`}
              />
              <div className="font-bold text-xs text-slate-900">TXT</div>
              <div className="text-[10px] text-slate-500">Texto Plano</div>
            </div>
          </div>
        </div>

        {/* Filter Scope */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Filtro de Exportación
          </label>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`py-2 px-3 rounded-lg border font-medium transition-all cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Todos ({leads.length})
            </button>

            <button
              type="button"
              onClick={() => setFilterMode('verified_only')}
              className={`py-2 px-3 rounded-lg border font-medium transition-all cursor-pointer ${
                filterMode === 'verified_only'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Solo verificados
            </button>

            <button
              type="button"
              onClick={() => setFilterMode('with_phone')}
              className={`py-2 px-3 rounded-lg border font-medium transition-all cursor-pointer ${
                filterMode === 'with_phone'
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Con teléfono
            </button>
          </div>
        </div>

        {/* Fields Checkbox Grid */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Campos a incluir
            </label>
            <span className="text-[11px] text-slate-400">
              {Object.values(fields).filter(Boolean).length} columnas seleccionadas
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            {[
              { key: 'companyName', label: 'Empresa' },
              { key: 'email', label: 'Email' },
              { key: 'phone', label: 'Teléfono' },
              { key: 'whatsapp', label: 'WhatsApp' },
              { key: 'website', label: 'Website' },
              { key: 'city', label: 'Ciudad' },
              { key: 'country', label: 'País' },
              { key: 'category', label: 'Categoría' },
              { key: 'socials', label: 'Redes sociales' },
              { key: 'address', label: 'Dirección' },
              { key: 'postalCode', label: 'Código postal' }
            ].map((f) => {
              const isChecked = fields[f.key as keyof typeof fields];
              return (
                <div
                  key={f.key}
                  onClick={() => toggleField(f.key as keyof typeof fields)}
                  className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-red-50/50 border-red-200 text-slate-900 font-medium'
                      : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <span className="truncate">{f.label}</span>
                  {isChecked ? (
                    <CheckSquare className="w-3.5 h-3.5 text-[#F04438] flex-shrink-0 ml-1" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-slate-300 flex-shrink-0 ml-1" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleExport}
            className="px-6 py-2.5 bg-[#F04438] hover:bg-[#D92D20] text-white rounded-lg text-xs font-extrabold shadow-md shadow-[#F04438]/20 flex items-center space-x-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Descargar archivo .{format.toUpperCase()}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
