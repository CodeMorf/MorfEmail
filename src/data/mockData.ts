import type { AiConfig, ProxyConfig, SearchConfig } from '../types';
import { ALL_COUNTRIES, POPULAR_COUNTRIES } from './countries';

export const INITIAL_COUNTRIES = POPULAR_COUNTRIES.map((country) => ({
  code: country.iso2,
  name: country.nameES,
  flag: country.flag,
  states: country.states || []
}));

export const ALL_COUNTRIES_DATA = ALL_COUNTRIES;

export const POPULAR_CATEGORIES = [
  'Restaurantes', 'Hoteles', 'Ecommerce', 'Abogados', 'Dentistas', 'Inmobiliarias',
  'Construcción', 'Tecnología', 'Tiendas', 'Transporte', 'Automóviles', 'Salud',
  'Agencias de marketing digital', 'Gimnasios y fitness', 'Clínicas estéticas',
  'Consultoría financiera', 'Escuelas y academias', 'Arquitectura y diseño'
];

export const DEFAULT_SEARCH_CONFIG: SearchConfig = {
  country: 'República Dominicana', countryCode: 'DO', flag: '🇩🇴', state: 'Santo Domingo',
  city: 'Distrito Nacional', businessType: 'Restaurantes',
  fieldsToFind: {
    companyName: true, businessEmail: true, phone: true, website: true, whatsapp: true,
    address: true, facebook: true, instagram: true, linkedin: true, category: true,
    city: true, postalCode: true
  },
  contactType: 'b2b_recommended', quantity: 20
};

export const INITIAL_AI_CONFIG: AiConfig = {
  activeProvider: 'codemorf',
  openai: { apiKey: '', model: 'gpt-4o', organization: '' },
  gemini: { apiKey: '', model: 'gemini-2.5-flash' },
  codemorf: { apiKey: '', model: 'morf-b2b-v2-turbo', creditsRemaining: 0 },
  custom: { providerName: '', baseUrl: '', apiKey: '', model: '' }
};

export const INITIAL_PROXY_CONFIG: ProxyConfig = {
  enabled: false, protocol: 'http', host: '', port: '', bypassLocal: true,
  rotatePerRequest: false, routeAiRequests: false, routeScraping: false,
  routeEmailVerifier: false, status: 'idle'
};
