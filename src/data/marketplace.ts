/**
 * Marketplace: productos y donaciones (hardcodeados).
 * Premios > 500,000 XLM. Donaciones a perritos, medio ambiente y organizaciones diversas.
 */

export type MarketplaceCategory = 'premios' | 'donaciones';

export interface MarketplaceItem {
  id: string;
  category: MarketplaceCategory;
  name: string;
  description: string;
  /** Precio en XLM (premios) o monto sugerido para donación */
  priceXLM: number;
  image: string;
  /** Para donaciones: nombre de la causa/comunidad */
  causeName?: string;
  /** Dirección Stellar destino (merchant o causa). En producción vendría del backend. */
  destinationAddress?: string;
}

/** Premios que se pueden canjear por XLM (precios > 500,000 XLM) */
export const PREMIOS: MarketplaceItem[] = [
  {
    id: 'premio-ipad',
    category: 'premios',
    name: 'iPad (10ª gen)',
    description: 'iPad 10.9" Wi‑Fi 64GB. Pantalla Liquid Retina, chip A14 Bionic. Incluye entrega en campus.',
    priceXLM: 550_000,
    image: '',
    destinationAddress: undefined,
  },
  {
    id: 'premio-pantalla',
    category: 'premios',
    name: 'Monitor 27"',
    description: 'Monitor Full HD 27" para estudio. Ideal para programación y videollamadas.',
    priceXLM: 520_000,
    image: '',
    destinationAddress: undefined,
  },
  {
    id: 'premio-mac',
    category: 'premios',
    name: 'MacBook Air M2',
    description: 'MacBook Air 13.6" M2, 8GB RAM, 256GB SSD. Para los que llegan más lejos.',
    priceXLM: 1_500_000,
    image: '',
    destinationAddress: undefined,
  },
];

/** Donaciones: perritos, medio ambiente y organizaciones diversas. Cada 5 donaciones el usuario gana más puntos. */
export const DONACIONES: MarketplaceItem[] = [
  {
    id: 'donacion-perritos',
    category: 'donaciones',
    name: 'Refugio de perritos',
    description: 'Ayuda a refugios locales. Alimento, veterinaria y adopciones responsables.',
    priceXLM: 100,
    image: '',
    causeName: 'Rescate animal',
    destinationAddress: undefined,
  },
  {
    id: 'donacion-ambiente',
    category: 'donaciones',
    name: 'Medio ambiente',
    description: 'Reforestación y limpieza de espacios. Tu donación se destina a proyectos verdes del campus.',
    priceXLM: 150,
    image: '',
    causeName: 'Campus sostenible',
    destinationAddress: undefined,
  },
  {
    id: 'donacion-becas',
    category: 'donaciones',
    name: 'Fondo de becas',
    description: 'Ayuda a estudiantes con necesidad económica. Tu XLM se suma al fondo de becas.',
    priceXLM: 200,
    image: '',
    causeName: 'Becas PumaPay',
    destinationAddress: undefined,
  },
  {
    id: 'donacion-salud',
    category: 'donaciones',
    name: 'Salud comunitaria',
    description: 'Apoyo a brigadas de salud y campañas de prevención en la comunidad universitaria.',
    priceXLM: 120,
    image: '',
    causeName: 'Salud PumaPay',
    destinationAddress: undefined,
  },
  {
    id: 'donacion-cultura',
    category: 'donaciones',
    name: 'Cultura y arte',
    description: 'Talleres, exposiciones y actividades culturales para todo el campus.',
    priceXLM: 80,
    image: '',
    causeName: 'Cultura universitaria',
    destinationAddress: undefined,
  },
];

export const MARKETPLACE_ITEMS: MarketplaceItem[] = [...PREMIOS, ...DONACIONES];

export function getItemById(id: string): MarketplaceItem | undefined {
  return MARKETPLACE_ITEMS.find((item) => item.id === id);
}

export function getItemsByCategory(category: MarketplaceCategory): MarketplaceItem[] {
  return MARKETPLACE_ITEMS.filter((item) => item.category === category);
}

/** Puntos extra que gana el usuario por cada 5 donaciones realizadas */
export const BONUS_POINTS_EVERY_5_DONATIONS = 50;
