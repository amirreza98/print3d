#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { loadConfig } from "./config.js";
import { startHttpServer } from "./http.js";
import { ProductClient } from "./productClient.js";
import { createServer } from "./server.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const productClient = new ProductClient(config.productServiceUrl);

  if (config.transport === "http") {
    await startHttpServer({ config, productClient });
    return;
  }

  // stdio: the default. The client (orchestrator / Claude Desktop / etc.) spawns this
  // process and speaks JSON-RPC over stdout, so all logging must go to stderr.
  const server = createServer({ productClient });
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`mcp-pricing stdio server ready -> product-service ${config.productServiceUrl}`);
}

main().catch((error: unknown) => {
  console.error("mcp-pricing failed to start:", error);
  process.exit(1);
});
