'use client';

import { cn } from '@/lib/cn';
import type { AgentStep as Step } from '@/lib/types';

const AGENT_COLOR: Record<Step['agent'], string> = {
  orchestrator: 'text-ink-muted',
  design: 'text-filament',
  validation: 'text-blueprint',
  pricing: 'text-[#639922]',
};

const TYPE_GLYPH: Record<Step['type'], string> = {
  thinking: '···',
  tool_call: '▸',
  decision: '✓',
  result: '=',
};

export function AgentStep({ step }: { step: Step }) {
  return (
    <div className="measure text-xs leading-relaxed flex gap-2">
      <span className={cn('shrink-0 w-4 text-center', AGENT_COLOR[step.agent])}>
        {TYPE_GLYPH[step.type]}
      </span>
      <div className="min-w-0">
        <span className={cn('uppercase tracking-wide', AGENT_COLOR[step.agent])}>
          {step.agent}
        </span>
        <span className="text-ink-soft"> {step.label}</span>
        {step.detail && (
          <div className="text-ink-muted truncate">{step.detail}</div>
        )}
      </div>
    </div>
  );
}
