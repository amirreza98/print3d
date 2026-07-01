'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { useConfigStore } from '@/store/configStore';
import { ProductModel } from './ProductModel';
import { ValidationOverlay } from './ValidationOverlay';

export function SceneCanvas({ stlUrl }: { stlUrl: string }) {
  const color = useConfigStore((s) => s.color);
  const material = useConfigStore((s) => s.material);
  const issues = useConfigStore((s) => s.issues);

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [3.2, 2.2, 3.2], fov: 42 }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={['#F1F0EA']} />
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[6, 8, 4]}
        intensity={1.1}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      <Suspense fallback={null}>
        <group position={[0, 0.2, 0]}>
          <ProductModel url={stlUrl} color={color} material={material} />
          <ValidationOverlay issues={issues} />
        </group>
        <Environment preset="city" />
      </Suspense>

      <ContactShadows
        position={[0, -1.1, 0]}
        opacity={0.35}
        scale={10}
        blur={2.4}
        far={4}
      />
      <OrbitControls
        enablePan={false}
        minDistance={2.5}
        maxDistance={8}
        autoRotate
        autoRotateSpeed={0.6}
      />
    </Canvas>
  );
}
