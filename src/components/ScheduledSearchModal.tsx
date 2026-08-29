import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Clock,
  Calendar,
  Layers,
  Sparkles,
  Check,
  ChevronDown,
  Search,
  Sliders,
  ShieldCheck,
  Bell,
  RefreshCw,
  Zap
} from 'lucide-react';
import { ScheduledSearch, ScheduleInterval, LeadList } from '../types';
import { ALL_COUNTRIES, POPULAR_COUNTRIES, CountryItem, searchCountries } from '../data/countries';
import { POPULAR_CATEGORIES } from '../data/mockData';

interface ScheduledSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    id?: string;
    title: string;
    category: string;
    country: string;
    countryCode: string;
    flag: string;
    state?: string;
    city?: string;
    interval: ScheduleInterval;
    targetListId: string;
    targetListName: string;
    quantityPerRun: number;
    autoVerifyEmails: boolean;
    autoDeduplicate: boolean;
    notifyEmail: boolean;
  }) => void;
  editItem?: ScheduledSearch | null;
  lists: LeadList[];
}

const INTERVAL_OPTIONS: {
  value: ScheduleInterval;
  label: string;
  sublabel: string;
  icon: string;
  badge?: string;
}[] = [
  {
    value: 'hourly_6',
    label: 'Cada 6 horas',
    sublabel: '4 ejecuciones al día (Monitoreo continuo)',
    icon: '⚡',
    badge: 'Frecuente'
  },
  {
    value: 'daily',
    label: 'Diario (Cada 24h)',
    sublabel: 'Ejecución cada madrugada (Recomendado)',
    icon: '📅',
    badge: 'Popular'
  },
  {
    value: 'weekly',
    label: 'Semanal (Cada 7 días)',
    sublabel: 'Ideal para nutrición de listas B2B',
    icon: '🗓️'
  },
  {
    value: 'biweekly',
    label: 'Quincenal (Cada 15 días)',
    sublabel: 'Actualización periódica de contactos',
    icon: '📆'
  },
  {
    value: 'monthly',
    label: 'Mensual (Cada 30 días)',
    sublabel: 'Escaneo mensual completo del nicho',
    icon: '📊'
  }
];

export const ScheduledSearchModal: React.FC<ScheduledSearchModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editItem,
  lists
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Restaurantes');
  const [country, setCountry] = useState('República Dominicana');
  const [countryCode, setCountryCode] = useState('DO');
  const [flag, setFlag] = useState('🇩🇴');
  const [state, setState] = useState('Santo Domingo');
  const [city, setCity] = useState('Distrito Nacional');
  const [interval, setInterval] = useState<ScheduleInterval>('daily');
  const [targetListId, setTargetListId] = useState<string>(lists[0]?.id || '');
  const [quantityPerRun, setQuantityPerRun] = useState<number>(500);
  const [autoVerifyEmails, setAutoVerifyEmails] = useState(true);
  const [autoDeduplicate, setAutoDeduplicate] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);

  // Country dropdown state
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [countryTab, setCountryTab] = useState<'popular' | 'all'>('popular');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (editItem) {
      setTitle(editItem.title);
      setCategory(editItem.category);
      setCountry(editItem.country);
      setCountryCode(editItem.countryCode);
      setFlag(editItem.flag);
      setState(editItem.state || 'Todo el país');
      setCity(editItem.city || 'Todas');
      setInterval(editItem.interval);
      setTargetListId(editItem.targetListId);
      setQuantityPerRun(editItem.quantityPerRun || 500);
      setAutoVerifyEmails(editItem.autoVerifyEmails);
      setAutoDeduplicate(editItem.autoDeduplicate);
      setNotifyEmail(editItem.notifyEmail);
    } else {
      setTitle('');
      setCategory('Restaurantes');
      setCountry('República Dominicana');
      setCountryCode('DO');
      setFlag('🇩🇴');
      setState('Santo Domingo');
      setCity('Distrito Nacional');
      setInterval('daily');
      setTargetListId(lists[0]?.id || '');
      setQuantityPerRun(500);
      setAutoVerifyEmails(true);
      setAutoDeduplicate(true);
      setNotifyEmail(true);
    }
  }, [editItem, isOpen, lists]);

  const selectedCountryObj = useMemo(() => {
    return (
      ALL_COUNTRIES.find(
        (c) =>
          c.nameES.toLowerCase() === country.toLowerCase() ||
          c.iso2.toLowerCase() === countryCode.toLowerCase()
      ) || ALL_COUNTRIES[0]
    );
  }, [country, countryCode]);

  const filteredCountries = useMemo(() => {
    if (countryTab === 'popular' && !countrySearch.trim()) {
      return POPULAR_COUNTRIES;
    }
    return searchCountries(countrySearch);
  }, [countrySearch, countryTab]);

  const handleCountrySelect = (c: CountryItem) => {
    setCountry(c.nameES);
    setCountryCode(c.iso2);
    setFlag(c.flag);
    setState(c.states && c.states.length > 0 ? c.states[0] : 'Todo el país');
    setCity('Todas las ciudades');
    setShowCountryDropdown(false);
    setCountrySearch('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = title.trim() || `${category} en ${city || state || country} (${interval})`;
    const targetList = lists.find((l) => l.id === targetListId);
    if (!targetList) {
      setFormError('Crea o selecciona una lista antes de programar la búsqueda.');
      return;
    }

    setFormError('');
    const targetListName = targetList.name;

    onSave({
      id: editItem?.id,
      title: finalTitle,
      category,
      country,
      countryCode,
      flag,
      state,
      city,
      interval,
      targetListId,
      targetListName,
      quantityPerRun,
      autoVerifyEmails,
      autoDeduplicate,
      notifyEmail
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-[#F04438] flex items-center justify-center shadow-xs">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {editItem ? 'Editar búsqueda programada' : 'Programar búsqueda automática'}
              </h2>
              <p className="text-xs text-slate-500">
                Extracción recurrente en segundo plano con refresco automático de listas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
          {/* Custom Name / Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nombre de la Automatización (Opcional)
            </label>
            <input
              type="text"
              placeholder={`Ej. ${category} en ${city || state || country} - Auto Sync`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-[#F04438] focus:bg-white transition-all font-medium"
            />
          </div>

          {/* Categoría / Nicho */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Categoría o Nicho de Negocio
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Ej. Restaurantes, Inmobiliarias, Hoteles, Clínicas dentales..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-[#F04438] focus:bg-white transition-all font-medium"
              required
            />
            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {POPULAR_CATEGORIES.slice(0, 6).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`text-[11px] px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    category.toLowerCase() === cat.toLowerCase()
                      ? 'bg-[#F04438] text-white font-semibold shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Ubicación Geográfica */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* País */}
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                País ({selectedCountryObj.iso2})
              </label>
              <button
                type="button"
                onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg text-xs text-slate-900 font-medium transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-2 truncate">
                  <span className="text-base">{flag}</span>
                  <span className="truncate">{country}</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showCountryDropdown && (
                <div className="absolute top-full left-0 mt-1 w-72 sm:w-80 bg-white border border-slate-300 rounded-xl shadow-2xl z-50 p-2.5 text-xs space-y-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Buscar país..."
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      className="w-full pl-7 pr-2.5 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:border-[#F04438]"
                      autoFocus
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2.5" />
                  </div>

                  <div className="flex space-x-1 border-b border-slate-100 pb-1 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setCountryTab('popular')}
                      className={`px-2 py-0.5 rounded font-medium ${
                        countryTab === 'popular'
                          ? 'bg-slate-900 text-white font-bold'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      ⭐ Populares
                    </button>
                    <button
                      type="button"
                      onClick={() => setCountryTab('all')}
                      className={`px-2 py-0.5 rounded font-medium ${
                        countryTab === 'all'
                          ? 'bg-slate-900 text-white font-bold'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      🌐 Todos ({ALL_COUNTRIES.length})
                    </button>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-0.5 custom-scrollbar">
                    {filteredCountries.map((c) => (
                      <button
                        key={c.iso2}
                        type="button"
                        onClick={() => handleCountrySelect(c)}
                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-left transition-colors cursor-pointer ${
                          countryCode === c.iso2
                            ? 'bg-red-50 text-[#F04438] font-bold'
                            : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span className="truncate">
                          {c.flag} {c.nameES}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">{c.iso2}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Provincia / Estado */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Provincia / Estado
              </label>
              {selectedCountryObj.states && selectedCountryObj.states.length > 0 ? (
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:outline-none focus:border-[#F04438]"
                >
                  <option value="Todo el país">📍 Todo el país (Nacional)</option>
                  {selectedCountryObj.states.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Provincia / Estado"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:outline-none focus:border-[#F04438]"
                />
              )}
            </div>

            {/* Ciudad */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ciudad</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ej. Distrito Nacional, Miami, Madrid..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:outline-none focus:border-[#F04438]"
              />
            </div>
          </div>

          {/* Intervalo de Ejecución (Frecuencia) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Frecuencia de Repetición Automática</span>
              <span className="text-[11px] text-[#F04438] font-semibold lowercase">
                Programación local
              </span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {INTERVAL_OPTIONS.map((opt) => {
                const isSelected = interval === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setInterval(opt.value)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#F04438] bg-red-50/50 ring-2 ring-[#F04438]/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <div className="flex items-center space-x-1.5 font-bold text-xs text-slate-900">
                        <span>{opt.icon}</span>
                        <span>{opt.label}</span>
                      </div>
                      {opt.badge && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            isSelected
                              ? 'bg-[#F04438] text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {opt.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">{opt.sublabel}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lista de Destino & Límite de Leads */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Lista Destino */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                <span>Lista donde guardar nuevos leads</span>
              </label>
              <select
                value={targetListId}
                onChange={(e) => setTargetListId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-semibold focus:outline-none focus:border-[#F04438]"
              >
                <option value="">Selecciona una lista...</option>
                {lists.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.leadCount.toLocaleString()} leads actuales)
                  </option>
                ))}
              </select>
              {lists.length === 0 && (
                <p className="mt-1.5 text-[11px] text-amber-700">No hay listas creadas. Ve a “Listas” y crea una antes de programar.</p>
              )}
            </div>

            {/* Leads por ejecución */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Volumen por ciclo de extracción</span>
              </label>
              <select
                value={quantityPerRun}
                onChange={(e) => setQuantityPerRun(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-semibold focus:outline-none focus:border-[#F04438]"
              >
                <option value={250}>250 leads por ciclo (Rápido)</option>
                <option value={500}>500 leads por ciclo (Estándar)</option>
                <option value={1000}>1,000 leads por ciclo (Intensivo)</option>
                <option value={2500}>2,500 leads por ciclo (Máxima cobertura)</option>
              </select>
            </div>
          </div>

          {/* Opciones Avanzadas / Checkboxes */}
          <div className="pt-3 border-t border-slate-200 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Opciones de Calidad & Notificaciones
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <label className="flex items-start space-x-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoVerifyEmails}
                  onChange={(e) => setAutoVerifyEmails(e.target.checked)}
                  className="mt-0.5 accent-[#F04438] rounded"
                />
                <div>
                  <span className="font-bold text-slate-900 block text-[11px]">
                    Auto-verificar MX
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Valida servidores de correo SMTP
                  </span>
                </div>
              </label>

              <label className="flex items-start space-x-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoDeduplicate}
                  onChange={(e) => setAutoDeduplicate(e.target.checked)}
                  className="mt-0.5 accent-[#F04438] rounded"
                />
                <div>
                  <span className="font-bold text-slate-900 block text-[11px]">
                    Deduplicación Auto
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Evita empresas ya existentes
                  </span>
                </div>
              </label>

              <label className="flex items-start space-x-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.checked)}
                  className="mt-0.5 accent-[#F04438] rounded"
                />
                <div>
                  <span className="font-bold text-slate-900 block text-[11px]">
                    Alerta por Correo
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Notifica al cosechar nuevos leads
                  </span>
                </div>
              </label>
            </div>
          </div>

          {formError && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800" role="alert">
              {formError}
            </p>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#F04438] hover:bg-[#D92D20] text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-[#F04438]/20 flex items-center space-x-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{editItem ? 'Guardar Cambios' : 'Activar Automatización'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
