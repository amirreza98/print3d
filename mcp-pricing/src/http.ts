import express, { type Request, type Response } from "express";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

import type { Config } from "./config.js";
import type { ProductClient } from "./productClient.js";
import { createServer } from "./server.js";

/**
 * Start the remote HTTP/SSE transport. The orchestrator opens an SSE stream at
 * `GET /sse` and posts JSON-RPC messages to `POST /messages?sessionId=...`. Each SSE
 * connection gets its own Server instance and transport, tracked by session id.
 *
 * Note: no body parser is mounted on `/messages` — SSEServerTransport reads the raw
 * request stream itself, and parsing it first would break message handling.
 */
export async function startHttpServer(deps: {
  config: Config;
  productClient: ProductClient;
}): Promise<void> {
  const app = express();
  const transports = new Map<string, SSEServerTransport>();

  app.get("/healthz", (_req: Request, res: Response) => {
    res.json({ status: "ok", productServiceUrl: deps.config.productServiceUrl });
  });

  app.get("/sse", async (_req: Request, res: Response) => {
    const transport = new SSEServerTransport("/messages", res);
    transports.set(transport.sessionId, transport);

    res.on("close", () => {
      transports.delete(transport.sessionId);
    });

    const server = createServer({ productClient: deps.productClient });
    await server.connect(transport);
  });

  app.post("/messages", async (req: Request, res: Response) => {
    const sessionId = req.query.sessionId;
    if (typeof sessionId !== "string") {
      res.status(400).send("Missing sessionId query parameter");
      return;
    }
    const transport = transports.get(sessionId);
    if (!transport) {
      res.status(404).send("No active SSE session for the given sessionId");
      return;
    }
    await transport.handlePostMessage(req, res);
  });

  await new Promise<void>((resolve) => {
    app.listen(deps.config.port, () => {
      // stderr: stdout is reserved for the stdio transport's JSON-RPC stream.
      console.error(
        `mcp-pricing SSE server listening on :${deps.config.port} ` +
          `(GET /sse, POST /messages) -> product-service ${deps.config.productServiceUrl}`,
      );
      resolve();
    });
  });
}
