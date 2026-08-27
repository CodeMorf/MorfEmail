import React, { useState } from 'react';
import {
  Settings,
  Globe,
  Sliders,
  Cpu,
  Database,
  FolderOpen,
  CheckCircle2,
  Trash2,
  Download,
  Save,
  Moon,
  Sun,
  Monitor
} from 'lucide-react';

interface SettingsViewProps {
  addToast: (title: string, message?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ addToast }) => {
  const [language, setLanguage] = useState('Español');
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>('system');
  const [threads, setThreads] = useState(16);
  const [timeout, setTimeoutVal] = useState(15000);
  const [autoSave, setAutoSave] = useState(true);
  const [backgroundWork, setBackgroundWork] = useState(true);
  const [exportPath, setExportPath] = useState('C:\\Users\\John\\Documents\\CodeMorf\\Leads\\Exports');

  const handleSave = () => {
    addToast('Configuración guardada', 'Los parámetros del sistema se han actualizado correctamente.', 'success');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 overflow-y-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Configuración del Sistema</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ajustes generales, motor de extracción concurrente y almacenamiento local.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-5 py-2.5 bg-[#F04438] hover:bg-[#D92D20] text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-[#F04438]/20 flex items-center space-x-2 self-start sm:self-auto cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Guardar cambios</span>
        </button>
      </div>

      <div className="space-y-6">
        {/* General */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Globe className="w-4 h-4 text-[#F04438]" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">General</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Idioma de la interfaz</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-[#F04438]"
              >
                <option value="Español">🇪🇸 Español (Predeterminado)</option>
                <option value="English">🇺🇸 English</option>
                <option value="Italiano">🇮🇹 Italiano</option>
                <option value="Français">🇫🇷 Français</option>
                <option value="Português">🇧🇷 Português</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Notificaciones de Windows</label>
              <select className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-[#F04438]">
                <option>Activar sonidos y avisos al finalizar búsqueda</option>
                <option>Solo avisos visuales discretos</option>
                <option>Silenciar notificaciones</option>
              </select>
            </div>
          </div>
        </section>

        {/* Apariencia */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Sliders className="w-4 h-4 text-[#F04438]" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Apariencia</h2>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs">
            <button
              type="button"
              onClick={() => setTheme('system')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1.5 transition-all ${
                theme === 'system'
                  ? 'border-[#F04438] bg-red-50/40 text-slate-900 font-bold ring-1 ring-[#F04438]'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Monitor className="w-5 h-5 text-slate-500" />
              <span>Sistema Windows</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1.5 transition-all ${
                theme === 'light'
                  ? 'border-[#F04438] bg-red-50/40 text-slate-900 font-bold ring-1 ring-[#F04438]'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Sun className="w-5 h-5 text-amber-500" />
              <span>Tema Claro</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1.5 transition-all ${
                theme === 'dark'
                  ? 'border-[#F04438] bg-red-50/40 text-slate-900 font-bold ring-1 ring-[#F04438]'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Moon className="w-5 h-5 text-slate-700" />
              <span>Tema Oscuro</span>
            </button>
          </div>
        </section>

        {/* Motor */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Cpu className="w-4 h-4 text-[#F04438]" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Parámetros del Motor de Extracción
            </h2>
          </div>

          <div className="space-y-4 text-xs">
            {/* Concurrency Threads */}
            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Concurrencia de hilos (Threads paralelos)</span>
                <span className="font-mono text-[#F04438] font-bold">{threads} Hilos</span>
              </div>
              <input
                type="range"
                min="1"
                max="32"
                value={threads}
                onChange={(e) => setThreads(Number(e.target.value))}
                className="w-full accent-[#F04438] cursor-pointer"
              />
              <span className="text-[11px] text-slate-400">Recomendado para CPU actual: 16 hilos.</span>
            </div>

            {/* Timeout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Timeout de respuesta (ms)</label>
                <input
                  type="number"
                  value={timeout}
                  onChange={(e) => setTimeoutVal(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-medium focus:outline-none focus:border-[#F04438]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Velocidad del parser</label>
                <select className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-[#F04438]">
                  <option>Turbo (Máxima velocidad con proxy rotativo)</option>
                  <option>Equilibrado (Seguro contra bloqueos de IP)</option>
                  <option>Lento / Sigiloso</option>
                </select>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-2 pt-2">
              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSave}
                  onChange={(e) => setAutoSave(e.target.checked)}
                  className="accent-[#F04438] w-4 h-4 rounded"
                />
                <span className="text-slate-800 font-medium">Guardar automáticamente los leads encontrados cada 100 resultados</span>
              </label>

              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={backgroundWork}
                  onChange={(e) => setBackgroundWork(e.target.checked)}
                  className="accent-[#F04438] w-4 h-4 rounded"
                />
                <span className="text-slate-800 font-medium">Permitir ejecución continua en segundo plano al minimizar a la bandeja del sistema</span>
              </label>
            </div>
          </div>
        </section>

        {/* Datos y Almacenamiento Local */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Database className="w-4 h-4 text-[#F04438]" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Datos & Respaldo Local
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Carpeta de exportación predeterminada</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={exportPath}
                  onChange={(e) => setExportPath(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono focus:outline-none focus:border-[#F04438]"
                />
                <button
                  type="button"
                  onClick={() => addToast('Carpeta seleccionada', exportPath, 'info')}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-slate-700 font-semibold flex items-center space-x-1"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Explorar</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => addToast('Backup creado', 'Archivo CML-backup-2026.zip generado con éxito.', 'success')}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold flex items-center space-x-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Crear copia de seguridad (Backup)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm('¿Estás seguro de limpiar la caché local y el historial?')) {
                    addToast('Caché limpiada', 'La base local SQLite se ha compactado.', 'info');
                  }
                }}
                className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-bold flex items-center space-x-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpiar historial y caché</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
