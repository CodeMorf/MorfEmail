import React, { useState } from 'react';
import {
  X,
  Building,
  Mail,
  Phone,
  MessageCircle,
  Globe,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Bookmark,
  Copy,
  ExternalLink,
  Bot,
  Sparkles,
  Share2,
  FileText,
  Clock,
  ShieldCheck,
  Send
} from 'lucide-react';
import { Lead, LeadList } from '../types';

interface LeadDetailDrawerProps {
  lead: Lead | null;
  onClose: () => void;
  lists: LeadList[];
  onAddToList: (leadId: string, listId: string) => void;
  addToast: (title: string, message?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  openMorfAiWithPrompt?: (prompt: string) => void;
}

export const LeadDetailDrawer: React.FC<LeadDetailDrawerProps> = ({
  lead,
  onClose,
  lists,
  onAddToList,
  addToast,
  openMorfAiWithPrompt
}) => {
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [showColdPitch, setShowColdPitch] = useState(false);
  const [pitchText, setPitchText] = useState('');
  const [isGeneratingPitch, setIsGeneratingPitch] = useState(false);

  if (!lead) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    addToast(`${label} copiado`, text, 'success');
  };

  const handleGeneratePitch = () => {
    setIsGeneratingPitch(true);
    setShowColdPitch(true);
    setTimeout(() => {
      setPitchText(
        `Hola equipo de ${lead.companyName},\n\nEstuve revisando su presencia digital en ${lead.city} y me llamó la atención su enfoque en el sector ${lead.category}. Encontramos una oportunidad clave para aumentar su captación de clientes cualificados a través de automatizaciones B2B.\n\n¿Tendrían 5 minutos este jueves para una breve demo sin compromiso?\n\nSaludos cordiales,\nJhon D. — CodeMorf Growth`
      );
      setIsGeneratingPitch(false);
      addToast('Pitch generado con Morf AI', 'Mensaje de outreach listo para enviar.', 'success');
    }, 900);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-white shadow-2xl border-l border-slate-200 flex flex-col justify-between animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="p-5 border-b border-slate-200 bg-[#15171A] text-white flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs px-2 py-0.5 rounded bg-red-950/80 text-[#F04438] border border-red-800/40 font-bold uppercase">
              {lead.category}
            </span>
            <span className="text-xs text-slate-400 flex items-center">
              <span className="mr-1">{lead.flag}</span>
              <span>{lead.city}, {lead.country}</span>
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">{lead.companyName}</h2>
          <div className="flex items-center space-x-2 text-xs text-slate-400 pt-0.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Extraído: {lead.extractedAt}</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Drawer Body */}
      <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs text-slate-700">
        
        {/* Verification Status Card */}
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <span className="font-bold text-emerald-900 block text-xs">Email Verificado & Activo</span>
              <span className="text-[11px] text-emerald-700">Servidores MX saludables (Confianza: {lead.confidenceScore}%)</span>
            </div>
          </div>
          <span className="px-2 py-0.5 bg-emerald-600 text-white rounded font-mono font-bold text-[10px]">
            98% SCORE
          </span>
        </div>

        {/* Contact Information */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center justify-between">
            <span>Información de Contacto</span>
            <button
              onClick={() => copyToClipboard(`${lead.companyName} | ${lead.email} | ${lead.phone} | ${lead.website}`, 'Datos completos')}
              className="text-[#F04438] hover:underline font-semibold text-[11px] flex items-center space-x-1"
            >
              <Copy className="w-3 h-3" />
              <span>Copiar todo</span>
            </button>
          </h3>

          <div className="space-y-2">
            {/* Email */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2.5 truncate">
                <Mail className="w-4 h-4 text-[#F04438] flex-shrink-0" />
                <div className="truncate">
                  <span className="text-[10px] text-slate-400 block font-medium">Email Comercial</span>
                  <span className="font-semibold text-slate-900 text-xs truncate">{lead.email}</span>
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(lead.email, 'Email')}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded"
                title="Copiar email"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Phone */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2.5 truncate">
                <Phone className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Teléfono Directo</span>
                  <span className="font-semibold text-slate-900 text-xs font-mono">{lead.phone}</span>
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(lead.phone, 'Teléfono')}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded"
                title="Copiar teléfono"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* WhatsApp */}
            {lead.whatsapp && (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-2.5 truncate">
                  <MessageCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">WhatsApp Comercial</span>
                    <span className="font-semibold text-slate-900 text-xs font-mono">{lead.whatsapp}</span>
                  </div>
                </div>
                <a
                  href={`https://wa.me/${lead.whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold flex items-center space-x-1"
                >
                  <span>Chatear</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {/* Website */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2.5 truncate">
                <Globe className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <div className="truncate">
                  <span className="text-[10px] text-slate-400 block font-medium">Website Oficial</span>
                  <span className="font-semibold text-blue-600 text-xs truncate underline">{lead.website}</span>
                </div>
              </div>
              <a
                href={`https://${lead.website}`}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded"
                title="Abrir website"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Address */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-start space-x-2.5">
              <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Dirección & Código Postal</span>
                <span className="font-medium text-slate-800 text-xs">
                  {lead.address}, {lead.city}, {lead.postalCode}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Social Profiles */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            Redes Sociales
          </h3>
          <div className="flex flex-wrap gap-2">
            {lead.instagram && (
              <span className="px-3 py-1.5 rounded-lg bg-pink-50 border border-pink-200 text-pink-700 font-medium flex items-center space-x-1.5">
                <span>Instagram:</span>
                <strong className="font-semibold">{lead.instagram}</strong>
              </span>
            )}
            {lead.facebook && (
              <span className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-medium flex items-center space-x-1.5">
                <span>Facebook:</span>
                <strong className="font-semibold">{lead.facebook}</strong>
              </span>
            )}
            {lead.linkedin && (
              <span className="px-3 py-1.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 font-medium flex items-center space-x-1.5">
                <span>LinkedIn:</span>
                <strong className="font-semibold">{lead.linkedin}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Source metadata */}
        <div className="p-3 rounded-lg bg-slate-100/80 border border-slate-200 space-y-1">
          <div className="flex items-center space-x-1.5 text-slate-500 font-semibold text-[10px] uppercase">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
            <span>Fuente de Datos</span>
          </div>
          <p className="text-slate-700 text-xs font-medium">{lead.source}</p>
        </div>

        {/* Morf AI Cold Email Outreach Generator */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white space-y-3 shadow-sm border border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className="w-4 h-4 text-[#F04438]" />
              <span className="font-bold text-xs">Morf AI — Cold Outreach Pitch</span>
            </div>
            <span className="text-[9px] bg-[#F04438] text-white px-1.5 py-0.2 rounded font-bold uppercase">
              AI Copilot
            </span>
          </div>

          {!showColdPitch ? (
            <div>
              <p className="text-[11px] text-slate-300">
                Genera al instante un correo en frío altamente personalizado según el nicho y ubicación de esta empresa.
              </p>
              <button
                type="button"
                onClick={handleGeneratePitch}
                disabled={isGeneratingPitch}
                className="mt-2.5 w-full py-2 bg-[#F04438] hover:bg-[#D92D20] text-white rounded-lg font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isGeneratingPitch ? 'Generando con Morf AI...' : 'Generar propuesta personalizada'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <textarea
                value={pitchText}
                onChange={(e) => setPitchText(e.target.value)}
                rows={5}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs font-sans focus:outline-none focus:border-[#F04438]"
              />
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => copyToClipboard(pitchText, 'Pitch de outreach')}
                  className="px-3 py-1.5 bg-[#F04438] hover:bg-[#D92D20] text-white rounded font-bold text-xs flex items-center space-x-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copiar email</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowColdPitch(false)}
                  className="text-slate-400 hover:text-white text-[11px]"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Drawer Footer Actions */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
        <div className="flex-1 flex items-center space-x-2">
          <select
            value={selectedListId}
            onChange={(e) => {
              setSelectedListId(e.target.value);
              if (e.target.value) {
                onAddToList(lead.id, e.target.value);
                setSelectedListId('');
              }
            }}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-[#F04438]"
          >
            <option value="">➕ Guardar en Lista...</option>
            {lists.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} ({l.leadCount})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => copyToClipboard(`${lead.companyName} - ${lead.email} - ${lead.phone}`, 'Resumen')}
          className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs rounded-lg transition-all"
        >
          Copiar
        </button>
      </div>
    </div>
  );
};
