import { z } from "zod";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";

/** Materials and sizes mirror product-service's material_price CHECK constraints. */
export const MATERIALS = ["PLA", "ABS", "PETG", "resin"] as const;
export const SIZES = ["S", "M", "L"] as const;

export type Material = (typeof MATERIALS)[number];
export type SizeLabel = (typeof SIZES)[number];

// ---- Runtime validation (zod) ------------------------------------------------------

export const estimatePriceInput = z.object({
  productId: z.string().min(1, "productId is required"),
  material: z.enum(MATERIALS),
  sizeLabel: z.enum(SIZES),
  weightG: z.number().positive("weightG must be greater than 0"),
});
export type EstimatePriceInput = z.infer<typeof estimatePriceInput>;

export const listMaterialRatesInput = z.object({
  productId: z.string().min(1, "productId is required"),
});
export type ListMaterialRatesInput = z.infer<typeof listMaterialRatesInput>;

// ---- JSON Schemas advertised to MCP clients ----------------------------------------
// Hand-written (single source of truth for the wire contract) and kept in step with the
// zod schemas above via the shared MATERIALS / SIZES arrays.

export const estimatePriceJsonSchema: Tool["inputSchema"] = {
  type: "object",
  properties: {
    productId: {
      type: "string",
      description: "Catalog product slug, e.g. \"phone-stand\".",
    },
    material: {
      type: "string",
      enum: [...MATERIALS],
      description: "Print material; must be offered by the product.",
    },
    sizeLabel: {
      type: "string",
      enum: [...SIZES],
      description: "Size variant: S, M or L.",
    },
    weightG: {
      type: "number",
      exclusiveMinimum: 0,
      description: "Estimated printed weight in grams.",
    },
  },
  required: ["productId", "material", "sizeLabel", "weightG"],
  additionalProperties: false,
};

export const listMaterialRatesJsonSchema: Tool["inputSchema"] = {
  type: "object",
  properties: {
    productId: {
      type: "string",
      description: "Catalog product slug, e.g. \"phone-stand\".",
    },
  },
  required: ["productId"],
  additionalProperties: false,
};

/** Turn a ZodError into a single readable line for an MCP InvalidParams error. */
export function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.join(".");
      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join("; ");
}
