"""Entry point. Selects the MCP transport from the environment.

* MCP_TRANSPORT=stdio (default) - spawned by an MCP host over stdin/stdout.
* MCP_TRANSPORT=http|sse        - remote HTTP/SSE transport on HOST:PORT for the
  orchestrator (FastMCP serves GET /sse and POST /messages).
"""

from __future__ import annotations

import os

from .server import build_server


def main() -> None:
    mcp = build_server()
    transport = os.environ.get("MCP_TRANSPORT", "stdio").lower()
    if transport in ("http", "sse"):
        mcp.run(transport="sse")
    else:
        mcp.run()


if __name__ == "__main__":
    main()
