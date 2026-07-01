"""3D-print geometry validation using trimesh + numpy.

Given an STL, decide whether it can actually be printed and return the issues a slicer
would care about, in a shape the frontend can highlight on the 3D viewer.

Rules and thresholds (see README for the rationale):

* not_watertight - the mesh is not a closed solid (``mesh.is_watertight`` is False), so it
  has holes / non-manifold edges and cannot be sliced reliably.
* thin_wall     - regions thinner than ``MIN_WALL_MM`` (0.8 mm), measured by sampling the
  surface and casting a ray to the opposite wall (trimesh thickness sampling).
* overhang      - down-facing faces whose angle from the vertical build axis exceeds
  ``OVERHANG_LIMIT_DEG`` (45 deg) and that sit above the build plate; these need support.
"""

from __future__ import annotations

import io
from collections import defaultdict, deque
from typing import Any
from urllib.parse import urlparse
from urllib.request import url2pathname

import numpy as np
import requests
import trimesh

# ---- Thresholds --------------------------------------------------------------------

MIN_WALL_MM = 0.8
OVERHANG_LIMIT_DEG = 45.0
SURFACE_SAMPLES = 4000
DOWNLOAD_TIMEOUT_S = 30
MIN_BOX_MM = 1.0  # floor on highlight-box size so tiny regions stay visible
MAX_ISSUES_PER_KIND = 12

Issue = dict[str, Any]
Vec3 = list[float]


# ---- Mesh loading ------------------------------------------------------------------

def _read_bytes(stl_url: str) -> bytes:
    """Fetch STL bytes from an http(s) URL, a file:// URL, or a local path."""
    parsed = urlparse(stl_url)
    scheme = parsed.scheme.lower()

    if scheme in ("http", "https"):
        response = requests.get(stl_url, timeout=DOWNLOAD_TIMEOUT_S)
        response.raise_for_status()
        return response.content
    if scheme == "file":
        with open(url2pathname(parsed.path), "rb") as handle:
            return handle.read()
    if scheme == "":  # bare local path
        with open(stl_url, "rb") as handle:
            return handle.read()
    raise ValueError(f"Unsupported URL scheme: {parsed.scheme!r}")


def load_mesh(stl_url: str) -> trimesh.Trimesh:
    """Download and parse an STL into a single Trimesh, or raise ValueError."""
    data = _read_bytes(stl_url)
    loaded = trimesh.load(io.BytesIO(data), file_type="stl")

    if isinstance(loaded, trimesh.Scene):
        geometries = list(loaded.geometry.values())
        if not geometries:
            raise ValueError("STL contained no geometry")
        loaded = trimesh.util.concatenate(geometries)

    if not isinstance(loaded, trimesh.Trimesh) or len(loaded.faces) == 0:
        raise ValueError("STL did not contain a triangle mesh")
    return loaded


# ---- Geometry helpers --------------------------------------------------------------

def _issue(kind: str, message: str, center: np.ndarray, size: np.ndarray) -> Issue:
    """Build one issue in the exact shape the frontend expects."""
    size = np.maximum(np.abs(np.asarray(size, dtype=float)), MIN_BOX_MM)
    center = np.asarray(center, dtype=float)
    return {
        "kind": kind,
        "message": message,
        "center": [round(float(center[0]), 3), round(float(center[1]), 3), round(float(center[2]), 3)],
        "size": [round(float(size[0]), 3), round(float(size[1]), 3), round(float(size[2]), 3)],
    }


def _bbox(points: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    lo = points.min(axis=0)
    hi = points.max(axis=0)
    return (lo + hi) / 2.0, (hi - lo)


def _cluster_points(points: np.ndarray, cell: float) -> list[np.ndarray]:
    """Group points into connected regions via voxel connected-components (26-neighbour).

    Keeps highlight boxes meaningful: one box per contiguous problem area instead of a
    grid of tiny boxes, and no scipy dependency.
    """
    if len(points) == 0:
        return []

    keys = np.floor(points / cell).astype(np.int64)
    voxels: dict[tuple[int, int, int], list[int]] = defaultdict(list)
    for index, key in enumerate(map(tuple, keys)):
        voxels[key].append(index)

    occupied = set(voxels.keys())
    visited: set[tuple[int, int, int]] = set()
    offsets = [
        (dx, dy, dz)
        for dx in (-1, 0, 1)
        for dy in (-1, 0, 1)
        for dz in (-1, 0, 1)
        if not (dx == 0 and dy == 0 and dz == 0)
    ]

    clusters: list[np.ndarray] = []
    for start in occupied:
        if start in visited:
            continue
        component: list[tuple[int, int, int]] = []
        queue = deque([start])
        visited.add(start)
        while queue:
            cx, cy, cz = queue.popleft()
            component.append((cx, cy, cz))
            for dx, dy, dz in offsets:
                neighbour = (cx + dx, cy + dy, cz + dz)
                if neighbour in occupied and neighbour not in visited:
                    visited.add(neighbour)
                    queue.append(neighbour)
        indices: list[int] = []
        for voxel_key in component:
            indices.extend(voxels[voxel_key])
        clusters.append(points[indices])

    clusters.sort(key=len, reverse=True)
    return clusters[:MAX_ISSUES_PER_KIND]


def _cluster_cell(mesh: trimesh.Trimesh) -> float:
    return max(2.0, 0.08 * float(mesh.extents.max()))


# ---- Individual checks -------------------------------------------------------------

def _watertight_issues(mesh: trimesh.Trimesh) -> list[Issue]:
    if mesh.is_watertight:
        return []
    center = mesh.bounds.mean(axis=0)
    size = mesh.extents
    return [
        _issue(
            "not_watertight",
            "Mesh is not a closed solid (not watertight): it has holes or non-manifold "
            "edges and cannot be sliced reliably.",
            center,
            size,
        )
    ]


def _thin_wall_issues(mesh: trimesh.Trimesh) -> list[Issue]:
    points, face_index = trimesh.sample.sample_surface(mesh, SURFACE_SAMPLES)
    normals = mesh.face_normals[face_index]

    thickness = trimesh.proximity.thickness(
        mesh=mesh, points=points, exterior=False, normals=normals, method="ray"
    )
    thickness = np.asarray(thickness, dtype=float)

    # A missed ray reports 0 / non-finite; only flag reliable, genuinely thin measurements.
    mask = np.isfinite(thickness) & (thickness > 1e-4) & (thickness < MIN_WALL_MM)
    thin_points = points[mask]
    if len(thin_points) == 0:
        return []

    issues: list[Issue] = []
    for cluster in _cluster_points(thin_points, _cluster_cell(mesh)):
        center, size = _bbox(cluster)
        issues.append(
            _issue(
                "thin_wall",
                f"Wall thinner than {MIN_WALL_MM} mm (min printable) across ~{len(cluster)} "
                "sampled points; likely too fragile to print.",
                center,
                size,
            )
        )
    return issues


def _overhang_faces(mesh: trimesh.Trimesh) -> tuple[np.ndarray, np.ndarray]:
    """Return (face indices, per-face angle-from-vertical) for down-facing overhangs."""
    nz = mesh.face_normals[:, 2]
    # Angle of the surface from the vertical build axis = arcsin(|nz|):
    # vertical wall (nz=0) -> 0 deg; horizontal ceiling (nz=-1) -> 90 deg.
    angle_from_vertical = np.degrees(np.arcsin(np.clip(np.abs(nz), 0.0, 1.0)))

    z_min = float(mesh.bounds[0, 2])
    z_max = float(mesh.bounds[1, 2])
    bed_eps = max(0.1, 0.02 * max(z_max - z_min, 1e-6))
    on_bed = mesh.triangles_center[:, 2] <= z_min + bed_eps  # base on the plate is not an overhang

    mask = (nz < 0.0) & (angle_from_vertical > OVERHANG_LIMIT_DEG) & (~on_bed)
    return np.nonzero(mask)[0], angle_from_vertical


def _overhang_face_components(mesh: trimesh.Trimesh, face_indices: np.ndarray) -> list[list[int]]:
    """Group overhang faces into connected regions via shared-edge adjacency."""
    overhang = set(int(i) for i in face_indices)
    graph: dict[int, list[int]] = defaultdict(list)
    for a, b in mesh.face_adjacency:
        ai, bi = int(a), int(b)
        if ai in overhang and bi in overhang:
            graph[ai].append(bi)
            graph[bi].append(ai)

    visited: set[int] = set()
    components: list[list[int]] = []
    for face in face_indices.tolist():
        if face in visited:
            continue
        component: list[int] = []
        queue = deque([face])
        visited.add(face)
        while queue:
            current = queue.popleft()
            component.append(current)
            for neighbour in graph[current]:
                if neighbour not in visited:
                    visited.add(neighbour)
                    queue.append(neighbour)
        components.append(component)
    return components


def _overhang_issues(mesh: trimesh.Trimesh) -> list[Issue]:
    face_indices, angle_from_vertical = _overhang_faces(mesh)
    if len(face_indices) == 0:
        return []

    components = _overhang_face_components(mesh, face_indices)
    face_areas = mesh.area_faces
    # Largest regions first, capped, so a busy model does not flood the viewer.
    components.sort(key=lambda faces: float(face_areas[faces].sum()), reverse=True)

    issues: list[Issue] = []
    for faces in components[:MAX_ISSUES_PER_KIND]:
        vertices = mesh.vertices[mesh.faces[faces].reshape(-1)]
        center, size = _bbox(vertices)
        areas = face_areas[faces]
        mean_angle = float(np.average(angle_from_vertical[faces], weights=areas))
        issues.append(
            _issue(
                "overhang",
                f"Down-facing overhang ~{mean_angle:.0f} deg from vertical (> "
                f"{OVERHANG_LIMIT_DEG:.0f} deg); will need support.",
                center,
                size,
            )
        )
    return issues


# ---- Public entry point ------------------------------------------------------------

def check_printability(stl_url: str) -> dict[str, Any]:
    """Validate an STL and return ``{"printable": bool, "issues": [...]}``.

    ``printable`` is False when there is a *blocking* defect (not watertight, or thin
    walls). Overhangs are reported as issues but are advisory - they print fine with
    support - so they do not on their own flip ``printable`` to False.
    """
    mesh = load_mesh(stl_url)

    issues: list[Issue] = []
    issues.extend(_watertight_issues(mesh))
    issues.extend(_thin_wall_issues(mesh))
    issues.extend(_overhang_issues(mesh))

    blocking = [issue for issue in issues if issue["kind"] in ("not_watertight", "thin_wall")]
    return {"printable": len(blocking) == 0, "issues": issues}
