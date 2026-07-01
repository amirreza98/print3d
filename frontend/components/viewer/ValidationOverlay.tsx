'use client';

import type { GeometryIssue } from '@/lib/types';

export function ValidationOverlay({ issues }: { issues: GeometryIssue[] }) {
  return (
    <>
      {issues.map((issue, i) => (
        <mesh key={i} position={issue.center}>
          <boxGeometry args={issue.size} />
          <meshStandardMaterial
            color="#E24B4A"
            transparent
            opacity={0.32}
            depthWrite={false}
          />
        </mesh>
      ))}
    </>
  );
}
