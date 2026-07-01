import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
  type CallToolResult,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";

import { computePrice } from "./pricing.js";
import {
  ProductNotFoundError,
  ProductServiceError,
  type MaterialRate,
  type ProductClient,
} from "./productClient.js";
import {
  estimatePriceInput,
  estimatePriceJsonSchema,
  formatZodError,
  listMaterialRatesInput,
  listMaterialRatesJsonSchema,
} from "./schemas.js";

const SERVER_NAME = "mcp-pricing";
const SERVER_VERSION = "0.1.0";

const TOOLS: Tool[] = [
  {
    name: "estimate_price",
    description:
      "Estimate the price to 3D-print a product in a given material, size and weight. " +
      "Fetches the owner-set per-gram rate from product-service and applies the pricing " +
      "formula (material cost x size multiplier, support overhead, fixed setup fee). " +
      "Returns a EUR breakdown. Errors if the material/size is not offered by the product.",
    inputSchema: estimatePriceJsonSchema,
  },
  {
    name: "list_material_rates",
    description:
      "List the materials and per-gram rates available for a product, as set by the " +
      "owner in product-service. Use this to discover valid material/size combinations " +
      "before calling estimate_price.",
    inputSchema: listMaterialRatesJsonSchema,
  },
];

function textResult(payload: unknown): CallToolResult {
  return { content: [{ type: "text", text: JSON.stringify(payload, null, 2) }] };
}

function describeAvailable(rates: MaterialRate[]): string {
  if (rates.length === 0) return "none";
  return rates.map((r) => `${r.material}/${r.sizeLabel}`).join(", ");
}

/**
 * Build a fully-wired MCP server. A fresh instance is created per transport connection
 * (one for stdio, one per SSE session) since a Server binds to a single transport.
 */
export function createServer(deps: { productClient: ProductClient }): Server {
  const server = new Server(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

  server.setRequestHandler(CallToolRequestSchema, async (request): Promise<CallToolResult> => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case "estimate_price":
        return estimatePrice(deps.productClient, args);
      case "list_material_rates":
        return listMaterialRates(deps.productClient, args);
      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  });

  return server;
}

async function estimatePrice(
  productClient: ProductClient,
  args: unknown,
): Promise<CallToolResult> {
  const parsed = estimatePriceInput.safeParse(args);
  if (!parsed.success) {
    throw new McpError(ErrorCode.InvalidParams, formatZodError(parsed.error));
  }
  const { productId, material, sizeLabel, weightG } = parsed.data;

  const product = await fetchProduct(productClient, productId);

  const rate = product.materialPrices.find(
    (r) => r.material === material && r.sizeLabel === sizeLabel,
  );
  if (!rate) {
    throw new McpError(
      ErrorCode.InvalidParams,
      `Product '${productId}' does not offer ${material}/${sizeLabel}. ` +
        `Available combinations: ${describeAvailable(product.materialPrices)}.`,
    );
  }

  const breakdown = computePrice({ weightG, pricePerGram: rate.pricePerGram, sizeLabel });

  return textResult({
    productId,
    material,
    sizeLabel,
    weightG,
    ...breakdown,
  });
}

async function listMaterialRates(
  productClient: ProductClient,
  args: unknown,
): Promise<CallToolResult> {
  const parsed = listMaterialRatesInput.safeParse(args);
  if (!parsed.success) {
    throw new McpError(ErrorCode.InvalidParams, formatZodError(parsed.error));
  }

  const product = await fetchProduct(productClient, parsed.data.productId);

  return textResult({
    productId: product.id,
    availableMaterials: product.availableMaterials ?? [],
    rates: product.materialPrices.map((r) => ({
      material: r.material,
      sizeLabel: r.sizeLabel,
      pricePerGram: r.pricePerGram,
    })),
  });
}

/** Fetch a product, translating client errors into clear MCP errors. */
async function fetchProduct(productClient: ProductClient, productId: string) {
  try {
    return await productClient.getProduct(productId);
  } catch (error) {
    if (error instanceof ProductNotFoundError) {
      throw new McpError(ErrorCode.InvalidParams, error.message);
    }
    if (error instanceof ProductServiceError) {
      throw new McpError(ErrorCode.InternalError, error.message);
    }
    throw error;
  }
}
