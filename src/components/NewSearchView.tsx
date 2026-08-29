import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Briefcase,
  Sliders,
  CheckSquare,
  Square,
  Globe,
  Building,
  Mail,
  Phone,
  MessageCircle,
  Share2,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Info,
  Clock,
  Coins,
  Search,
  Bot,
  Check,
  ChevronDown
} from 'lucide-react';
import { SearchConfig } from '../types';
import { POPULAR_CATEGORIES } from '../data/mockData';
import { ALL_COUNTRIES, POPULAR_COUNTRIES, CountryItem, searchCountries } from '../data/countries';

interface NewSearchViewProps {
  config: SearchConfig;
  setConfig: React.Dispatch<React.SetStateAction<SearchConfig>>;
  onStartSearch: () => void;
  openMorfAi: () => void;
}

export const NewSearchView: React.FC<NewSearchViewProps> = ({
  config,
  setConfig,
  onStartSearch,
  openMorfAi
}) => {
  const [countrySearch, setCountrySearch] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countryTab, setCountryTab] = useState<'popular' | 'all'>('popular');

  const selectedCountryObj = useMemo(() => {
    return (
      ALL_COUNTRIES.find(
        (c) =>
          c.nameES.toLowerCase() === config.country.toLowerCase() ||
          c.nameEN.toLowerCase() === config.country.toLowerCase() ||
          c.iso2.toLowerCase() === config.countryCode.toLowerCase()
      ) || ALL_COUNTRIES[0]
    );
  }, [config.country, config.countryCode]);

  const filteredCountries = useMemo(() => {
    if (countryTab === 'popular' && !countrySearch.trim()) {
      return POPULAR_COUNTRIES;
    }
    return searchCountries(countrySearch);
  }, [countrySearch, countryTab]);

  const toggleField = (field: keyof SearchConfig['fieldsToFind']) => {
    setConfig((prev) => ({
      ...prev,
      fieldsToFind: {
        ...prev.fieldsToFind,
        [field]: !prev.fieldsToFind[field]
      }
    }));
  };

  const handleCountrySelect = (country: CountryItem) => {
    setConfig((prev) => ({
      ...prev,
      country: country.nameES,
      countryCode: country.iso2,
      flag: country.flag,
      state: country.states && country.states.length > 0 ? country.states[0] : 'Todo el país',
      city: 'Todas las ciudades'
    }));
    setShowCountryDropdown(false);
    setCountrySearch('');
  };

  // Estimate search time dynamically
  const getTimeEstimate = (quantity: number) => {
    if (quantity <= 1000) return '1–3 minutos';
    if (quantity <= 5000) return '4–7 minutos';
    if (quantity <= 10000) return '8–15 minutos';
    if (quantity <= 50000) return '25–45 minutos';
    return '1–2 horas';
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 overflow-y-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <span>Encontrar nuevos clientes</span>
            <span className="text-xs bg-red-100 text-[#F04438] px-2 py-0.5 rounded-full font-bold uppercase">
              Motor v2.4 Global
            </span>
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Selecciona tu mercado y los datos que quieres encontrar en más de 240 países.
          </p>
        </div>

        <button
          onClick={openMorfAi}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-all self-start sm:self-auto cursor-pointer"
        >
          <Bot className="w-4 h-4 text-[#F04438]" />
          <span>Sugerir nicho con Morf AI</span>
        </button>
      </div>

      {/* Main Configuration Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-8">
        
        {/* PASO 1 — Ubicación */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-[#15171A] text-white flex items-center justify-center text-xs font-bold font-mono">
                1
              </span>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Ubicación Geográfica
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              248 países disponibles
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {/* Country Selector */}
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                País ({selectedCountryObj.iso2}) {selectedCountryObj.phoneCode && <span className="text-slate-400 font-mono">({selectedCountryObj.phoneCode})</span>}
              </label>
              <button
                type="button"
                onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg text-xs text-slate-900 font-medium transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-2 truncate">
                  <span className="text-lg leading-none">{config.flag}</span>
                  <span className="truncate font-semibold">{config.country}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                    {selectedCountryObj.iso2}
                  </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showCountryDropdown && (
                <div className="absolute top-full left-0 mt-1 w-80 sm:w-96 bg-white border border-slate-300 rounded-xl shadow-2xl z-40 p-3 text-xs space-y-2">
                  {/* Search input inside dropdown */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Buscar país por nombre, código o prefijo (+1, +34...)"
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#F04438]"
                      autoFocus
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>

                  {/* Tabs: Populares vs Todos */}
                  <div className="flex space-x-1 border-b border-slate-100 pb-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setCountryTab('popular')}
                      className={`px-2.5 py-1 rounded font-medium transition-colors ${
                        countryTab === 'popular'
                          ? 'bg-slate-900 text-white font-bold'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      ⭐ Populares ({POPULAR_COUNTRIES.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setCountryTab('all')}
                      className={`px-2.5 py-1 rounded font-medium transition-colors ${
                        countryTab === 'all'
                          ? 'bg-slate-900 text-white font-bold'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      🌐 Todos los países ({ALL_COUNTRIES.length})
                    </button>
                  </div>

                  {/* Scrollable list of countries */}
                  <div className="max-h-56 overflow-y-auto space-y-0.5 custom-scrollbar pr-1">
                    {filteredCountries.map((c) => {
                      const isSelected =
                        config.country.toLowerCase() === c.nameES.toLowerCase() ||
                        config.countryCode.toLowerCase() === c.iso2.toLowerCase();
                      return (
                        <button
                          key={c.iso2}
                          type="button"
                          onClick={() => handleCountrySelect(c)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                            isSelected
                              ? 'bg-red-50 text-[#F04438] font-bold ring-1 ring-red-200'
                              : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <span className="text-base leading-none">{c.flag}</span>
                            <span className="truncate">{c.nameES}</span>
                            <span className="text-[10px] text-slate-400 truncate">({c.nameEN})</span>
                          </div>

                          <div className="flex items-center space-x-1.5 flex-shrink-0 font-mono text-[10px]">
                            {c.phoneCode && (
                              <span className="text-slate-500">{c.phoneCode}</span>
                            )}
                            <span className="px-1 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold">
                              {c.iso2}
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-[#F04438]" />}
                          </div>
                        </button>
                      );
                    })}

                    {filteredCountries.length === 0 && (
                      <div className="p-4 text-center text-slate-400 text-xs">
                        No se encontró ningún país con "{countrySearch}"
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* State/Province Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Provincia / Estado / Región
              </label>
              {selectedCountryObj.states && selectedCountryObj.states.length > 0 ? (
                <select
                  value={config.state}
                  onChange={(e) => setConfig({ ...config, state: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:outline-none focus:border-[#F04438]"
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
                  value={config.state}
                  onChange={(e) => setConfig({ ...config, state: e.target.value })}
                  placeholder="Ej. Todo el país o Estado/Región"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:outline-none focus:border-[#F04438]"
                />
              )}
            </div>

            {/* City Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ciudad / Municipio
              </label>
              <input
                type="text"
                value={config.city}
                onChange={(e) => setConfig({ ...config, city: e.target.value })}
                placeholder="Ej. Todas las ciudades o Distrito Nacional"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:outline-none focus:border-[#F04438]"
              />
            </div>
          </div>
        </section>

        {/* PASO 2 — TIPO DE NEGOCIO */}
        <section className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-[#15171A] text-white flex items-center justify-center text-xs font-bold font-mono">
                2
              </span>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                ¿Qué tipo de clientes estás buscando?
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              5,000+ categorías disponibles
            </span>
          </div>

          <div className="space-y-3 pt-1">
            <div className="relative">
              <input
                type="text"
                value={config.businessType}
                onChange={(e) => setConfig({ ...config, businessType: e.target.value })}
                placeholder="Escribe una categoría, ej. Restaurantes, Agencias de marketing digital, Abogados..."
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 focus:border-[#F04438] rounded-xl text-sm font-semibold text-slate-900 focus:outline-none transition-colors"
              />
              <div className="absolute right-3 top-3.5 text-slate-400">
                <Search className="w-4 h-4" />
              </div>
            </div>

            {/* Visual Category Tags */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Sugerencias populares:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setConfig({ ...config, businessType: cat })}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                      config.businessType.toLowerCase() === cat.toLowerCase()
                        ? 'bg-[#F04438] text-white shadow-sm font-semibold'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* PASO 3 — DATOS A ENCONTRAR */}
        <section className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-[#15171A] text-white flex items-center justify-center text-xs font-bold font-mono">
                3
              </span>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Datos a extraer
              </h2>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <button
                type="button"
                onClick={() => {
                  const allTrue = Object.fromEntries(
                    Object.keys(config.fieldsToFind).map(k => [k, true])
                  ) as any;
                  setConfig({ ...config, fieldsToFind: allTrue });
                }}
                className="text-[#F04438] hover:underline font-medium"
              >
                Seleccionar todos
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-1">
            {[
              { id: 'companyName', label: 'Nombre empresa', icon: Building, required: true },
              { id: 'businessEmail', label: 'Email comercial', icon: Mail, highlight: true },
              { id: 'phone', label: 'Teléfono', icon: Phone, highlight: true },
              { id: 'website', label: 'Website', icon: Globe },
              { id: 'whatsapp', label: 'WhatsApp público', icon: MessageCircle, highlight: true },
              { id: 'address', label: 'Dirección física', icon: MapPin },
              { id: 'facebook', label: 'Facebook', icon: Share2 },
              { id: 'instagram', label: 'Instagram', icon: Share2 },
              { id: 'linkedin', label: 'LinkedIn', icon: Share2 },
              { id: 'category', label: 'Categoría / Rubro', icon: Briefcase },
              { id: 'city', label: 'Ciudad / Región', icon: MapPin },
              { id: 'postalCode', label: 'Código postal', icon: MapPin },
            ].map((f) => {
              const isChecked = config.fieldsToFind[f.id as keyof SearchConfig['fieldsToFind']];
              const Icon = f.icon;
              return (
                <div
                  key={f.id}
                  onClick={() => toggleField(f.id as keyof SearchConfig['fieldsToFind'])}
                  className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-red-50/50 border-red-200 text-slate-900 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <Icon className={`w-3.5 h-3.5 ${isChecked ? 'text-[#F04438]' : 'text-slate-400'}`} />
                    <span className="text-xs font-medium truncate">{f.label}</span>
                  </div>
                  {isChecked ? (
                    <CheckSquare className="w-4 h-4 text-[#F04438] flex-shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-300 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* PASO 4 — TIPO DE CONTACTO */}
        <section className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-[#15171A] text-white flex items-center justify-center text-xs font-bold font-mono">
              4
            </span>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Tipo de Contacto & Profundidad
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            {/* B2B Recomendado */}
            <div
              onClick={() => setConfig({ ...config, contactType: 'b2b_recommended' })}
              className={`p-4 rounded-xl border cursor-pointer transition-all relative ${
                config.contactType === 'b2b_recommended'
                  ? 'border-[#F04438] bg-red-50/30 ring-1 ring-[#F04438]'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-900">B2B recomendado</span>
                <span className="text-[10px] bg-red-100 text-[#F04438] px-1.5 py-0.2 rounded font-bold uppercase">
                  Recomendado
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Solo contactos empresariales y profesionales publicados en portales corporativos y registros.
              </p>
            </div>

            {/* Todos los contactos empresariales */}
            <div
              onClick={() => setConfig({ ...config, contactType: 'all_business' })}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                config.contactType === 'all_business'
                  ? 'border-[#F04438] bg-red-50/30 ring-1 ring-[#F04438]'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-900">Todos los contactos</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Búsqueda más amplia. Incluye sucursales secundarias, socios y correos departamentales.
              </p>
            </div>

            {/* Dominio Específico */}
            <div
              onClick={() => setConfig({ ...config, contactType: 'specific_domain' })}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                config.contactType === 'specific_domain'
                  ? 'border-[#F04438] bg-red-50/30 ring-1 ring-[#F04438]'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-900">Dominio específico</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Buscar contactos únicamente dentro de una web o directorio web indicado.
              </p>
              {config.contactType === 'specific_domain' && (
                <input
                  type="text"
                  placeholder="ejemplo.com o portal.do"
                  value={config.targetDomain || ''}
                  onChange={(e) => setConfig({ ...config, targetDomain: e.target.value })}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-2 w-full px-2 py-1 border border-slate-300 rounded text-xs focus:outline-none focus:border-[#F04438]"
                />
              )}
            </div>
          </div>
        </section>

        {/* PASO 5 — CANTIDAD */}
        <section className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-[#15171A] text-white flex items-center justify-center text-xs font-bold font-mono">
                5
              </span>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Cantidad de Leads
              </h2>
            </div>
            <div className="flex items-center space-x-2 font-mono text-sm font-extrabold text-[#F04438]">
              <span>{config.quantity.toLocaleString()} leads</span>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <input
              type="range"
              min="20"
              max="50000"
              step="20"
              value={config.quantity}
              onChange={(e) => setConfig({ ...config, quantity: Number(e.target.value) })}
              className="w-full accent-[#F04438] cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
            />
            
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span>20 leads</span>
              <span>10,000 leads</span>
              <span>25,000 leads</span>
              <span>50,000 leads</span>
            </div>

            {/* Estimates row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center space-x-3 text-xs text-slate-600">
                <Clock className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Estimación de tiempo</span>
                  <span className="font-bold text-slate-900">{getTimeEstimate(config.quantity)}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center space-x-3 text-xs text-slate-600">
                <Coins className="w-4 h-4 text-[#F04438]" />
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Registros a procesar</span>
                  <span className="font-bold text-slate-900">Se procesarán hasta {config.quantity.toLocaleString()} registros reales.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Big Action Button */}
        <div className="pt-4 border-t border-slate-200 text-center space-y-2">
          <button
            type="button"
            onClick={onStartSearch}
            className="w-full sm:w-auto min-w-[320px] px-8 py-4 bg-[#F04438] hover:bg-[#D92D20] text-white text-base font-extrabold rounded-xl shadow-lg shadow-[#F04438]/25 hover:shadow-xl hover:shadow-[#F04438]/35 transition-all transform active:scale-98 cursor-pointer inline-flex items-center justify-center space-x-2"
          >
            <Search className="w-5 h-5" />
            <span>BUSCAR CLIENTES</span>
            <ArrowRight className="w-5 h-5 ml-1" />
          </button>

          <p className="text-[11px] text-slate-400 max-w-lg mx-auto">
            🔒 La búsqueda utiliza únicamente información empresarial publicada públicamente en cumplimiento con las normativas internacionales de protección de datos.
          </p>
        </div>

      </div>
    </div>
  );
};
