"""FastMCP server exposing 3D-print geometry validation as an MCP tool."""

from __future__ import annotations

import os
from typing import Annotated, Any

from mcp.server.fastmcp import FastMCP
from mcp.server.fastmcp.exceptions import ToolError
from pydantic import Field

from .validation import check_printability as _check_printability

TOOL_DESCRIPTION = (
    "Validate whether a 3D model can actually be printed. Downloads the STL at the given "
    "URL, loads it with trimesh, and checks three things: (1) not_watertight - the mesh "
    "is not a closed solid; (2) thin_wall - regions thinner than 0.8 mm; (3) overhang - "
    "down-facing faces steeper than 45 deg from vertical that need support. Returns "
    "{ printable: bool, issues: [...] } where each issue is "
    "{ kind, message, center:[x,y,z], size:[x,y,z] } so the viewer can highlight it in red."
)


def build_server() -> FastMCP:
    """Construct the FastMCP server with the validation tool registered."""
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "8084"))
    mcp = FastMCP("mcp-validation", host=host, port=port)

    @mcp.tool(name="check_printability", description=TOOL_DESCRIPTION)
    def check_printability(
        stlUrl: Annotated[str, Field(description="S3/HTTP(S) URL to the STL file to validate.")],
    ) -> dict[str, Any]:
        try:
            return _check_printability(stlUrl)
        except FileNotFoundError as exc:
            raise ToolError(f"STL file not found: {stlUrl}") from exc
        except ValueError as exc:
            raise ToolError(f"Could not load STL: {exc}") from exc
        except Exception as exc:  # network, parse, etc. -> a clean MCP tool error
            raise ToolError(f"Failed to validate STL at {stlUrl}: {exc}") from exc

    return mcp
