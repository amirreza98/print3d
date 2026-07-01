/** Runtime configuration, resolved from environment variables. */
export interface Config {
  /** Base URL of product-service, which owns the material_price rates. */
  productServiceUrl: string;
  /** Port for the HTTP/SSE transport (ignored in stdio mode). */
  port: number;
  /** Which transport to start. `stdio` for local spawn, `http` for remote SSE. */
  transport: "stdio" | "http";
}

export function loadConfig(): Config {
  const productServiceUrl = (process.env.PRODUCT_SERVICE_URL ?? "http://localhost:8081").replace(/\/+$/, "");
  const port = Number.parseInt(process.env.PORT ?? "8083", 10);
  if (Number.isNaN(port)) {
    throw new Error(`Invalid PORT: ${process.env.PORT}`);
  }

  const raw = (process.env.MCP_TRANSPORT ?? "stdio").toLowerCase();
  const transport = raw === "http" || raw === "sse" ? "http" : "stdio";

  return { productServiceUrl, port, transport };
}
