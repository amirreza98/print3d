export type Material = 'PLA' | 'ABS' | 'PETG' | 'resin';
export type SizeLabel = 'S' | 'M' | 'L';

export interface Product {
  id: string;
  name: string;
  description: string;
  stlUrl: string;
  thumbnailUrl: string;
  availableMaterials: Material[];
  basePrice: number;
}

export interface PriceBreakdown {
  materialCost: number;
  printTime: number;
  complexityFactor: number;
  total: number;
}

export interface GeometryIssue {
  kind: 'thin_wall' | 'overhang' | 'not_watertight';
  message: string;
  center: [number, number, number];
  size: [number, number, number];
}

export interface Configuration {
  productId: string | null;
  material: Material;
  color: string;
  sizeLabel: SizeLabel;
  weightG: number;
  totalPrice: number;
}

/** One streamed step of the agent loop, rendered in the build log. */
export interface AgentStep {
  id: string;
  agent: 'design' | 'validation' | 'pricing' | 'orchestrator';
  type: 'thinking' | 'tool_call' | 'decision' | 'result';
  label: string;
  detail?: string;
  ts: number;
}

export type AgentEvent =
  | { kind: 'step'; step: AgentStep }
  | { kind: 'config_update'; config: Partial<Configuration> }
  | { kind: 'issues'; issues: GeometryIssue[] }
  | { kind: 'done' };
