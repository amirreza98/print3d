# mcp-pricing

An **MCP (Model Context Protocol) server** that exposes 3D-print pricing as tools the AI
agent orchestrator can call. It **owns the pricing formula**; the raw per-gram material
rates are owned by `product-service` (which owns the `material_price` table). This server
fetches those rates over HTTP and applies the calculation — a clean separation between
*owner-set rates* (product-service) and *pricing logic* (mcp-pricing).

## What is MCP?

The Model Context Protocol is an open standard that lets an AI application (the "host",
e.g. an agent orchestrator) connect to external capabilities through a uniform JSON-RPC
interface. A **server** like this one advertises **tools** — named operations with a JSON
input schema — that the model can invoke, plus optional resources and prompts. The host
speaks to the server over a **transport** (local `stdio` for spawned processes, or
HTTP/SSE for remote servers), so the same tool works regardless of where it runs.

## Stack

- TypeScript, ESM, Node 22
- `@modelcontextprotocol/sdk` (the official SDK) — low-level `Server` with explicit tool
  registration
- `zod` for runtime input validation
- `express` for the HTTP/SSE transport
- Native `fetch` for the product-service call

## Tools

### `estimate_price`

Compute a full EUR price breakdown for a configured print.

**Input schema**

```json
{
  "type": "object",
  "properties": {
    "productId": { "type": "string", "description": "Catalog product slug, e.g. \"phone-stand\"." },
    "material":  { "type": "string", "enum": ["PLA", "ABS", "PETG", "resin"] },
    "sizeLabel": { "type": "string", "enum": ["S", "M", "L"] },
    "weightG":   { "type": "number", "exclusiveMinimum": 0, "description": "Estimated printed weight in grams." }
  },
  "required": ["productId", "material", "sizeLabel", "weightG"],
  "additionalProperties": false
}
```

**Behaviour** — fetches `GET {PRODUCT_SERVICE_URL}/api/products/{productId}`, finds the
`pricePerGram` for the requested `material` + `sizeLabel`, then computes:

```
sizeMultiplier ∈ { S: 1.0, M: 1.25, L: 1.6 }
materialCost = round2(weightG × pricePerGram × sizeMultiplier)
supportCost  = round2(materialCost × 0.15)      # support/infill/waste overhead
setupFee     = 2.00                             # fixed per-order fee
total        = materialCost + supportCost + setupFee
```

**Result** (inside the MCP tool result's text content, as JSON):

```json
{
  "productId": "phone-stand",
  "material": "PLA",
  "sizeLabel": "M",
  "weightG": 40,
  "materialCost": 2.15,
  "setupFee": 2,
  "supportCost": 0.32,
  "total": 4.47,
  "currency": "EUR",
  "pricePerGram": 0.043,
  "sizeMultiplier": 1.25
}
```

If the product does not offer the requested material/size, the tool returns a clear MCP
error (`-32602 InvalidParams`) listing the available combinations. Unknown products and
unreachable product-service also map to descriptive MCP errors.

### `list_material_rates`

Discover valid material/size combinations for a product before pricing.

**Input schema**

```json
{
  "type": "object",
  "properties": {
    "productId": { "type": "string", "description": "Catalog product slug, e.g. \"phone-stand\"." }
  },
  "required": ["productId"],
  "additionalProperties": false
}
```

**Result**

```json
{
  "productId": "phone-stand",
  "availableMaterials": ["PLA", "PETG"],
  "rates": [
    { "material": "PLA",  "sizeLabel": "S", "pricePerGram": 0.045 },
    { "material": "PLA",  "sizeLabel": "M", "pricePerGram": 0.043 },
    { "material": "PETG", "sizeLabel": "S", "pricePerGram": 0.06 }
  ]
}
```

## Configuration

| Variable              | Default                 | Meaning                                             |
|-----------------------|-------------------------|-----------------------------------------------------|
| `PRODUCT_SERVICE_URL` | `http://localhost:8081` | Base URL of product-service (source of the rates)   |
| `MCP_TRANSPORT`       | `stdio`                 | `stdio` (spawned) or `http` (remote SSE)            |
| `PORT`                | `8083`                  | HTTP/SSE port (only when `MCP_TRANSPORT=http`)      |

## Build & run

```bash
npm install
npm run typecheck   # tsc --noEmit
npm run build       # tsc -> dist/

# stdio (default) — usually spawned by the MCP host, not run by hand
npm start

# remote HTTP/SSE transport
MCP_TRANSPORT=http PORT=8083 npm start
```

## How the orchestrator connects

This server supports the two standard MCP transports; the orchestrator picks one.

### 1. Local (stdio)

The host spawns the process and speaks JSON-RPC over stdin/stdout. All logging goes to
stderr so it never corrupts the protocol stream. Example MCP client config:

```json
{
  "mcpServers": {
    "pricing": {
      "command": "node",
      "args": ["/abs/path/to/mcp-pricing/dist/index.js"],
      "env": {
        "PRODUCT_SERVICE_URL": "http://localhost:8081"
      }
    }
  }
}
```

### 2. Remote (HTTP/SSE)

Run with `MCP_TRANSPORT=http`. The server exposes:

- `GET /sse` — opens the SSE event stream; the server assigns a `sessionId` and tells the
  client which endpoint to post to.
- `POST /messages?sessionId=<id>` — the client sends JSON-RPC requests here.
- `GET /healthz` — liveness probe.

An MCP host connects its SSE client to `http://<host>:8083/sse` and the SDK handles the
`sessionId` handshake. This is the mode the agent orchestrator uses to reach the server
across the network (e.g. container-to-container).

Once connected, the agent lists tools (`tools/list`) and calls them (`tools/call`) — for
example, calling `list_material_rates` to discover options, then `estimate_price` to quote
a configured print.

## Docker

```bash
docker build -t fabrica/mcp-pricing .
# Runs the HTTP/SSE transport by default (see Dockerfile)
docker run --rm -p 8083:8083 \
  -e PRODUCT_SERVICE_URL=http://host.docker.internal:8081 \
  fabrica/mcp-pricing
```
