import { create } from 'zustand';
import type {
  Material,
  SizeLabel,
  Configuration,
  GeometryIssue,
} from '@/lib/types';

interface ConfigState extends Configuration {
  sessionId: string | null;
  issues: GeometryIssue[];

  setMaterial: (m: Material) => void;
  setColor: (c: string) => void;
  setSize: (s: SizeLabel) => void;
  setPrice: (total: number, weightG: number) => void;
  setSession: (id: string) => void;
  setIssues: (issues: GeometryIssue[]) => void;

  /** The agent writes here. UI and 3D viewer react automatically. */
  applyAgentConfig: (partial: Partial<Configuration>) => void;
  reset: (productId: string) => void;
}

const initial: Configuration = {
  productId: null,
  material: 'PLA',
  color: '#E8590C',
  sizeLabel: 'M',
  weightG: 0,
  totalPrice: 0,
};

export const useConfigStore = create<ConfigState>((set) => ({
  ...initial,
  sessionId: null,
  issues: [],

  setMaterial: (material) => set({ material }),
  setColor: (color) => set({ color }),
  setSize: (sizeLabel) => set({ sizeLabel }),
  setPrice: (totalPrice, weightG) => set({ totalPrice, weightG }),
  setSession: (sessionId) => set({ sessionId }),
  setIssues: (issues) => set({ issues }),

  applyAgentConfig: (partial) => set(partial),
  reset: (productId) => set({ ...initial, productId }),
}));
