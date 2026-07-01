"""Generate the committed sample STL: a watertight 'table' with a printability overhang.

The tabletop is held up by two legs, so its underside (between and beyond the legs) is a
down-facing surface above the build plate - a classic overhang that needs support, while
the model stays a closed, printable solid.

Run once to (re)generate samples/table_overhang.stl. Requires `manifold3d` for the boolean
union (a dev-only dependency; the server itself does not need it):

    pip install manifold3d
    python scripts/make_sample.py
"""

from __future__ import annotations

import os

import trimesh

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, "..", "samples", "table_overhang.stl"))


def build_table() -> trimesh.Trimesh:
    top = trimesh.creation.box(extents=[30, 12, 3])
    top.apply_translation([15, 6, 16.5])
    leg_a = trimesh.creation.box(extents=[4, 12, 15])
    leg_a.apply_translation([3, 6, 7.5])
    leg_b = trimesh.creation.box(extents=[4, 12, 15])
    leg_b.apply_translation([27, 6, 7.5])
    return trimesh.boolean.union([top, leg_a, leg_b])


def main() -> None:
    mesh = build_table()
    if not mesh.is_watertight:
        raise SystemExit("expected a watertight union; got a non-watertight mesh")
    mesh.export(OUT)
    print(f"wrote {OUT} (watertight={mesh.is_watertight}, faces={len(mesh.faces)})")


if __name__ == "__main__":
    main()
