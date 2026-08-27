import React, { useState, useRef } from 'react';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Upload,
  FileText,
  Play,
  Pause,
  RotateCcw,
  Download,
  CheckCircle2,
  Server,
  Zap,
  Info,
  Loader2,
  FileSpreadsheet,
  Square
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { EmailVerificationItem } from '../types';
import { ValidationService } from '../services/validationService';
import { ValidationProgress } from '../../engine/validation/types';

interface EmailVerifierViewProps {
  addToast: (title: string, message?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const EmailVerifierView: React.FC<EmailVerifierViewProps> = ({ addToast }) => {
  const [activeTab, setActiveTab] = useState<'paste' | 'file'>('paste');
  const [pastedText, setPastedText] = useState(
    "ventas@google.com\ncontacto@microsoft.com\ninfo@mailinator.com\nadministracion@dominio-inexistente-xyz9912.org\nsoporte@apple.com"
  );
  const [items, setItems] = useState<EmailVerificationItem[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState<ValidationProgress | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isCancelledRef = useRef<boolean>(false);

  const handleStartVerification = async () => {
    const rawLines = pastedText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    // Extraer direcciones de correo limpias
    const emailsToVerify = rawLines
      .map(line => {
        const match = line.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        return match ? match[0] : line;
      })
      .filter(Boolean);

    if (emailsToVerify.length === 0) {
      addToast('Sin correos', 'Por favor ingresa o importa al menos un correo electrónico para verificar.', 'warning');
      return;
    }

    setIsVerifying(true);
    setIsPaused(false);
    isCancelledRef.current = false;
    setProgress({
      current: 0,
      total: emailsToVerify.length,
      percent: 0,
      currentEmail: emailsToVerify[0],
      stepLabel: 'Iniciando motor de validación DNS y sintaxis RFC...',
      validCount: 0,
      riskyCount: 0,
      invalidCount: 0,
      isPaused: false,
      isCancelled: false
    });

    addToast('Verificación iniciada', `Comprobando ${emailsToVerify.length} correos contra registros DNS raíz y RFC 5322...`, 'info');

    try {
      const verifiedResults = await ValidationService.verifyBatch(
        emailsToVerify,
        {
          dnsConcurrency: 15,
          timeoutMs: 6000,
          useCache: true
        },
        (prog) => {
          setProgress(prog);
        }
      );

      setItems(verifiedResults);
      setIsVerifying(false);
      setProgress(null);

      const validTotal = verifiedResults.filter(i => i.status === 'valid').length;
      const invalidTotal = verifiedResults.filter(i => i.status === 'invalid').length;
      const riskyTotal = verifiedResults.filter(i => i.status === 'risky').length;

      addToast(
        'Verificación completada',
        `Diagnóstico final: ${validTotal} válidos, ${riskyTotal} riesgosos, ${invalidTotal} inválidos.`,
        'success'
      );
    } catch (err: any) {
      setIsVerifying(false);
      setProgress(null);
      addToast('Error de verificación', err?.message || 'Ocurrió un problema durante el procesamiento de la lista', 'error');
    }
  };

  const handleCancelVerification = () => {
    isCancelledRef.current = true;
    setIsVerifying(false);
    setProgress(null);
    addToast('Verificación cancelada', 'El procesamiento de la cola ha sido detenido.', 'warning');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processUploadedFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    processUploadedFile(file);
  };

  const processUploadedFile = async (file: File) => {
    const fileName = file.name.toLowerCase();
    addToast('Leyendo archivo', `Procesando ${file.name}...`, 'info');

    try {
      let extractedEmails: string[] = [];

      if (fileName.endsWith('.txt') || fileName.endsWith('.csv') || fileName.endsWith('.tsv')) {
        const text = await file.text();
        if (fileName.endsWith('.txt')) {
          extractedEmails = text
            .split(/[\r\n]+/)
            .map(l => l.trim())
            .filter(l => l.includes('@'));
        } else {
          // Parse CSV / TSV con XLSX
          const workbook = XLSX.read(text, { type: 'string' });
          extractedEmails = extractEmailsFromWorkbook(workbook);
        }
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        extractedEmails = extractEmailsFromWorkbook(workbook);
      } else {
        addToast('Formato no soportado', 'Por favor sube un archivo .csv, .txt o .xlsx', 'warning');
        return;
      }

      // Deduplicar emails en la carga
      const uniqueEmails = Array.from(new Set(extractedEmails.map(e => e.trim().toLowerCase()))).filter(Boolean);

      if (uniqueEmails.length === 0) {
        addToast('Sin correos detectados', 'No se encontraron columnas ni formatos de correo en el archivo.', 'warning');
        return;
      }

      setPastedText(uniqueEmails.join('\n'));
      setActiveTab('paste');
      addToast('Archivo importado con éxito', `${uniqueEmails.length} correos electrónicos detectados y listos para verificar.`, 'success');
    } catch (err: any) {
      addToast('Error al importar archivo', err?.message || 'No se pudo leer el archivo.', 'error');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const extractEmailsFromWorkbook = (workbook: XLSX.WorkBook): string[] => {
    const emails: string[] = [];
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) return emails;

    const worksheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

    if (rows.length === 0) return emails;

    // 1. Detectar si existe una columna que contenga nombres típicos de email
    const firstRow = rows[0];
    const keys = Object.keys(firstRow);
    const emailKey = keys.find(k => /^(email|e-mail|correo|mail|electronic_mail|contact_email|business_email)$/i.test(k.trim()))
      || keys.find(k => /email|correo|mail/i.test(k.trim()));

    if (emailKey) {
      for (const row of rows) {
        const val = String(row[emailKey] || '').trim();
        if (val && val.includes('@')) {
          emails.push(val);
        }
      }
    } else {
      // 2. Si no hay encabezado obvio, escanear todos los campos buscando patrón de email
      const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
      for (const row of rows) {
        for (const key of keys) {
          const val = String(row[key] || '').trim();
          const match = val.match(emailPattern);
          if (match) {
            emails.push(match[0]);
            break;
          }
        }
      }
    }

    return emails;
  };

  const validCount = items.filter(i => i.status === 'valid').length;
  const riskyCount = items.filter(i => i.status === 'risky').length;
  const invalidCount = items.filter(i => i.status === 'invalid').length;

  const exportCleanList = () => {
    const validEmails = items.filter(i => i.status === 'valid').map(i => i.email).join('\n');
    const blob = new Blob([validEmails], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `emails-verificados-validos-${Date.now()}.txt`;
    a.click();
    addToast('Lista limpia descargada', `${validCount} correos válidos exportados en TXT.`, 'success');
  };

  const exportFullReportXlsx = () => {
    if (items.length === 0) {
      addToast('Sin datos para exportar', 'Verifica al menos un correo antes de generar el reporte.', 'warning');
      return;
    }

    const reportData = items.map(item => ({
      'Correo Electrónico': item.email,
      'Dominio': item.domain,
      'Sintaxis RFC 5322': item.syntax ? 'VÁLIDA' : 'INVÁLIDA',
      'Registros DNS MX': item.mxRecord ? 'ACTIVO' : 'INACTIVO / AUSENTE',
      'Servidores MX': item.mxRecords?.map(r => `${r.priority} ${r.exchange}`).join(', ') || 'N/A',
      'Estado Técnico': item.status.toUpperCase(),
      'Puntaje de Confianza': `${item.confidence}%`,
      'Diagnóstico / Causa': item.reason || '',
      'Proveedor Webmail': item.freeProvider ? 'SÍ' : 'NO (Corporativo)',
      'Temporal / Desechable': item.disposable ? 'SÍ' : 'NO',
      'Catch-All': item.catchAll ? 'DETECTADO' : 'NO',
      'Fecha Verificación': item.checkedAt || new Date().toISOString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(reportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Diagnóstico de Emails');

    XLSX.writeFile(workbook, `reporte-verificacion-morfemail-${Date.now()}.xlsx`);
    addToast('Reporte Excel generado', `${items.length} registros exportados con diagnóstico técnico completo.`, 'success');
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 overflow-y-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <span>Verificador de Email & MX</span>
            <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold uppercase">
              Algoritmo Anti-Rebote Real
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Valida la entregabilidad de correos corporativos consultando servidores DNS raíz, registros MX y sintaxis RFC 5322.
          </p>
        </div>

        {items.length > 0 && (
          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <button
              onClick={exportFullReportXlsx}
              className="flex items-center space-x-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Reporte Excel ({items.length})</span>
            </button>

            <button
              onClick={exportCleanList}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Descargar válidos ({validCount})</span>
            </button>
          </div>
        )}
      </div>

      {/* Input Selector Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        {/* Tab selector */}
        <div className="flex space-x-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTab('paste')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
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
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'file'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Importar archivo CSV / TXT / XLSX</span>
          </button>
        </div>

        {activeTab === 'paste' ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700">
                Pega una lista de correos (uno por línea o separados por comas):
              </label>
              <span className="text-[11px] font-mono text-slate-400">
                {pastedText.split('\n').filter(l => l.trim()).length} correos ingresados
              </span>
            </div>
            <textarea
              rows={4}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="ventas@google.com&#10;contacto@microsoft.com&#10;info@tuempresa.com"
              className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-[#F04438]"
            />
          </div>
        ) : (
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv,.txt,.xlsx,.xls,.tsv"
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="p-8 border-2 border-dashed border-slate-300 rounded-xl text-center space-y-2 hover:border-[#F04438] transition-colors cursor-pointer bg-slate-50"
            >
              <Upload className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="text-xs font-bold text-slate-800">
                Arrastra tu archivo CSV, TXT o XLSX o haz clic aquí para examinar
              </div>
              <p className="text-[11px] text-slate-400">
                Archivos soportados: .csv, .txt, .xlsx, .tsv (Detección automática de columnas de correo)
              </p>
            </div>
          </div>
        )}

        {/* Progress Bar if Verifying */}
        {isVerifying && progress && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-700 flex items-center space-x-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F04438]" />
                <span>{progress.stepLabel}</span>
              </span>
              <span className="font-mono text-slate-900">
                {progress.current} / {progress.total} ({progress.percent}%)
              </span>
            </div>

            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#F04438] h-full transition-all duration-200 rounded-full"
                style={{ width: `${progress.percent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span className="truncate max-w-[300px] font-mono">
                Evaluando: {progress.currentEmail}
              </span>
              <span className="space-x-2">
                <span className="text-emerald-700 font-bold">{progress.validCount} válidos</span>
                <span>•</span>
                <span className="text-amber-700 font-bold">{progress.riskyCount} riesgosos</span>
                <span>•</span>
                <span className="text-red-700 font-bold">{progress.invalidCount} inválidos</span>
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] text-slate-400 flex items-center space-x-1">
            <Info className="w-3 h-3" />
            <span>Verifica sintaxis RFC 5322, resolución DNS MX real, Null MX y dominios desechables.</span>
          </span>

          <div className="flex items-center space-x-2">
            {isVerifying && (
              <button
                onClick={handleCancelVerification}
                className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <Square className="w-3 h-3 text-red-600" />
                <span>Detener</span>
              </button>
            )}

            <button
              onClick={handleStartVerification}
              disabled={isVerifying}
              className="px-6 py-2.5 bg-[#F04438] hover:bg-[#D92D20] text-white rounded-lg text-xs font-bold shadow-md shadow-[#F04438]/20 flex items-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Consultando DNS raíz...</span>
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
      </div>

      {/* Summary Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Validos */}
        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase text-emerald-800 tracking-wide">✅ Válidos (Seguros)</span>
            <div className="text-2xl font-black font-mono text-emerald-950 mt-1">{validCount}</div>
            <span className="text-[10px] text-emerald-700">Sintaxis RFC & MX activos</span>
          </div>
          <CheckCircle className="w-8 h-8 text-emerald-600 opacity-80" />
        </div>

        {/* Riesgosos */}
        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase text-amber-800 tracking-wide">⚠️ Riesgosos (Catch-all / Webmail)</span>
            <div className="text-2xl font-black font-mono text-amber-950 mt-1">{riskyCount}</div>
            <span className="text-[10px] text-amber-700">Catch-all o genéricos</span>
          </div>
          <AlertTriangle className="w-8 h-8 text-amber-600 opacity-80" />
        </div>

        {/* Invalidos */}
        <div className="bg-red-50 p-4 rounded-xl border border-red-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase text-red-800 tracking-wide">❌ Inválidos (Rebotes)</span>
            <div className="text-2xl font-black font-mono text-red-950 mt-1">{invalidCount}</div>
            <span className="text-[10px] text-red-700">Sin MX, Null MX o fake</span>
          </div>
          <XCircle className="w-8 h-8 text-red-600 opacity-80" />
        </div>
      </div>

      {/* Verification Results Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Detalle de Diagnóstico Técnico Real
          </span>
          <span className="text-xs font-mono text-slate-500">{items.length} verificados</span>
        </div>

        {items.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="text-xs font-bold text-slate-700">No hay correos evaluados aún</div>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              Ingresa direcciones de correo arriba o importa tu archivo para consultar servidores DNS MX en vivo.
            </p>
          </div>
        ) : (
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
                      {item.domain || '-'}
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
                        <span
                          className="text-emerald-600 font-bold cursor-help"
                          title={item.mxRecords?.map(r => `${r.priority} ${r.exchange}`).join('\n') || 'Registros MX activos'}
                        >
                          ✓ Activo ({item.mxRecords?.length || 1})
                        </span>
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
                      ) : item.status === 'unknown' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                          Desconocido
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                          Inválido
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold">
                      <span className={item.confidence >= 80 ? 'text-emerald-600' : item.confidence >= 50 ? 'text-amber-600' : 'text-red-600'}>
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
        )}
      </div>
    </div>
  );
};
