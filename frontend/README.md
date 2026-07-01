# Fabrica — AI 3D print configurator (frontend)

Next.js frontend for an AI-powered 3D-print product configurator. A customer
describes what they want in plain language; a team of agents configures the
model, validates printability, and prices it — every step streamed live into a
build log beside a real-time 3D viewer.

## Stack

- Next.js 15 (App Router) + TypeScript
- React Three Fiber + drei (WebGL 3D viewer)
- Zustand (shared config state — UI controls and the agent both write to it)
- TanStack Query (server state on the dashboard/storefront)
- Tailwind CSS (workshop-precision design system)
- Native EventSource / SSE (one-directional agent reasoning stream)

## Run it

```bash
cp .env.example .env.local   # defaults are fine for standalone dev
npm install
npm run dev                  # http://localhost:3000
```

Open `/` for the storefront, click any product to reach `/configure/[id]`.

## What works standalone (no backend yet)

Two flags let the frontend run before the microservices exist:

- `lib/api.ts` → `MOCK = true` serves seed products.
- `hooks/useAgentStream.ts` → `SIMULATE = true` runs a local multi-agent
  simulator so the 3D model reconfigures and the build log streams for real.

The 3D viewer renders a procedural fallback mesh until you wire real STL URLs
into the product data (`ProductModel.tsx` already loads STL when `stlUrl` is set).

## Wiring the real backend

When the services are up, flip both flags to `false` and set:

- `NEXT_PUBLIC_API_BASE_URL` → Spring Cloud Gateway
- `NEXT_PUBLIC_AGENT_BASE_URL` → NestJS orchestrator (SSE at `/agent/stream/:id`)

The SSE contract the orchestrator must emit is defined by `AgentEvent` in
`lib/types.ts`: `step`, `config_update`, `issues`, `done`.

## Structure

```
app/
  (storefront)/page.tsx      SSR storefront + product grid
  configure/[id]/            client configurator (3D + agent)
components/
  viewer/                    SceneCanvas · ProductModel · ValidationOverlay
  configurator/              Material · Color · Size · Price
  agent/                     ChatPanel · ReasoningTrace · AgentStep
hooks/useAgentStream.ts      SSE stream + local simulator
store/configStore.ts         Zustand single source of truth
lib/                         types · api client · cn
```

## Next to build (yours — the interview-defensible parts)

- NestJS agent orchestrator with the real multi-agent loop
- MCP servers: pricing (TS) and geometry validation (Python/trimesh)
- Spring Boot product + order services, Stripe checkout, Kafka events
- Eval suite + Prometheus/Grafana observability
