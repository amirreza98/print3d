# mcp-validation

An **MCP (Model Context Protocol) server** that validates 3D-print geometry. Given an STL,
it decides whether the model can actually be printed and returns the problem regions in a
shape the frontend highlights in red on the 3D viewer. Built in Python with the MCP SDK
(**FastMCP**) and `trimesh` + `numpy`.

## What is MCP?

The Model Context Protocol is an open standard that lets an AI application (the "host",
e.g. the agent orchestrator) call external capabilities over a uniform JSON-RPC interface.
A **server** like this advertises **tools** — named operations with a typed input schema —
that the model can invoke. The host connects over a **transport**: local `stdio` for a
spawned process, or HTTP/SSE for a remote server.

## Tool: `check_printability`

Downloads an STL, loads it with trimesh, and runs three checks.

### Input

```json
{
  "type": "object",
  "properties": {
    "stlUrl": { "type": "string", "description": "S3/HTTP(S) URL to the STL file to validate." }
  },
  "required": ["stlUrl"]
}
```

`stlUrl` accepts `http(s)://`, `file://`, or a bare local path.

### Output

```json
{
  "printable": true,
  "issues": [
    {
      "kind": "overhang",
      "message": "Down-facing overhang ~90 deg from vertical (> 45 deg); will need support.",
      "center": [15.0, 6.0, 15.0],
      "size": [20.0, 12.0, 1.0]
    }
  ]
}
```

Each issue matches the frontend's `GeometryIssue` exactly:

| Field     | Type                                          | Meaning                                            |
|-----------|-----------------------------------------------|----------------------------------------------------|
| `kind`    | `"not_watertight" \| "thin_wall" \| "overhang"` | Which rule fired                                   |
| `message` | `string`                                      | Human-readable explanation                         |
| `center`  | `[x, y, z]`                                    | Centre of the highlight box (model units, mm)      |
| `size`    | `[x, y, z]`                                    | Size of the highlight box (mm)                     |

## Printability rules & thresholds

| Rule             | How it's detected                                                                                                                   | Threshold            |
|------------------|-------------------------------------------------------------------------------------------------------------------------------------|----------------------|
| `not_watertight` | `mesh.is_watertight` is False — the mesh has holes / non-manifold edges and can't be sliced into a solid. One box over the whole model. | closed solid required |
| `thin_wall`      | Sample the surface, cast a ray to the opposite wall (trimesh thickness sampling); flag samples whose wall thickness is below the minimum. Thin points are grouped into regions. | **0.8 mm** min wall  |
| `overhang`       | From face normals: a face is an overhang when it faces **downward** (`normal.z < 0`) and its angle from the vertical build axis, `arcsin(\|normal.z\|)`, exceeds the limit — and it isn't the base resting on the build plate. Faces up to the limit are self-supporting. Adjacent overhang faces are grouped into regions. | **45°** from vertical |

Tunable constants live at the top of `mcp_validation/validation.py`
(`MIN_WALL_MM`, `OVERHANG_LIMIT_DEG`, `SURFACE_SAMPLES`).

### `printable` semantics

`printable` is `false` when there is a **blocking** defect — `not_watertight` or
`thin_wall`. **Overhangs are advisory**: they still appear in `issues` (so the viewer can
show where support is needed) but they print fine with support, so they do not on their own
make a model unprintable.

## Configuration

| Variable        | Default   | Meaning                                        |
|-----------------|-----------|------------------------------------------------|
| `MCP_TRANSPORT` | `stdio`   | `stdio` (spawned) or `http` (remote SSE)       |
| `HOST`          | `0.0.0.0` | Bind host for the HTTP/SSE transport           |
| `PORT`          | `8084`    | Port for the HTTP/SSE transport                |

## Install & run

```bash
python -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt

# stdio (default) — usually spawned by the MCP host, not run by hand
python -m mcp_validation

# remote HTTP/SSE transport
MCP_TRANSPORT=http PORT=8084 python -m mcp_validation
```

## Sample & proof script

`samples/table_overhang.stl` is a watertight "table" whose tabletop underside is a
down-facing overhang above the build plate. Prove the tool runs and returns the expected
JSON shape:

```bash
python scripts/smoke_test.py
```

It runs `check_printability` on the sample, prints the JSON, and asserts the exact
`{ printable, issues:[{kind,message,center,size}] }` contract. To regenerate the sample
(needs the dev extra `manifold3d`):

```bash
pip install -r requirements-dev.txt
python scripts/make_sample.py
```

## How the orchestrator connects

### Local (stdio)

The host spawns the process and speaks JSON-RPC over stdin/stdout:

```json
{
  "mcpServers": {
    "validation": {
      "command": "python",
      "args": ["-m", "mcp_validation"],
      "cwd": "/abs/path/to/mcp-validation"
    }
  }
}
```

### Remote (HTTP/SSE)

Run with `MCP_TRANSPORT=http`. FastMCP serves the SSE stream at `GET /sse` and accepts
JSON-RPC messages at `POST /messages`. The orchestrator points its SSE client at
`http://<host>:8084/sse`; the SDK handles the session handshake. This is the mode used to
reach the server across the network (e.g. container-to-container). Once connected, the
agent lists tools (`tools/list`) and calls `check_printability` with an `stlUrl`.

## Docker

```bash
docker build -t fabrica/mcp-validation .
# Runs the HTTP/SSE transport by default (see Dockerfile)
docker run --rm -p 8084:8084 fabrica/mcp-validation
```
