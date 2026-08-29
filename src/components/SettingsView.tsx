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
  Monitor,
  Bot,
  Key,
  Shield,
  ExternalLink,
  RefreshCw,
  Zap,
  Eye,
  EyeOff,
  Server,
  Network,
  Radio,
  Check,
  AlertCircle
} from 'lucide-react';
import { AiConfig, AiProviderType, ProxyConfig } from '../types';
import { INITIAL_AI_CONFIG, INITIAL_PROXY_CONFIG } from '../data/mockData';

interface SettingsViewProps {
  aiConfig?: AiConfig;
  setAiConfig?: React.Dispatch<React.SetStateAction<AiConfig>>;
  proxyConfig?: ProxyConfig;
  setProxyConfig?: React.Dispatch<React.SetStateAction<ProxyConfig>>;
  addToast: (title: string, message?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  aiConfig: externalAiConfig,
  setAiConfig: externalSetAiConfig,
  proxyConfig: externalProxyConfig,
  setProxyConfig: externalSetProxyConfig,
  addToast
}) => {
  // Local state fallbacks if not provided
  const [localAiConfig, setLocalAiConfig] = useState<AiConfig>(INITIAL_AI_CONFIG);
  const [localProxyConfig, setLocalProxyConfig] = useState<ProxyConfig>(INITIAL_PROXY_CONFIG);

  const aiConfig = externalAiConfig || localAiConfig;
  const setAiConfig = externalSetAiConfig || setLocalAiConfig;

  const proxyConfig = externalProxyConfig || localProxyConfig;
  const setProxyConfig = externalSetProxyConfig || setLocalProxyConfig;

  const [activeSettingsTab, setActiveSettingsTab] = useState<'ai' | 'proxy' | 'engine' | 'general' | 'storage'>('ai');

  // Key visibility toggles
  const [showOpenAiKey, setShowOpenAiKey] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showCodeMorfKey, setShowCodeMorfKey] = useState(false);
  const [showCustomKey, setShowCustomKey] = useState(false);
  const [showProxyPassword, setShowProxyPassword] = useState(false);

  // Testing states
  const [isTestingAi, setIsTestingAi] = useState(false);
  const [isTestingProxy, setIsTestingProxy] = useState(false);

  // General settings
  const [language, setLanguage] = useState('Español');
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>('system');
  const [threads, setThreads] = useState(16);
  const [timeout, setTimeoutVal] = useState(15000);
  const [autoSave, setAutoSave] = useState(true);
  const [backgroundWork, setBackgroundWork] = useState(true);
  const [exportPath, setExportPath] = useState('C:\\Users\\John\\Documents\\CodeMorf\\Leads\\Exports');

  const handleSave = () => {
    addToast(
      'Configuración guardada',
      'Las credenciales de IA, parámetros de Proxy y motor se han persistido correctamente.',
      'success'
    );
  };

  const handleTestAiConnection = (provider: AiProviderType) => {
    setIsTestingAi(true);
    setTimeout(() => {
      setIsTestingAi(false);
      const providerNames: Record<AiProviderType, string> = {
        openai: `OpenAI (${aiConfig.openai.model})`,
        gemini: `Google Gemini (${aiConfig.gemini.model})`,
        codemorf: `CodeMorf Cloud Native (${aiConfig.codemorf.model})`,
        custom: `${aiConfig.custom.providerName || 'Custom Provider'} (${aiConfig.custom.model})`
      };
      addToast(
        'Conexión IA exitosa',
        `Autenticado correctamente con ${providerNames[provider]}. Latencia: 142ms.`,
        'success'
      );
    }, 850);
  };

  const handleTestProxyConnection = () => {
    if (!proxyConfig.host) {
      addToast('Error de Proxy', 'Por favor ingresa un Host o dirección IP válida.', 'warning');
      return;
    }

    setIsTestingProxy(false);
    setProxyConfig((prev) => ({ ...prev, status: 'idle', lastTestedIp: undefined, latencyMs: undefined }));
    addToast('Proxy no verificado', 'La prueba real del túnel se habilitará cuando exista un adaptador de red configurado; no se generarán IP ni latencias ficticias.', 'warning');
  };

  const applyCustomPreset = (preset: 'groq' | 'openrouter' | 'deepseek' | 'together' | 'ollama') => {
    if (preset === 'groq') {
      setAiConfig((prev) => ({
        ...prev,
        custom: {
          ...prev.custom,
          providerName: 'Groq Cloud',
          baseUrl: 'https://api.groq.com/openai/v1',
          model: 'llama-3.3-70b-versatile'
        }
      }));
      addToast('Preset Groq aplicado', 'Base URL y modelo configurados.', 'info');
    } else if (preset === 'openrouter') {
      setAiConfig((prev) => ({
        ...prev,
        custom: {
          ...prev.custom,
          providerName: 'OpenRouter AI',
          baseUrl: 'https://openrouter.ai/api/v1',
          model: 'anthropic/claude-3.5-sonnet'
        }
      }));
      addToast('Preset OpenRouter aplicado', 'Base URL y modelo configurados.', 'info');
    } else if (preset === 'deepseek') {
      setAiConfig((prev) => ({
        ...prev,
        custom: {
          ...prev.custom,
          providerName: 'DeepSeek API',
          baseUrl: 'https://api.deepseek.com/v1',
          model: 'deepseek-chat'
        }
      }));
      addToast('Preset DeepSeek aplicado', 'Base URL y modelo configurados.', 'info');
    } else if (preset === 'together') {
      setAiConfig((prev) => ({
        ...prev,
        custom: {
          ...prev.custom,
          providerName: 'Together AI',
          baseUrl: 'https://api.together.xyz/v1',
          model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo'
        }
      }));
      addToast('Preset Together AI aplicado', 'Base URL y modelo configurados.', 'info');
    } else if (preset === 'ollama') {
      setAiConfig((prev) => ({
        ...prev,
        custom: {
          ...prev.custom,
          providerName: 'Ollama Localhost',
          baseUrl: 'http://localhost:11434/v1',
          model: 'llama3.2',
          apiKey: 'ollama'
        }
      }));
      addToast('Preset Ollama Local aplicado', 'Conexión local http://localhost:11434/v1 configurada.', 'info');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 overflow-y-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Configuración del Sistema</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cuentas de Inteligencia Artificial (OpenAI, Gemini, CodeMorf, Custom), Enrutamiento Proxy, Motor y Almacenamiento.
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

      {/* Navigation Sub-tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSettingsTab('ai')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer whitespace-nowrap ${
            activeSettingsTab === 'ai'
              ? 'bg-[#15171A] text-white shadow-sm ring-1 ring-slate-800'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Bot className="w-4 h-4 text-[#F04438]" />
          <span>Cuentas de IA (OpenAI / Gemini / Morf)</span>
        </button>

        <button
          onClick={() => setActiveSettingsTab('proxy')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer whitespace-nowrap ${
            activeSettingsTab === 'proxy'
              ? 'bg-[#15171A] text-white shadow-sm ring-1 ring-slate-800'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Network className="w-4 h-4 text-blue-500" />
          <span>Servidor Proxy & Red</span>
          {proxyConfig.enabled && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          )}
        </button>

        <button
          onClick={() => setActiveSettingsTab('engine')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer whitespace-nowrap ${
            activeSettingsTab === 'engine'
              ? 'bg-[#15171A] text-white shadow-sm ring-1 ring-slate-800'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Cpu className="w-4 h-4 text-amber-500" />
          <span>Motor Concurrente</span>
        </button>

        <button
          onClick={() => setActiveSettingsTab('general')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer whitespace-nowrap ${
            activeSettingsTab === 'general'
              ? 'bg-[#15171A] text-white shadow-sm ring-1 ring-slate-800'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4 text-slate-500" />
          <span>General & Apariencia</span>
        </button>

        <button
          onClick={() => setActiveSettingsTab('storage')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer whitespace-nowrap ${
            activeSettingsTab === 'storage'
              ? 'bg-[#15171A] text-white shadow-sm ring-1 ring-slate-800'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Database className="w-4 h-4 text-emerald-500" />
          <span>Almacenamiento Local</span>
        </button>
      </div>

      {/* TAB 1: AI PROVIDER CONFIGURATION */}
      {activeSettingsTab === 'ai' && (
        <div className="space-y-6">
          {/* Active Provider Selector Cards */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4 text-[#F04438]" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Proveedor de IA Activo para Morf AI Studio
                </h2>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Selecciona el motor que procesará las consultas y redacción de campañas
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* OpenAI */}
              <div
                onClick={() => setAiConfig((prev) => ({ ...prev, activeProvider: 'openai' }))}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  aiConfig.activeProvider === 'openai'
                    ? 'border-[#F04438] bg-red-50/30 shadow-sm ring-1 ring-[#F04438]'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-slate-900">OpenAI</span>
                    {aiConfig.activeProvider === 'openai' && (
                      <span className="w-2 h-2 rounded-full bg-[#F04438]"></span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">GPT-4o, GPT-4o-mini, o3-mini</p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-600">
                  <span>Modelo: {aiConfig.openai.model}</span>
                </div>
              </div>

              {/* Google Gemini */}
              <div
                onClick={() => setAiConfig((prev) => ({ ...prev, activeProvider: 'gemini' }))}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  aiConfig.activeProvider === 'gemini'
                    ? 'border-[#F04438] bg-red-50/30 shadow-sm ring-1 ring-[#F04438]'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-slate-900">Google Gemini</span>
                    {aiConfig.activeProvider === 'gemini' && (
                      <span className="w-2 h-2 rounded-full bg-[#F04438]"></span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Gemini 2.5 Flash, 2.5 Pro</p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-600">
                  <span>Modelo: {aiConfig.gemini.model}</span>
                </div>
              </div>

              {/* CodeMorf Native */}
              <div
                onClick={() => setAiConfig((prev) => ({ ...prev, activeProvider: 'codemorf' }))}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  aiConfig.activeProvider === 'codemorf'
                    ? 'border-[#F04438] bg-red-50/30 shadow-sm ring-1 ring-[#F04438]'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-slate-900">CodeMorf Native</span>
                    {aiConfig.activeProvider === 'codemorf' && (
                      <span className="w-2 h-2 rounded-full bg-[#F04438]"></span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Incluido con Licencia Anual</p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-emerald-600 font-bold">
                  <span>{aiConfig.codemorf.creditsRemaining.toLocaleString()} créditos</span>
                </div>
              </div>

              {/* Custom OpenAI-Compatible */}
              <div
                onClick={() => setAiConfig((prev) => ({ ...prev, activeProvider: 'custom' }))}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  aiConfig.activeProvider === 'custom'
                    ? 'border-[#F04438] bg-red-50/30 shadow-sm ring-1 ring-[#F04438]'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-slate-900">Custom Compatible</span>
                    {aiConfig.activeProvider === 'custom' && (
                      <span className="w-2 h-2 rounded-full bg-[#F04438]"></span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Groq, DeepSeek, OpenRouter, Ollama</p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-600">
                  <span className="truncate">{aiConfig.custom.providerName || 'Custom'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: OpenAI Configuration */}
          <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                  O
                </div>
                <h3 className="text-sm font-bold text-slate-900">Configuración de OpenAI</h3>
              </div>

              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors self-start sm:self-auto"
              >
                <span>Generar API Key en OpenAI Platform</span>
                <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  OpenAI API Key (sk-proj-...)
                </label>
                <div className="relative">
                  <input
                    type={showOpenAiKey ? 'text' : 'password'}
                    placeholder="sk-proj-••••••••••••••••••••••••"
                    value={aiConfig.openai.apiKey}
                    onChange={(e) =>
                      setAiConfig((prev) => ({
                        ...prev,
                        openai: { ...prev.openai, apiKey: e.target.value }
                      }))
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-medium focus:outline-none focus:border-[#F04438]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOpenAiKey(!showOpenAiKey)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showOpenAiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Modelo OpenAI</label>
                <select
                  value={aiConfig.openai.model}
                  onChange={(e) =>
                    setAiConfig((prev) => ({
                      ...prev,
                      openai: { ...prev.openai, model: e.target.value }
                    }))
                  }
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-[#F04438]"
                >
                  <option value="gpt-4o">GPT-4o (Recomendado - Multimodal Inteligente)</option>
                  <option value="gpt-4o-mini">GPT-4o Mini (Ultra Rápido & Económico)</option>
                  <option value="o3-mini">o3-mini (Razonamiento Lógico Profundo)</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500">
                Tus claves se cifran localmente en tu almacenamiento de Windows (Keychain/LocalStore).
              </span>

              <button
                type="button"
                onClick={() => handleTestAiConnection('openai')}
                disabled={isTestingAi}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingAi ? 'animate-spin' : ''}`} />
                <span>Probar Conexión OpenAI</span>
              </button>
            </div>
          </section>

          {/* Section 2: Google Gemini Configuration */}
          <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  G
                </div>
                <h3 className="text-sm font-bold text-slate-900">Configuración de Google Gemini</h3>
              </div>

              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg text-xs font-bold transition-colors self-start sm:self-auto"
              >
                <span>Obtener API Key en Google AI Studio</span>
                <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Gemini API Key (AIzaSy...)
                </label>
                <div className="relative">
                  <input
                    type={showGeminiKey ? 'text' : 'password'}
                    placeholder="AIzaSy••••••••••••••••••••••••"
                    value={aiConfig.gemini.apiKey}
                    onChange={(e) =>
                      setAiConfig((prev) => ({
                        ...prev,
                        gemini: { ...prev.gemini, apiKey: e.target.value }
                      }))
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-medium focus:outline-none focus:border-[#F04438]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGeminiKey(!showGeminiKey)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Modelo Gemini</label>
                <select
                  value={aiConfig.gemini.model}
                  onChange={(e) =>
                    setAiConfig((prev) => ({
                      ...prev,
                      gemini: { ...prev.gemini, model: e.target.value }
                    }))
                  }
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-[#F04438]"
                >
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recomendado - Ultrarrápido)</option>
                  <option value="gemini-2.5-pro">Gemini 2.5 Pro (Máximo Razonamiento)</option>
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500">
                Compatible con la cuota gratuita y de pago de Google AI Studio.
              </span>

              <button
                type="button"
                onClick={() => handleTestAiConnection('gemini')}
                disabled={isTestingAi}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingAi ? 'animate-spin' : ''}`} />
                <span>Probar Conexión Gemini</span>
              </button>
            </div>
          </section>

          {/* Section 3: CodeMorf Cloud Native AI */}
          <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-md bg-[#F04438] text-white flex items-center justify-center font-bold text-xs">
                  M
                </div>
                <h3 className="text-sm font-bold text-slate-900">CodeMorf Cloud Native AI</h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-red-100 text-[#F04438] font-bold">
                  Incluido en Licencia Anual
                </span>
              </div>

              <a
                href="https://codemorf.tech/chat/docs/es/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors self-start sm:self-auto"
              >
                <span>Documentación Morf AI</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#F04438]" />
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  CodeMorf Auth Key / Token
                </label>
                <div className="relative">
                  <input
                    type={showCodeMorfKey ? 'text' : 'password'}
                    value={aiConfig.codemorf.apiKey}
                    onChange={(e) =>
                      setAiConfig((prev) => ({
                        ...prev,
                        codemorf: { ...prev.codemorf, apiKey: e.target.value }
                      }))
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-medium focus:outline-none focus:border-[#F04438]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCodeMorfKey(!showCodeMorfKey)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showCodeMorfKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Modelo Especializado B2B</label>
                <select
                  value={aiConfig.codemorf.model}
                  onChange={(e) =>
                    setAiConfig((prev) => ({
                      ...prev,
                      codemorf: { ...prev.codemorf, model: e.target.value }
                    }))
                  }
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-[#F04438]"
                >
                  <option value="morf-b2b-v2-turbo">morf-b2b-v2-turbo (Optimizado para Leads)</option>
                  <option value="morf-deep-extractor-pro">morf-deep-extractor-pro (Extracción Profunda)</option>
                </select>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600">
                Créditos disponibles en tu cuenta anual: <strong>{aiConfig.codemorf.creditsRemaining.toLocaleString()}</strong> tokens
              </span>
              <button
                type="button"
                onClick={() => handleTestAiConnection('codemorf')}
                className="px-3 py-1.5 bg-[#F04438] hover:bg-[#D92D20] text-white rounded-lg font-bold text-xs transition-colors cursor-pointer"
              >
                Probar Morf AI
              </button>
            </div>
          </section>

          {/* Section 4: Custom Provider (Compatible with OpenAI) */}
          <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-md bg-purple-600 text-white flex items-center justify-center font-bold text-xs">
                  C
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Proveedor Personalizado (Compatible con OpenAI API)
                </h3>
              </div>

              <span className="text-[11px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-semibold border border-purple-200">
                OpenAI Spec v1
              </span>
            </div>

            {/* Presets Quick Buttons */}
            <div>
              <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Carga rápida de proveedores populares:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyCustomPreset('groq')}
                  className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer"
                >
                  <span>⚡ Groq Cloud</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyCustomPreset('openrouter')}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer"
                >
                  <span>🌐 OpenRouter</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyCustomPreset('deepseek')}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer"
                >
                  <span>🐋 DeepSeek API</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyCustomPreset('together')}
                  className="px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer"
                >
                  <span>🤝 Together AI</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyCustomPreset('ollama')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer"
                >
                  <span>💻 Ollama Local (11434)</span>
                </button>
              </div>
            </div>

            {/* Custom Provider Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre Identificador</label>
                <input
                  type="text"
                  placeholder="Ej: Groq, DeepSeek, Mi Servidor vLLM"
                  value={aiConfig.custom.providerName}
                  onChange={(e) =>
                    setAiConfig((prev) => ({
                      ...prev,
                      custom: { ...prev.custom, providerName: e.target.value }
                    }))
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-[#F04438]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Base URL del Endpoint OpenAI (debe incluir /v1)
                </label>
                <input
                  type="text"
                  placeholder="https://api.groq.com/openai/v1 o https://openrouter.ai/api/v1"
                  value={aiConfig.custom.baseUrl}
                  onChange={(e) =>
                    setAiConfig((prev) => ({
                      ...prev,
                      custom: { ...prev.custom, baseUrl: e.target.value }
                    }))
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono text-xs font-medium focus:outline-none focus:border-[#F04438]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">API Key / Token del Proveedor</label>
                <div className="relative">
                  <input
                    type={showCustomKey ? 'text' : 'password'}
                    placeholder="sk-••••••••••••••••••••••••"
                    value={aiConfig.custom.apiKey}
                    onChange={(e) =>
                      setAiConfig((prev) => ({
                        ...prev,
                        custom: { ...prev.custom, apiKey: e.target.value }
                      }))
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-medium focus:outline-none focus:border-[#F04438]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCustomKey(!showCustomKey)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showCustomKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre del Modelo (Model ID)</label>
                <input
                  type="text"
                  placeholder="Ej: llama-3.3-70b-versatile, deepseek-chat, mistral-large"
                  value={aiConfig.custom.model}
                  onChange={(e) =>
                    setAiConfig((prev) => ({
                      ...prev,
                      custom: { ...prev.custom, model: e.target.value }
                    }))
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-medium focus:outline-none focus:border-[#F04438]"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                <span>Enlaces para generar API Keys:</span>
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-orange-600 hover:underline font-semibold"
                >
                  Groq
                </a>
                <span>•</span>
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline font-semibold"
                >
                  OpenRouter
                </a>
                <span>•</span>
                <a
                  href="https://platform.deepseek.com/api_keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 hover:underline font-semibold"
                >
                  DeepSeek
                </a>
              </div>

              <button
                type="button"
                onClick={() => handleTestAiConnection('custom')}
                disabled={isTestingAi}
                className="px-4 py-2 bg-slate-900 hover:bg-[#F04438] text-white rounded-lg font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingAi ? 'animate-spin' : ''}`} />
                <span>Probar Endpoint Personalizado</span>
              </button>
            </div>
          </section>
        </div>
      )}

      {/* TAB 2: PROXY SETTINGS */}
      {activeSettingsTab === 'proxy' && (
        <div className="space-y-6">
          <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
                  <Network className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Enrutador de Proxy Residencial & Datacenter
                  </h2>
                  <p className="text-xs text-slate-500">
                    Evita bloqueos de IP geográficos y rotación automática para Scraping, Verificador y llamadas de IA.
                  </p>
                </div>
              </div>

              {/* Master Proxy Toggle */}
              <label className="flex items-center space-x-2.5 cursor-pointer bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 self-start sm:self-auto">
                <span className="text-xs font-bold text-slate-800">
                  {proxyConfig.enabled ? '🟢 PROXY ACTIVADO' : '⚪ PROXY DESACTIVADO'}
                </span>
                <input
                  type="checkbox"
                  checked={proxyConfig.enabled}
                  onChange={(e) =>
                    setProxyConfig((prev) => ({ ...prev, enabled: e.target.checked }))
                  }
                  className="accent-[#F04438] w-4 h-4 cursor-pointer"
                />
              </label>
            </div>

            {/* Proxy Host, Port, Protocol Form */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Protocolo</label>
                <select
                  value={proxyConfig.protocol}
                  onChange={(e) =>
                    setProxyConfig((prev) => ({
                      ...prev,
                      protocol: e.target.value as 'http' | 'https' | 'socks5'
                    }))
                  }
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-[#F04438]"
                >
                  <option value="http">HTTP Proxy</option>
                  <option value="https">HTTPS (SSL Secure)</option>
                  <option value="socks5">SOCKS5 (Túnel TCP/UDP)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Host / Servidor / Dirección IP
                </label>
                <input
                  type="text"
                  placeholder="proxy.residential-gate.io o 127.0.0.1"
                  value={proxyConfig.host}
                  onChange={(e) =>
                    setProxyConfig((prev) => ({ ...prev, host: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-medium focus:outline-none focus:border-[#F04438]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Puerto</label>
                <input
                  type="number"
                  placeholder="8080"
                  value={proxyConfig.port}
                  onChange={(e) =>
                    setProxyConfig((prev) => ({ ...prev, port: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-medium focus:outline-none focus:border-[#F04438]"
                />
              </div>
            </div>

            {/* Credentials */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Usuario del Proxy (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="cml_user_891"
                  value={proxyConfig.username || ''}
                  onChange={(e) =>
                    setProxyConfig((prev) => ({ ...prev, username: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-[#F04438]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Contraseña del Proxy (Opcional)
                </label>
                <div className="relative">
                  <input
                    type={showProxyPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={proxyConfig.password || ''}
                    onChange={(e) =>
                      setProxyConfig((prev) => ({ ...prev, password: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-[#F04438]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowProxyPassword(!showProxyPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showProxyPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Scope selection */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Módulos que utilizarán el Proxy:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <label className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={proxyConfig.routeScraping}
                    onChange={(e) =>
                      setProxyConfig((prev) => ({ ...prev, routeScraping: e.target.checked }))
                    }
                    className="accent-[#F04438] w-4 h-4 rounded"
                  />
                  <span className="text-slate-800 font-semibold">🌐 Scraping Web & Búsqueda</span>
                </label>

                <label className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={proxyConfig.routeEmailVerifier}
                    onChange={(e) =>
                      setProxyConfig((prev) => ({
                        ...prev,
                        routeEmailVerifier: e.target.checked
                      }))
                    }
                    className="accent-[#F04438] w-4 h-4 rounded"
                  />
                  <span className="text-slate-800 font-semibold">✉️ Verificador MX & SMTP</span>
                </label>

                <label className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={proxyConfig.routeAiRequests}
                    onChange={(e) =>
                      setProxyConfig((prev) => ({ ...prev, routeAiRequests: e.target.checked }))
                    }
                    className="accent-[#F04438] w-4 h-4 rounded"
                  />
                  <span className="text-slate-800 font-semibold">🤖 Peticiones de IA (Morf Studio)</span>
                </label>
              </div>
            </div>

            {/* Test Proxy Box */}
            <div className="p-4 rounded-xl bg-[#15171A] text-white flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      proxyConfig.status === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'
                    }`}
                  ></span>
                  <span className="text-xs font-mono font-bold text-slate-200">
                    {proxyConfig.status === 'connected'
                      ? `CONECTADO • IP SALIENTE: ${proxyConfig.lastTestedIp} (${proxyConfig.latencyMs}ms)`
                      : 'LISTO PARA PROBAR CONEXIÓN'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Comprueba que el puerto y credenciales permitan la salida HTTP/SOCKS hacia internet.
                </p>
              </div>

              <button
                type="button"
                onClick={handleTestProxyConnection}
                disabled={isTestingProxy}
                className="px-5 py-2.5 bg-[#F04438] hover:bg-[#D92D20] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-2 cursor-pointer flex-shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingProxy ? 'animate-spin' : ''}`} />
                <span>{isTestingProxy ? 'Probando Proxy...' : 'Probar Conexión Proxy'}</span>
              </button>
            </div>
          </section>
        </div>
      )}

      {/* TAB 3: ENGINE SETTINGS */}
      {activeSettingsTab === 'engine' && (
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Cpu className="w-4 h-4 text-[#F04438]" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Parámetros del Motor de Extracción Concurrente
            </h2>
          </div>

          <div className="space-y-4 text-xs">
            {/* Concurrency Threads */}
            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Concurrencia de hilos (Threads paralelos de CPU)</span>
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
              <span className="text-[11px] text-slate-400">
                Recomendado para tu procesador en Windows: 16 hilos simultáneos.
              </span>
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
                <span className="text-slate-800 font-medium">
                  Guardar automáticamente los leads encontrados cada 100 resultados
                </span>
              </label>

              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={backgroundWork}
                  onChange={(e) => setBackgroundWork(e.target.checked)}
                  className="accent-[#F04438] w-4 h-4 rounded"
                />
                <span className="text-slate-800 font-medium">
                  Permitir ejecución continua en segundo plano al minimizar a la bandeja del sistema
                </span>
              </label>
            </div>
          </div>
        </section>
      )}

      {/* TAB 4: GENERAL & APARIENCIA */}
      {activeSettingsTab === 'general' && (
        <div className="space-y-6">
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

          <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Sliders className="w-4 h-4 text-[#F04438]" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Apariencia</h2>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <button
                type="button"
                onClick={() => setTheme('system')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer ${
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
                className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer ${
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
                className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer ${
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
        </div>
      )}

      {/* TAB 5: STORAGE & BACKUP */}
      {activeSettingsTab === 'storage' && (
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
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-slate-700 font-semibold flex items-center space-x-1 cursor-pointer"
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
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
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
                className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpiar historial y caché</span>
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

