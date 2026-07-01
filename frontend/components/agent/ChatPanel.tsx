'use client';

import { useState } from 'react';
import { useAgentStream } from '@/hooks/useAgentStream';
import { useConfigStore } from '@/store/configStore';
import { ReasoningTrace } from './ReasoningTrace';

const EXAMPLES = [
  'a tough black bracket for outdoor use',
  'minimalist white planter, medium size',
  'smooth resin phone stand',
];

export function ChatPanel() {
  const [input, setInput] = useState('');
  const { steps, running, send } = useAgentStream();
  const sessionId = useConfigStore((s) => s.sessionId) ?? 'local-session';

  const submit = (text: string) => {
    const msg = text.trim();
    if (!msg || running) return;
    setInput('');
    void send(sessionId, msg);
  };

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="eyebrow mb-2">Describe it</p>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit(input)}
            placeholder="e.g. a sturdy phone stand in matte black"
            className="flex-1 h-10 px-3 rounded border border-line-strong bg-paper-raised
                       text-sm text-ink placeholder:text-ink-muted
                       focus:outline-none focus:ring-2 focus:ring-filament"
          />
          <button
            onClick={() => submit(input)}
            disabled={running}
            className="btn btn-accent disabled:opacity-50"
          >
            Configure
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => submit(ex)}
              disabled={running}
              className="measure text-[11px] text-blueprint bg-blueprint-wash
                         px-2 py-1 rounded hover:bg-blueprint/10 disabled:opacity-50"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      <ReasoningTrace steps={steps} running={running} />
    </div>
  );
}
