import type { Product } from './types';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

/**
 * Until the product-service is live, these return seed data so the
 * frontend runs standalone. Swap MOCK to false once the gateway is up.
 */
const MOCK = true;

const seed: Product[] = [
  {
    id: 'phone-stand',
    name: 'Adjustable phone stand',
    description: 'Angled desk stand with a cable channel.',
    stlUrl: '',
    thumbnailUrl: '',
    availableMaterials: ['PLA', 'PETG', 'ABS'],
    basePrice: 12.5,
  },
  {
    id: 'planter',
    name: 'Geometric planter',
    description: 'Faceted low-poly planter with drainage.',
    stlUrl: '',
    thumbnailUrl: '',
    availableMaterials: ['PLA', 'PETG'],
    basePrice: 18.0,
  },
  {
    id: 'bracket',
    name: 'Wall mount bracket',
    description: 'Load-bearing L-bracket, screw-ready.',
    stlUrl: '',
    thumbnailUrl: '',
    availableMaterials: ['ABS', 'PETG', 'resin'],
    basePrice: 9.0,
  },
];

export const api = {
  listProducts: (): Promise<Product[]> =>
    MOCK ? Promise.resolve(seed) : get<Product[]>('/api/products'),

  getProduct: (id: string): Promise<Product> =>
    MOCK
      ? Promise.resolve(seed.find((p) => p.id === id) ?? seed[0])
      : get<Product>(`/api/products/${id}`),
};
