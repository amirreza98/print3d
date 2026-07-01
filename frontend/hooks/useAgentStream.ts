'use client';

import { useCallback, useRef, useState } from 'react';
import { useConfigStore } from '@/store/configStore';
import type { AgentStep, AgentEvent } from '@/lib/types';

const AGENT_BASE = process.env.NEXT_PUBLIC_AGENT_BASE_URL ?? '';

/** Flip to false once the NestJS orchestrator streams real SSE. */
const SIMULATE = true;

export function useAgentStream() {
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [running, setRunning] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  const apply = useConfigStore((s) => s.applyAgentConfig);
  const setIssues = useConfigStore((s) => s.setIssues);
  const setPrice = useConfigStore((s) => s.setPrice);

  const handle = useCallback(
    (evt: AgentEvent) => {
      if (evt.kind === 'step') setSteps((prev) => [...prev, evt.step]);
      if (evt.kind === 'config_update') apply(evt.config);
      if (evt.kind === 'issues') setIssues(evt.issues);
      if (evt.kind === 'done') setRunning(false);
    },
    [apply, setIssues]
  );

  const send = useCallback(
    async (sessionId: string, message: string) => {
      setSteps([]);
      setRunning(true);

      if (SIMULATE) {
        await simulate(message, handle, setPrice);
        return;
      }

      // Real path: POST the message, then open the SSE stream.
      await fetch(`${AGENT_BASE}/agent/message`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message }),
      });

      esRef.current?.close();
      const es = new EventSource(
        `${AGENT_BASE}/agent/stream/${sessionId}`,
        { withCredentials: true }
      );
      es.addEventListener('agent', (e) =>
        handle(JSON.parse((e as MessageEvent).data) as AgentEvent)
      );
      es.addEventListener('done', () => {
        setRunning(false);
        es.close();
      });
      es.onerror = () => {
        setRunning(false);
        es.close();
      };
      esRef.current = es;
    },
    [handle, setPrice]
  );

  return { steps, running, send };
}

/* ------------------------------------------------------------------ */
/* Local simulator: mimics a multi-agent loop so the UI is alive before */
/* the orchestrator is built. Delete once SIMULATE = false.             */
/* ------------------------------------------------------------------ */

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function simulate(
  message: string,
  handle: (e: AgentEvent) => void,
  setPrice: (t: number, w: number) => void
) {
  const now = () => Date.now();
  const step = (s: Omit<AgentStep, 'id' | 'ts'>): AgentStep => ({
    ...s,
    id: crypto.randomUUID(),
    ts: now(),
  });

  handle({
    kind: 'step',
    step: step({
      agent: 'orchestrator',
      type: 'thinking',
      label: 'Parsing request',
      detail: message,
    }),
  });
  await wait(600);

  handle({
    kind: 'step',
    step: step({
      agent: 'design',
      type: 'tool_call',
      label: 'catalog.match_template',
      detail: 'querying product catalog for closest match',
    }),
  });
  await wait(700);

  const material = /resin/i.test(message)
    ? 'resin'
    : /tough|strong|outdoor/i.test(message)
    ? 'ABS'
    : 'PETG';
  const color = /black/i.test(message)
    ? '#16150F'
    : /white/i.test(message)
    ? '#EDEDE8'
    : '#E8590C';

  handle({
    kind: 'step',
    step: step({
      agent: 'design',
      type: 'decision',
      label: `Material ${material}, color set`,
    }),
  });
  handle({ kind: 'config_update', config: { material, color } });
  await wait(700);

  handle({
    kind: 'step',
    step: step({
      agent: 'validation',
      type: 'tool_call',
      label: 'geometry.check_printability',
      detail: 'wall thickness · overhangs · watertight',
    }),
  });
  await wait(800);
  handle({
    kind: 'step',
    step: step({
      agent: 'validation',
      type: 'result',
      label: 'Printable — no critical issues',
    }),
  });
  handle({ kind: 'issues', issues: [] });
  await wait(500);

  handle({
    kind: 'step',
    step: step({
      agent: 'pricing',
      type: 'tool_call',
      label: 'pricing.estimate',
      detail: `material=${material}`,
    }),
  });
  await wait(700);
  const weight = 42;
  const price = Number((weight * (material === 'resin' ? 0.9 : 0.45) + 6).toFixed(2));
  setPrice(price, weight);
  handle({
    kind: 'step',
    step: step({
      agent: 'pricing',
      type: 'result',
      label: `Estimate €${price.toFixed(2)}`,
      detail: `${weight}g @ ${material}`,
    }),
  });
  await wait(300);

  handle({ kind: 'done' });
}
