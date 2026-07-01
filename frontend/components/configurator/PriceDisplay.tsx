'use client';

import { useConfigStore } from '@/store/configStore';

export function PriceDisplay() {
  const total = useConfigStore((s) => s.totalPrice);
  const weight = useConfigStore((s) => s.weightG);
  const material = useConfigStore((s) => s.material);

  return (
    <div className="flex items-end justify-between border-t border-line pt-4">
      <div>
        <p className="eyebrow mb-1">Estimate</p>
        <p className="measure text-3xl text-ink leading-none">
          €{total > 0 ? total.toFixed(2) : '—.—'}
        </p>
      </div>
      <p className="measure text-xs text-ink-muted text-right leading-relaxed">
        {weight > 0 ? `${weight}g` : '—'} · {material}
        <br />
        incl. supports
      </p>
    </div>
  );
}
