import React, { useState } from 'react';
import {
  Copy,
  Trash2,
  CheckCircle2,
  Layers,
  Search,
  ArrowRight,
  ShieldCheck,
  Building,
  Mail,
  Phone,
  Sparkles
} from 'lucide-react';
import { Lead } from '../types';

interface DuplicatesViewProps {
  leads: Lead[];
  addToast: (title: string, message?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const DuplicatesView: React.FC<DuplicatesViewProps> = ({ leads, addToast }) => {
  const [matchCriteria, setMatchCriteria] = useState<'email' | 'phone' | 'domain'>('email');
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(true);

  const duplicateGroups = [
    {
      key: 'Dominio: caribbeanfood.do',
      items: [
        {
          id: 'dup-1',
          name: 'Caribbean Food SRL',
          email: 'info@caribbeanfood.do',
          phone: '+1 809 555 0192',
          city: 'Distrito Nacional',
          date: '2026-08-26 14:22',
          isPrimary: true
        },
        {
          id: 'dup-2',
          name: 'Caribbean Food Piantini',
          email: 'ventas@caribbeanfood.do',
          phone: '+1 809 555 0192',
          city: 'Santo Domingo',
          date: '2026-08-24 10:15',
          isPrimary: false
        }
      ]
    },
    {
      key: 'Teléfono: +1 809 567 4410',
      items: [
        {
          id: 'dup-3',
          name: 'Gourmet del Caribe Group',
          email: 'contacto@gourmetcaribe.do',
          phone: '+1 809 567 4410',
          city: 'Bella Vista',
          date: '2026-08-26 14:22',
          isPrimary: true
        },
        {
          id: 'dup-4',
          name: 'Gourmet Caribe Eventos',
          email: 'eventos@gourmetcaribe.do',
          phone: '+1 809 567 4410',
          city: 'Santo Domingo',
          date: '2026-08-23 16:40',
          isPrimary: false
        }
      ]
    }
  ];

  const handleMergeAll = () => {
    addToast('Duplicados fusionados', 'Se consolidaron 2 grupos de contactos manteniendo el registro más reciente.', 'success');
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 overflow-y-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Limpieza de Duplicados</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Detecta y fusiona automáticamente leads duplicados por correo, teléfono directo o dominio web.
          </p>
        </div>

        <button
          onClick={handleMergeAll}
          className="px-5 py-2.5 bg-[#F04438] hover:bg-[#D92D20] text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-[#F04438]/20 flex items-center space-x-2 cursor-pointer self-start sm:self-auto"
        >
          <Layers className="w-4 h-4" />
          <span>Fusionar y limpiar todo (2)</span>
        </button>
      </div>

      {/* Control Selector */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3 text-xs">
          <span className="font-bold text-slate-700 uppercase tracking-wider">Criterio de Coincidencia:</span>
          <div className="flex space-x-1.5">
            <button
              onClick={() => setMatchCriteria('email')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                matchCriteria === 'email' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Email comercial
            </button>
            <button
              onClick={() => setMatchCriteria('phone')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                matchCriteria === 'phone' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Teléfono / WhatsApp
            </button>
            <button
              onClick={() => setMatchCriteria('domain')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                matchCriteria === 'domain' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Dominio Web
            </button>
          </div>
        </div>

        <span className="text-xs text-slate-400 font-medium">
          4 posibles duplicados encontrados en 4,192 registros
        </span>
      </div>

      {/* Duplicates list */}
      <div className="space-y-4">
        {duplicateGroups.map((group, gIdx) => (
          <div key={gIdx} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center space-x-2">
                <Copy className="w-3.5 h-3.5 text-[#F04438]" />
                <span>{group.key}</span>
              </span>
              <button
                onClick={() => addToast('Grupo consolidado', group.key, 'success')}
                className="text-[#F04438] hover:underline font-bold text-[11px]"
              >
                Fusionar en registro principal
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {group.items.map((item) => (
                <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                      <Building className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900">{item.name}</span>
                        {item.isPrimary && (
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                            Principal
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-3 text-slate-500 text-[11px] mt-0.5 font-mono">
                        <span>{item.email}</span>
                        <span>•</span>
                        <span>{item.phone}</span>
                        <span>•</span>
                        <span>{item.city}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                    <span>{item.date}</span>
                    <button
                      onClick={() => addToast('Registro descartado', undefined, 'info')}
                      className="p-1 text-slate-400 hover:text-red-500 rounded"
                      title="Eliminar este duplicado"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
