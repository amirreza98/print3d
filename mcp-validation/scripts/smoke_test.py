"""Prove check_printability runs and returns the expected JSON shape.

Runs the validator against the committed sample STL and asserts the contract the frontend
relies on. Uses only the server's runtime dependencies (no MCP client needed).

    python scripts/smoke_test.py
"""

from __future__ import annotations

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from mcp_validation.validation import check_printability  # noqa: E402

VALID_KINDS = {"not_watertight", "thin_wall", "overhang"}


def main() -> None:
    here = os.path.dirname(os.path.abspath(__file__))
    sample = os.path.abspath(os.path.join(here, "..", "samples", "table_overhang.stl"))
    stl_url = "file://" + sample

    result = check_printability(stl_url)
    print(json.dumps(result, indent=2))

    # ---- Assert the exact shape the frontend expects -------------------------------
    assert set(result.keys()) == {"printable", "issues"}, result.keys()
    assert isinstance(result["printable"], bool)
    assert isinstance(result["issues"], list)

    for issue in result["issues"]:
        assert set(issue.keys()) == {"kind", "message", "center", "size"}, issue.keys()
        assert issue["kind"] in VALID_KINDS, issue["kind"]
        assert isinstance(issue["message"], str) and issue["message"]
        assert isinstance(issue["center"], list) and len(issue["center"]) == 3
        assert isinstance(issue["size"], list) and len(issue["size"]) == 3
        assert all(isinstance(v, (int, float)) for v in issue["center"] + issue["size"])

    kinds = sorted({issue["kind"] for issue in result["issues"]})
    print(
        f"\nOK: shape valid. printable={result['printable']} "
        f"issues={len(result['issues'])} kinds={kinds}"
    )
    assert "overhang" in kinds, "expected the sample table to report an overhang"


if __name__ == "__main__":
    main()
