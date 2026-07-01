'use client';

import { useConfigStore } from '@/store/configStore';
import { cn } from '@/lib/cn';
import type { SizeLabel } from '@/lib/types';

const SIZES: { label: SizeLabel; scale: string }[] = [
  { label: 'S', scale: '0.8×' },
  { label: 'M', scale: '1.0×' },
  { label: 'L', scale: '1.25×' },
];

export function SizeSelector() {
  const sizeLabel = useConfigStore((s) => s.sizeLabel);
  const setSize = useConfigStore((s) => s.setSize);

  return (
    <div>
      <p className="eyebrow mb-2">Size</p>
      <div className="flex gap-1.5">
        {SIZES.map(({ label, scale }) => (
          <button
            key={label}
            onClick={() => setSize(label)}
            className={cn(
              'flex-1 h-9 rounded border text-sm transition-colors flex items-center justify-center gap-1.5',
              sizeLabel === label
                ? 'bg-ink text-paper border-ink'
                : 'bg-paper-raised text-ink-soft border-line hover:border-line-strong'
            )}
          >
            <span>{label}</span>
            <span className="measure text-[11px] opacity-60">{scale}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
