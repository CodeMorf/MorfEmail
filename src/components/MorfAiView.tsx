import React, { useState } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  ExternalLink,
  Copy,
  CheckCircle2,
  Search,
  Mail,
  FileText,
  Zap,
  HelpCircle,
  Lightbulb,
  ArrowRight,
  Settings as SettingsIcon,
  Shield,
  Network,
  Cpu
} from 'lucide-react';
import { ActiveView, AiConfig, ProxyConfig, SearchConfig } from '../types';
import { INITIAL_AI_CONFIG, INITIAL_PROXY_CONFIG } from '../data/mockData';

interface MorfAiViewProps {
  activeAiConfig?: AiConfig;
  activeProxyConfig?: ProxyConfig;
  setActiveView: (view: ActiveView) => void;
  setConfig: React.Dispatch<React.SetStateAction<SearchConfig>>;
  addToast: (title: string, message?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

type ChatMessage = {
  sender: 'user' | 'morf';
  text: string;
  modelUsed?: string;
  action?: { label: string; config?: Partial<SearchConfig> };
};

export const MorfAiView: React.FC<MorfAiViewProps> = ({
  activeAiConfig = INITIAL_AI_CONFIG,
  activeProxyConfig = INITIAL_PROXY_CONFIG,
  setActiveView,
  setConfig,
  addToast
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'queries' | 'outreach'>('chat');
  const [inputPrompt, setInputPrompt] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'morf',
      text: '¡Hola! Soy **Morf AI Studio**, tu copiloto inteligente de prospección B2B y enriquecimiento de leads.\n\nPuedo ayudarte a encontrar los nichos de mayor conversión, generar consultas optimizadas por ciudad o país, redactar secuencias de cold email de alta apertura y preparar guiones de WhatsApp comercial para tus prospectos extraídos.',
      modelUsed: getActiveModelName(activeAiConfig)
    }
  ]);
  const [isThinking, setIsThinking] = useState(false);

  function getActiveModelName(cfg: AiConfig): string {
    switch (cfg.activeProvider) {
      case 'openai':
        return `OpenAI ${cfg.openai.model}`;
      case 'gemini':
        return `Google Gemini ${cfg.gemini.model}`;
      case 'codemorf':
        return `CodeMorf Native (${cfg.codemorf.model})`;
      case 'custom':
        return `${cfg.custom.providerName || 'Custom'} (${cfg.custom.model})`;
      default:
        return 'Morf B2B AI';
    }
  }

  const currentModelLabel = getActiveModelName(activeAiConfig);

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputPrompt;
    if (!text.trim()) return;

    const userMsg = { sender: 'user' as const, text };
    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsThinking(true);

    setTimeout(() => {
      let botResponse = '';
      let botAction = undefined;

      const lower = text.toLowerCase();
      if (lower.includes('rd') || lower.includes('dominicana') || lower.includes('restaurante')) {
        botResponse = `🎯 **Estrategia Recomendada para Restaurantes en República Dominicana:**\n\n- La cobertura se determinará con la búsqueda real y las fuentes públicas disponibles.\n- Prioriza WhatsApp y teléfonos únicamente cuando estén publicados y normalizados.\n- **Keywords recomendadas:** *Restaurantes, Gastronomía, Mariscos, Parrilladas, Alta Cocina*.\n\nHe preparado una configuración inicial para que inicies la extracción:`;
        botAction = {
          label: '🔍 Aplicar y Buscar "Restaurantes Santo Domingo"',
          config: {
            country: 'República Dominicana',
            countryCode: 'DO',
            flag: '🇩🇴',
            state: 'Santo Domingo',
            city: 'Distrito Nacional',
            businessType: 'Restaurantes',
            quantity: 5000
          }
        };
      } else if (lower.includes('abogados') || lower.includes('españa') || lower.includes('madrid')) {
        botResponse = `⚖️ **Estrategia para Despachos de Abogados en España:**\n\n- La disponibilidad de emails se informa únicamente después de extraerlos de fuentes públicas.\n- Valida cada dirección antes de usarla en outreach.\n- **Sectores clave:** *Derecho Mercantil, Asesorías Fiscales, Laboral y Concursal en Madrid y Barcelona*.`;
        botAction = {
          label: '🔍 Aplicar y Buscar "Abogados Madrid"',
          config: {
            country: 'España',
            countryCode: 'ES',
            flag: '🇪🇸',
            state: 'Madrid',
            city: 'Madrid Centro',
            businessType: 'Abogados y Despachos Legales',
            quantity: 5000
          }
        };
      } else if (lower.includes('email') || lower.includes('plantilla') || lower.includes('outreach')) {
        botResponse = `📨 **Plantilla de Cold Email de Alta Conversión (B2B):**\n\n**Asunto:** Pregunta rápida sobre adquisición de clientes en {{Ciudad}}\n\nHola {{Nombre_Empresa}},\n\nEstuve revisando su sitio web y noté el gran trabajo que vienen realizando en el sector de {{Categoría}} en {{Ciudad}}.\n\nDesarrollamos soluciones especializadas para empresas de su sector que permiten aumentar el flujo de prospectos cualificados en un 35% durante los primeros 45 días.\n\n¿Tendrían disponibilidad este miércoles para una llamada ejecutiva de 5 minutos?\n\nUn cordial saludo,\nJhon D. — CodeMorf Leads`;
      } else {
        botResponse = `💡 **Análisis de ${currentModelLabel}:** He analizado tu solicitud para "${text}".\n\nTe recomiendo enfocar tu búsqueda en empresas con al menos sitio web activo y verificar siempre los registros MX antes de lanzar campañas masivas para proteger la reputación de tu dominio de envío.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: 'morf',
          text: botResponse,
          modelUsed: currentModelLabel,
          action: botAction
        }
      ]);
      setIsThinking(false);
    }, 850);
  };

  const copyText = (txt: string) => {
    navigator.clipboard.writeText(txt);
    addToast('Copiado al portapapeles', undefined, 'success');
  };

  const applyConfigAndGo = (cfg?: Partial<SearchConfig>) => {
    if (cfg) {
      setConfig((prev) => ({ ...prev, ...cfg }));
    }
    setActiveView('new-search');
    addToast('Configuración aplicada', 'Parámetros listos en Nueva Búsqueda.', 'success');
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 overflow-y-auto pb-16">
      {/* Top Banner with Provider Status and Doc Link */}
      <div className="bg-gradient-to-r from-[#121417] via-[#1A1D21] to-[#121417] text-white p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F04438] to-[#991B1B] flex items-center justify-center shadow-lg shadow-[#F04438]/20 flex-shrink-0">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-extrabold text-white tracking-tight">Morf AI Studio</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F04438] text-white uppercase">
                Copilot B2B
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Inteligencia artificial multimodelo para prospección, análisis de mercados y redacción de campañas.
            </p>
          </div>
        </div>

        {/* AI & Proxy status pill bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Active Model Pill */}
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-800/90 rounded-xl border border-slate-700 text-xs">
            <Cpu className="w-3.5 h-3.5 text-[#F04438]" />
            <span className="font-mono text-slate-300">
              Motor: <strong className="text-white">{currentModelLabel}</strong>
            </span>
          </div>

          {/* Proxy Pill */}
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-800/90 rounded-xl border border-slate-700 text-xs">
            <Network className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-mono text-slate-300">
              Proxy:{' '}
              <strong className={activeProxyConfig.enabled ? 'text-emerald-400' : 'text-slate-400'}>
                {activeProxyConfig.enabled
                  ? `${activeProxyConfig.protocol.toUpperCase()} (${activeProxyConfig.lastTestedIp || activeProxyConfig.host})`
                  : 'Desactivado'}
              </strong>
            </span>
          </div>

          <button
            onClick={() => setActiveView('settings')}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
            title="Cambiar proveedor de IA o configurar proxy"
          >
            <SettingsIcon className="w-3.5 h-3.5 text-slate-300" />
            <span>Configurar</span>
          </button>

          <a
            href="https://codemorf.tech/chat/docs/es/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#F04438] hover:bg-[#D92D20] text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <span>Docs Morf AI</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
            activeTab === 'chat' ? 'bg-[#F04438] text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          <span>Chat Copilot</span>
        </button>

        <button
          onClick={() => setActiveTab('queries')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
            activeTab === 'queries' ? 'bg-[#F04438] text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Consultas Recomendadas</span>
        </button>

        <button
          onClick={() => setActiveTab('outreach')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
            activeTab === 'outreach' ? 'bg-[#F04438] text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Plantillas de Outreach</span>
        </button>
      </div>

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[520px]">
          {/* Chat messages */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex items-start space-x-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'morf' && (
                  <div className="w-7 h-7 rounded-lg bg-[#15171A] text-white flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-[#F04438]" />
                  </div>
                )}

                <div
                  className={`p-4 rounded-xl max-w-xl leading-relaxed whitespace-pre-line ${
                    m.sender === 'user'
                      ? 'bg-[#15171A] text-white font-medium rounded-tr-none'
                      : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none shadow-xs'
                  }`}
                >
                  <div>{m.text}</div>

                  {m.modelUsed && m.sender === 'morf' && (
                    <div className="mt-2.5 text-[10px] text-slate-400 font-mono flex items-center space-x-1">
                      <span>⚡ Generado con {m.modelUsed}</span>
                    </div>
                  )}

                  {m.action && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <button
                        onClick={() => applyConfigAndGo(m.action?.config)}
                        className="px-3.5 py-1.5 bg-[#F04438] hover:bg-[#D92D20] text-white rounded-lg font-bold text-xs flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer"
                      >
                        <span>{m.action.label}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isThinking && (
              <div className="flex items-center space-x-2 text-slate-400 text-xs italic">
                <Bot className="w-4 h-4 animate-bounce text-[#F04438]" />
                <span>Morf AI ({currentModelLabel}) está procesando solicitud...</span>
              </div>
            )}
          </div>

          {/* Quick prompt chips */}
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-1.5 text-[11px]">
            <span className="text-slate-400 font-semibold uppercase text-[10px] self-center mr-1">Preguntas rápidas:</span>
            <button
              onClick={() => handleSendMessage('¿Cómo prospectar restaurantes en República Dominicana?')}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              🇩🇴 Restaurantes en RD
            </button>
            <button
              onClick={() => handleSendMessage('Genera un email en frío para abogados en Madrid')}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              🇪🇸 Abogados en Madrid
            </button>
            <button
              onClick={() => handleSendMessage('Crea una plantilla de WhatsApp comercial')}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              💬 WhatsApp B2B
            </button>
          </div>

          {/* Input box */}
          <div className="p-3 border-t border-slate-200 flex items-center space-x-2 bg-white">
            <input
              type="text"
              placeholder={`Pregunta a Morf AI (${currentModelLabel}) sobre mercados, sugerencias o emails...`}
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-[#F04438]"
            />
            <button
              onClick={() => handleSendMessage()}
              className="px-4 py-2 bg-[#F04438] hover:bg-[#D92D20] text-white rounded-lg font-bold text-xs flex items-center space-x-1 transition-all shadow-sm cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Enviar</span>
            </button>
          </div>
        </div>
      )}

      {/* Queries Tab */}
      {activeTab === 'queries' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              title: '🇩🇴 Gastronomía & Restaurantes RD',
              leads: 'Se calcula al ejecutar',
              conv: 'Sin verificar',
              desc: 'Restaurantes, franquicias y centros gastronómicos en Santo Domingo, Santiago y Punta Cana.',
              config: {
                country: 'República Dominicana',
                countryCode: 'DO',
                flag: '🇩🇴',
                state: 'Santo Domingo',
                city: 'Distrito Nacional',
                businessType: 'Restaurantes y Bares',
                quantity: 5000
              }
            },
            {
              title: '🇪🇸 Asesorías & Bufetes Madrid',
              leads: 'Se calcula al ejecutar',
              conv: 'Sin verificar',
              desc: 'Despachos jurídicos, tributarios y contables en la Comunidad de Madrid.',
              config: {
                country: 'España',
                countryCode: 'ES',
                flag: '🇪🇸',
                state: 'Madrid',
                city: 'Madrid Centro',
                businessType: 'Abogados y Asesorías',
                quantity: 5000
              }
            },
            {
              title: '🇺🇸 Boutique Hotels & Resorts Florida',
              leads: 'Se calcula al ejecutar',
              conv: 'Sin verificar',
              desc: 'Hotelería, alojamiento vacacional y suites en Miami Beach y Orlando.',
              config: {
                country: 'Estados Unidos',
                countryCode: 'US',
                flag: '🇺🇸',
                state: 'Florida (Miami)',
                city: 'Miami Beach',
                businessType: 'Hoteles & Hospitality',
                quantity: 10000
              }
            },
            {
              title: '🇲🇽 Clínicas Dentales CDMX Polanco',
              leads: 'Se calcula al ejecutar',
              conv: 'Sin verificar',
              desc: 'Odontólogos, clínicas estéticas y salud dental en zonas corporativas.',
              config: {
                country: 'México',
                countryCode: 'MX',
                flag: '🇲🇽',
                state: 'Ciudad de México',
                city: 'Polanco',
                businessType: 'Dentistas y Odontología',
                quantity: 5000
              }
            }
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">{item.title}</h3>
                  <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                    {item.conv}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">{item.desc}</p>
                <div className="text-[11px] font-mono text-slate-400 mt-2">
                  Volumen estimado: {item.leads}
                </div>
              </div>

              <button
                onClick={() => applyConfigAndGo(item.config)}
                className="w-full py-2 bg-slate-900 hover:bg-[#F04438] text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <span>Cargar en Nueva Búsqueda</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Outreach Templates Tab */}
      {activeTab === 'outreach' && (
        <div className="space-y-4">
          {[
            {
              title: '📧 Cold Email B2B — Propuesta Directa de Valor',
              channel: 'Email',
              content: `Asunto: Solución para captación de clientes en {{Ciudad}}\n\nEstimado/a equipo de {{Empresa}},\n\nEstuvimos analizando su posicionamiento en el rubro de {{Categoría}} y detectamos una oportunidad para optimizar su embudo comercial en {{Ciudad}}.\n\nNuestras herramientas permiten automatizar la prospección reduciendo el costo por lead en un 40%.\n\n¿Tendrían 5 minutos esta semana para una breve demostración?\n\nAtentamente,\nJhon D.`
            },
            {
              title: '💬 Mensaje Comercial de WhatsApp (Alta Tasa de Apertura)',
              channel: 'WhatsApp',
              content: `¡Hola {{Empresa}}! 👋 Estuve viendo su catálogo en {{Website}} y me pareció excelente su propuesta en {{Ciudad}}.\n\nLe escribo brevemente porque ayudamos a empresas de {{Categoría}} a contactar directamente con tomadores de decisiones.\n\n¿A qué correo podría compartirles una breve presentación de 1 minuto? ¡Gracias!`
            }
          ].map((tpl, i) => (
            <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-xs">{tpl.title}</h3>
                <button
                  onClick={() => copyText(tpl.content)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copiar</span>
                </button>
              </div>
              <pre className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 whitespace-pre-wrap">
                {tpl.content}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

