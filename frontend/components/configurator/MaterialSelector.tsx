'use client';

import { useConfigStore } from '@/store/configStore';
import { cn } from '@/lib/cn';
import type { Material } from '@/lib/types';

export function MaterialSelector({ options }: { options: Material[] }) {
  const material = useConfigStore((s) => s.material);
  const setMaterial = useConfigStore((s) => s.setMaterial);

  return (
    <div>
      <p className="eyebrow mb-2">Material</p>
      <div className="flex gap-1.5">
        {options.map((m) => (
          <button
            key={m}
            onClick={() => setMaterial(m)}
            className={cn(
              'measure flex-1 h-9 rounded border text-sm transition-colors',
              material === m
                ? 'bg-ink text-paper border-ink'
                : 'bg-paper-raised text-ink-soft border-line hover:border-line-strong'
            )}
          >
            {m}
          </button>
        ))}
      </div>
    </div>
  );
}
