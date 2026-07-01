'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useConfigStore } from '@/store/configStore';
import { SceneCanvas } from '@/components/viewer/SceneCanvas';
import { MaterialSelector } from '@/components/configurator/MaterialSelector';
import { ColorPicker } from '@/components/configurator/ColorPicker';
import { SizeSelector } from '@/components/configurator/SizeSelector';
import { PriceDisplay } from '@/components/configurator/PriceDisplay';
import { ChatPanel } from '@/components/agent/ChatPanel';

export function ConfiguratorShell({ productId }: { productId: string }) {
  const reset = useConfigStore((s) => s.reset);
  const setSession = useConfigStore((s) => s.setSession);

  const { data: product } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => api.getProduct(productId),
  });

  useEffect(() => {
    reset(productId);
    setSession(crypto.randomUUID());
  }, [productId, reset, setSession]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 h-14 border-b border-line">
        <Link href="/" className="font-sans font-medium tracking-tight">
          Fabrica<span className="text-filament">.</span>
        </Link>
        <p className="measure text-xs text-ink-muted">
          {product?.name ?? 'loading…'}
        </p>
      </header>

      <div className="flex-1 grid lg:grid-cols-[1fr_400px]">
        {/* viewer */}
        <div className="relative min-h-[440px] border-b lg:border-b-0 lg:border-r border-line">
          {product && <SceneCanvas stlUrl={product.stlUrl} />}
          <div className="absolute left-4 bottom-4 measure text-[11px] text-blueprint/70">
            drag to orbit · scroll to zoom
          </div>
        </div>

        {/* controls + agent */}
        <aside className="p-5 flex flex-col gap-5 overflow-y-auto">
          <ChatPanel />

          <div className="border-t border-line pt-5 flex flex-col gap-4">
            <p className="eyebrow">Or set it manually</p>
            {product && <MaterialSelector options={product.availableMaterials} />}
            <ColorPicker />
            <SizeSelector />
          </div>

          <PriceDisplay />

          <Link href="#" className="btn btn-primary w-full">
            Add to cart
          </Link>
        </aside>
      </div>
    </div>
  );
}
