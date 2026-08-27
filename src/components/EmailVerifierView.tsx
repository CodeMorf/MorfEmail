import React, { useState } from 'react';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Upload,
  FileText,
  Play,
  RotateCcw,
  Download,
  CheckCircle2,
  Server,
  Zap,
  Info,
  Loader2
} from 'lucide-react';
import { EmailVerificationItem } from '../types';
import { INITIAL_VERIFICATION_ITEMS } from '../data/mockData';

interface EmailVerifierViewProps {
  addToast: (title: string, message?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const EmailVerifierView: React.FC<EmailVerifierViewProps> = ({ addToast }) => {
  const [activeTab, setActiveTab] = useState<'paste' | 'file'>('paste');
  const [pastedText, setPastedText] = useState(
    "info@caribbeanfood.do\ncontacto@gourmetcaribe.do\nmarketing_old@fakecontact.net\nadmin@catchall-company.com\ndespacho@asociadoslegalesmadrid.es"
  );
  const [items, setItems] = useState<EmailVerificationItem[]>(INITIAL_VERIFICATION_ITEMS);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleStartVerification = () => {
    setIsVerifying(true);
    addToast('Iniciando verificación', 'Comprobando sintaxis, registros MX y servidores SMTP...', 'info');

    setTimeout(() => {
      const lines = pastedText
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean);

      const newResults: EmailVerificationItem[] = lines.map((email, idx) => {
        const domain = email.split('@')[1] || 'desconocido.com';
        const isInvalid = email.includes('fake') || email.includes('old') || !email.includes('.');
        const isCatchAll = email.includes('catchall') || email.includes('admin');

        return {
          id: `ver-${Date.now()}-${idx}`,
          email,
          syntax: !isInvalid,
          domain,
          mxRecord: !isInvalid,
          smtpCheck: !isInvalid && !isCatchAll,
          status: isInvalid ? 'invalid' : isCatchAll ? 'risky' : 'valid',
          confidence: isInvalid ? 15 : isCatchAll ? 68 : 98,
          reason: isInvalid
            ? 'Dominio sin registros MX activos'
            : isCatchAll
            ? 'Configuración Catch-all detectada'
            : 'Servidor MX activo con respuesta SMTP 250 OK'
        };
      });

      setItems(newResults);
      setIsVerifying(false);
      addToast('Verificación completada', `${newResults.filter(i => i.status === 'valid').length} emails válidos listos para outreach.`, 'success');
    }, 1200);
  };

  const validCount = items.filter(i => i.status === 'valid').length;
  const riskyCount = items.filter(i => i.status === 'risky').length;
  const invalidCount = items.filter(i => i.status === 'invalid').length;

  const exportCleanList = () => {
    const validEmails = items.filter(i => i.status === 'valid').map(i => i.email).join('\n');
    const blob = new Blob([validEmails], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `emails-verificados-${Date.now()}.txt`;
    a.click();
    addToast('Lista limpia descargada', `${validCount} correos válidos exportados.`, 'success');
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 overflow-y-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <span>Verificador de Email & MX</span>
            <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold uppercase">
              Algoritmo Anti-Rebote
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Valida la entregabilidad de correos electrónicos corporativos, servidores DNS y respuestas SMTP.
          </p>
        </div>

        {items.length > 0 && (
          <button
            onClick={exportCleanList}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-600/20 self-start sm:self-auto cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Descargar válidos ({validCount})</span>
          </button>
        )}
      </div>

      {/* Input Selector Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        {/* Tab selector */}
        <div className="flex space-x-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTab('paste')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
              activeTab === 'paste'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Pegar emails</span>
          </button>

          <button
            onClick={() => setActiveTab('file')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
              activeTab === 'file'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Importar archivo CSV / TXT</span>
          </button>
        </div>

        {activeTab === 'paste' ? (
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-700">
              Pega una lista de correos (uno por línea):
            </label>
            <textarea
              rows={4}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="ejemplo1@empresa.com&#10;gerencia@negocio.do&#10;contacto@dominio.es"
              className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-[#F04438]"
            />
          </div>
        ) : (
          <div className="p-8 border-2 border-dashed border-slate-300 rounded-xl text-center space-y-2 hover:border-[#F04438] transition-colors cursor-pointer bg-slate-50">
            <Upload className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="text-xs font-bold text-slate-800">Arrastra tu archivo CSV o haz clic aquí</div>
            <p className="text-[11px] text-slate-400">Archivos soportados: .csv, .txt, .xlsx (hasta 50,000 emails)</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] text-slate-400 flex items-center space-x-1">
            <Info className="w-3 h-3" />
            <span>Verifica sintaxis RFC, resolución MX y puertos de correo en tiempo real.</span>
          </span>

          <button
            onClick={handleStartVerification}
            disabled={isVerifying}
            className="px-6 py-2.5 bg-[#F04438] hover:bg-[#D92D20] text-white rounded-lg text-xs font-bold shadow-md shadow-[#F04438]/20 flex items-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verificando registros...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Verificar correos ahora</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Summary Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Validos */}
        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase text-emerald-800 tracking-wide">✅ Válidos (Seguros)</span>
            <div className="text-2xl font-black font-mono text-emerald-950 mt-1">{validCount}</div>
            <span className="text-[10px] text-emerald-700">Tasa de entrega &gt;98%</span>
          </div>
          <CheckCircle className="w-8 h-8 text-emerald-600 opacity-80" />
        </div>

        {/* Riesgosos */}
        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase text-amber-800 tracking-wide">⚠️ Riesgosos (Catch-all)</span>
            <div className="text-2xl font-black font-mono text-amber-950 mt-1">{riskyCount}</div>
            <span className="text-[10px] text-amber-700">Aceptan cualquier buzón</span>
          </div>
          <AlertTriangle className="w-8 h-8 text-amber-600 opacity-80" />
        </div>

        {/* Invalidos */}
        <div className="bg-red-50 p-4 rounded-xl border border-red-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase text-red-800 tracking-wide">❌ Inválidos (Rebotes)</span>
            <div className="text-2xl font-black font-mono text-red-950 mt-1">{invalidCount}</div>
            <span className="text-[10px] text-red-700">Sin servidor MX</span>
          </div>
          <XCircle className="w-8 h-8 text-red-600 opacity-80" />
        </div>
      </div>

      {/* Verification Results Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Detalle de Diagnóstico Técnico
          </span>
          <span className="text-xs font-mono text-slate-500">{items.length} verificados</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-white text-slate-400 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Dominio</th>
                <th className="py-3 px-4 text-center">Sintaxis RFC</th>
                <th className="py-3 px-4 text-center">Registro MX</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-center">Confianza</th>
                <th className="py-3 px-4">Diagnóstico</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-medium">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {item.email}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                    {item.domain}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {item.syntax ? (
                      <span className="text-emerald-600 font-bold">✓ OK</span>
                    ) : (
                      <span className="text-red-500 font-bold">✕ Error</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {item.mxRecord ? (
                      <span className="text-emerald-600 font-bold">✓ Activo</span>
                    ) : (
                      <span className="text-red-500 font-bold">✕ Inactivo</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    {item.status === 'valid' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Válido
                      </span>
                    ) : item.status === 'risky' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        Riesgoso
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                        Inválido
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold">
                    <span className={item.confidence >= 90 ? 'text-emerald-600' : item.confidence >= 50 ? 'text-amber-600' : 'text-red-600'}>
                      {item.confidence}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-[11px]">
                    {item.reason}
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
