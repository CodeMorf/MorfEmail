import countriesRaw from './countries.json';

export interface CountryItem {
  nameES: string;
  nameEN: string;
  iso2: string;
  iso3: string;
  phoneCode: string;
  flag: string;
  states?: string[];
}

export function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌐';
  try {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  } catch {
    return '🌐';
  }
}

// Major subdivisions for quick selecting
const COUNTRY_SUBDIVISIONS: Record<string, string[]> = {
  DO: ['Santo Domingo', 'Distrito Nacional', 'Santiago', 'La Altagracia (Punta Cana)', 'Puerto Plata', 'La Romana', 'San Cristóbal', 'Duarte (San Francisco)', 'La Vega', 'Espaillat (Moca)', 'Samaná', 'San Pedro de Macorís'],
  ES: ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Málaga', 'Bilbao (Bizkaia)', 'Alicante', 'Zaragoza', 'Murcia', 'Palma de Mallorca', 'Las Palmas de Gran Canaria', 'A Coruña', 'Vigo', 'Granada', 'Valladolid'],
  US: ['Florida (Miami / Orlando)', 'California (Los Angeles / SF)', 'Texas (Houston / Dallas / Austin)', 'New York (NYC)', 'Illinois (Chicago)', 'Georgia (Atlanta)', 'Washington (Seattle)', 'North Carolina', 'Arizona (Phoenix)', 'Pennsylvania', 'Massachusetts (Boston)'],
  MX: ['Ciudad de México (CDMX)', 'Jalisco (Guadalajara)', 'Nuevo León (Monterrey)', 'Puebla', 'Quintana Roo (Cancún)', 'Guanajuato (León)', 'Querétaro', 'Yucatán (Mérida)', 'Baja California (Tijuana)', 'Veracruz', 'Estado de México'],
  CO: ['Bogotá D.C.', 'Antioquia (Medellín)', 'Valle del Cauca (Cali)', 'Atlántico (Barranquilla)', 'Santander (Bucaramanga)', 'Bolívar (Cartagena)', 'Cundinamarca', 'Risaralda (Pereira)', 'Caldas (Manizales)'],
  IT: ['Milano (Lombardia)', 'Roma (Lazio)', 'Torino (Piemonte)', 'Firenze (Toscana)', 'Napoli (Campania)', 'Bologna (Emilia-Romagna)', 'Venezia (Veneto)', 'Genova (Liguria)', 'Palermo (Sicilia)', 'Bari (Puglia)'],
  PA: ['Panamá Ciudad', 'Colón', 'Chiriquí (David)', 'Panamá Oeste (La Chorrera)', 'Coclé (Penonomé)', 'Veraguas', 'Herrera'],
  CL: ['Región Metropolitana (Santiago)', 'Valparaíso (Viña del Mar)', 'Biobío (Concepción)', 'Antofagasta', 'Araucanía (Temuco)', 'Coquimbo (La Serena)', 'Los Lagos (Puerto Montt)'],
  AR: ['Buenos Aires (CABA)', 'Buenos Aires Provincia', 'Córdoba', 'Santa Fe (Rosario)', 'Mendoza', 'Tucumán', 'Salta', 'Neuquén', 'Río Negro (Bariloche)'],
  PE: ['Lima Metropolitana', 'Arequipa', 'La Libertad (Trujillo)', 'Cusco', 'Piura', 'Lambayeque (Chiclayo)', 'Junín (Huancayo)', 'Ica', 'Áncash (Chimbote)'],
  EC: ['Pichincha (Quito)', 'Guayas (Guayaquil)', 'Azuay (Cuenca)', 'Manabí (Manta / Portoviejo)', 'Tungurahua (Ambato)', 'El Oro (Machala)', 'Loja'],
  CR: ['San José', 'Alajuela', 'Heredia', 'Cartago', 'Guanacaste', 'Puntarenas', 'Limón'],
  GT: ['Guatemala (Ciudad)', 'Quetzaltenango', 'Sacatepéquez (Antigua)', 'Escuintla', 'Alta Verapaz', 'Chimaltenango'],
  PR: ['San Juan', 'Bayamón', 'Carolina', 'Ponce', 'Caguas', 'Guaynabo', 'Mayagüez', 'Arecibo'],
  BR: ['São Paulo', 'Rio de Janeiro', 'Minas Gerais (Belo Horizonte)', 'Bahia (Salvador)', 'Paraná (Curitiba)', 'Rio Grande do Sul (Porto Alegre)', 'Santa Catarina (Florianópolis)', 'Distrito Federal (Brasília)'],
  GB: ['Greater London', 'Greater Manchester', 'West Midlands (Birmingham)', 'West Yorkshire (Leeds)', 'Scotland (Edinburgh / Glasgow)', 'Merseyside (Liverpool)', 'Bristol', 'Tyne and Wear (Newcastle)'],
  FR: ['Île-de-France (Paris)', 'Auvergne-Rhône-Alpes (Lyon)', 'Provence-Alpes-Côte d\'Azur (Marseille / Nice)', 'Occitanie (Toulouse)', 'Nouvelle-Aquitaine (Bordeaux)', 'Grand Est (Strasbourg)', 'Pays de la Loire (Nantes)'],
  DE: ['Berlin', 'Bavaria (München)', 'North Rhine-Westphalia (Köln / Düsseldorf)', 'Baden-Württemberg (Stuttgart)', 'Hamburg', 'Hesse (Frankfurt)', 'Saxony (Leipzig / Dresden)'],
  PT: ['Lisboa', 'Porto', 'Braga', 'Setúbal', 'Coimbra', 'Faro (Algarve)', 'Aveiro', 'Funchal (Madeira)'],
  CA: ['Ontario (Toronto / Ottawa)', 'Quebec (Montreal)', 'British Columbia (Vancouver)', 'Alberta (Calgary / Edmonton)', 'Manitoba (Winnipeg)']
};

export const ALL_COUNTRIES: CountryItem[] = (countriesRaw as Array<{
  nameES: string;
  nameEN: string;
  iso2: string;
  iso3: string;
  phoneCode: string;
}>).map((item) => ({
  nameES: item.nameES,
  nameEN: item.nameEN,
  iso2: item.iso2,
  iso3: item.iso3,
  phoneCode: item.phoneCode ? (item.phoneCode.startsWith('+') ? item.phoneCode : `+${item.phoneCode}`) : '',
  flag: getFlagEmoji(item.iso2),
  states: COUNTRY_SUBDIVISIONS[item.iso2] || []
}));

export const POPULAR_ISO_CODES = [
  'DO', // Rep. Dominicana
  'ES', // España
  'US', // Estados Unidos
  'MX', // México
  'CO', // Colombia
  'IT', // Italia
  'PA', // Panamá
  'CL', // Chile
  'AR', // Argentina
  'PE', // Perú
  'EC', // Ecuador
  'CR', // Costa Rica
  'GT', // Guatemala
  'PR', // Puerto Rico
  'BR', // Brasil
  'GB', // Reino Unido
  'FR', // Francia
  'DE', // Alemania
  'PT', // Portugal
  'CA'  // Canadá
];

export const POPULAR_COUNTRIES: CountryItem[] = POPULAR_ISO_CODES
  .map((code) => ALL_COUNTRIES.find((c) => c.iso2 === code))
  .filter((c): c is CountryItem => !!c);

export function searchCountries(term: string): CountryItem[] {
  if (!term.trim()) return ALL_COUNTRIES;
  const q = term.toLowerCase().trim();
  return ALL_COUNTRIES.filter(
    (c) =>
      c.nameES.toLowerCase().includes(q) ||
      c.nameEN.toLowerCase().includes(q) ||
      c.iso2.toLowerCase().includes(q) ||
      c.iso3.toLowerCase().includes(q) ||
      c.phoneCode.toLowerCase().includes(q)
  );
}

export function findCountry(query: string): CountryItem | undefined {
  if (!query) return undefined;
  const q = query.toLowerCase().trim();
  return ALL_COUNTRIES.find(
    (c) =>
      c.iso2.toLowerCase() === q ||
      c.iso3.toLowerCase() === q ||
      c.nameES.toLowerCase() === q ||
      c.nameEN.toLowerCase() === q
  );
}
