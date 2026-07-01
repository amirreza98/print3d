"""mcp-validation: an MCP server for 3D-print geometry validation."""

from .validation import check_printability

__all__ = ["check_printability"]
__version__ = "0.1.0"
