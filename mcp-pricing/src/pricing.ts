import type { SizeLabel } from "./schemas.js";

/**
 * The pricing formula lives here — this is the whole reason mcp-pricing exists as a
 * separate service. product-service owns the raw per-gram rates (owner-set); this module
 * turns a rate + weight + size into a customer-facing price breakdown.
 */

/** Fixed per-order setup fee (machine prep, slicing, bed adhesion), in EUR. */
export const SETUP_FEE_EUR = 2.0;

/** Support/infill/waste overhead, as a fraction of material cost. */
export const SUPPORT_FACTOR = 0.15;

/** Handling multiplier by size — larger prints cost more than their linear weight. */
export const SIZE_MULTIPLIERS: Record<SizeLabel, number> = {
  S: 1.0,
  M: 1.25,
  L: 1.6,
};

export const CURRENCY = "EUR" as const;

export interface PriceBreakdown {
  materialCost: number;
  setupFee: number;
  supportCost: number;
  total: number;
  currency: typeof CURRENCY;
  /** Echoed inputs/derivation, useful for the agent to explain the quote. */
  pricePerGram: number;
  sizeMultiplier: number;
}

/** Round to whole cents so a breakdown always sums exactly to its total. */
function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function computePrice(input: {
  weightG: number;
  pricePerGram: number;
  sizeLabel: SizeLabel;
}): PriceBreakdown {
  const sizeMultiplier = SIZE_MULTIPLIERS[input.sizeLabel];

  const materialCost = round2(input.weightG * input.pricePerGram * sizeMultiplier);
  const supportCost = round2(materialCost * SUPPORT_FACTOR);
  const setupFee = round2(SETUP_FEE_EUR);
  const total = round2(materialCost + supportCost + setupFee);

  return {
    materialCost,
    setupFee,
    supportCost,
    total,
    currency: CURRENCY,
    pricePerGram: input.pricePerGram,
    sizeMultiplier,
  };
}
