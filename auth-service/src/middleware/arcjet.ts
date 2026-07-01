import arcjet, { shield, detectBot, tokenBucket } from '@arcjet/node';
import type { Request, Response, NextFunction } from 'express';

const aj = arcjet({
  key: process.env.ARCJET_KEY as string,
  characteristics: ['ip.src'],
  rules: [
    shield({ mode: 'LIVE' }),
    detectBot({ mode: 'LIVE', allow: ['CATEGORY:SEARCH_ENGINE'] }),
    tokenBucket({ mode: 'LIVE', refillRate: 5, interval: 10, capacity: 10 }),
  ],
});

/** Protects login/registration — the highest-value bot and brute-force target. */
export async function arcjetGuard(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // If no key is configured (local dev), don't block.
  if (!process.env.ARCJET_KEY) return next();

  const decision = await aj.protect(req, { requested: 1 });
  if (decision.isDenied()) {
    return res.status(429).json({ error: 'Too many requests' });
  }
  next();
}
