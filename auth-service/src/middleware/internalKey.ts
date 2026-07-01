import type { Request, Response, NextFunction } from 'express';

/**
 * Guards internal-only endpoints. Service-to-service calls (e.g. the agent
 * orchestrator asking the product service for data) are not human requests and
 * carry no user JWT — they present a shared internal key instead. This header
 * is never exposed through the public gateway.
 */
export function requireInternalKey(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.header('x-internal-key') !== process.env.INTERNAL_API_KEY) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}
