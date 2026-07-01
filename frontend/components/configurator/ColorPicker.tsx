'use client';

import { useConfigStore } from '@/store/configStore';
import { cn } from '@/lib/cn';

const PRESETS = ['#E8590C', '#16150F', '#EDEDE8', '#3A4A5A', '#639922', '#D4537E'];

export function ColorPicker() {
  const color = useConfigStore((s) => s.color);
  const setColor = useConfigStore((s) => s.setColor);

  return (
    <div>
      <p className="eyebrow mb-2">Filament color</p>
      <div className="flex items-center gap-2">
        {PRESETS.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            aria-label={`Color ${c}`}
            className={cn(
              'h-7 w-7 rounded-full border transition-transform hover:scale-110',
              color.toLowerCase() === c.toLowerCase()
                ? 'border-ink ring-2 ring-filament'
                : 'border-line-strong'
            )}
            style={{ backgroundColor: c }}
          />
        ))}
        <label className="relative h-7 w-7 rounded-full border border-line-strong overflow-hidden cursor-pointer">
          <span
            className="absolute inset-0"
            style={{ backgroundColor: color }}
            aria-hidden
          />
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </label>
      </div>
    </div>
  );
}
