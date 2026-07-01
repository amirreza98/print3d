'use client';

import { useEffect, useRef } from 'react';
import { AgentStep } from './AgentStep';
import type { AgentStep as Step } from '@/lib/types';

export function ReasoningTrace({
  steps,
  running,
}: {
  steps: Step[];
  running: boolean;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [steps.length]);

  return (
    <div className="rounded-lg border border-line bg-paper-sunk blueprint-grid p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="eyebrow">Build log</p>
        {running && (
          <span className="measure text-[11px] text-filament flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-filament animate-pulse" />
            running
          </span>
        )}
      </div>

      <div className="space-y-1.5 max-h-64 overflow-y-auto">
        {steps.length === 0 && !running && (
          <p className="measure text-xs text-ink-muted">
            Describe what you want printed to begin.
          </p>
        )}
        {steps.map((s) => (
          <AgentStep key={s.id} step={s} />
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}
