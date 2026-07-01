'use client';

import { useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import * as THREE from 'three';
import type { Material } from '@/lib/types';

function surfaceProps(material: Material) {
  switch (material) {
    case 'resin':
      return { roughness: 0.15, metalness: 0.05 };
    case 'ABS':
      return { roughness: 0.7, metalness: 0.0 };
    case 'PETG':
      return { roughness: 0.45, metalness: 0.05 };
    default:
      return { roughness: 0.6, metalness: 0.0 }; // PLA
  }
}

/** Fallback geometry so the scene is never empty during development. */
function FallbackMesh({ color, material }: { color: string; material: Material }) {
  const geometry = useMemo(() => new THREE.TorusKnotGeometry(1, 0.32, 180, 24), []);
  const props = surfaceProps(material);
  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color={color} {...props} />
    </mesh>
  );
}

function StlMesh({
  url,
  color,
  material,
}: {
  url: string;
  color: string;
  material: Material;
}) {
  const geometry = useLoader(STLLoader, url);
  const centered = useMemo(() => {
    geometry.center();
    geometry.computeVertexNormals();
    return geometry;
  }, [geometry]);
  const props = surfaceProps(material);
  return (
    <mesh geometry={centered} castShadow receiveShadow>
      <meshStandardMaterial color={color} {...props} />
    </mesh>
  );
}

export function ProductModel({
  url,
  color,
  material,
}: {
  url: string;
  color: string;
  material: Material;
}) {
  if (!url) return <FallbackMesh color={color} material={material} />;
  return <StlMesh url={url} color={color} material={material} />;
}
