import { Router } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../auth.js';

export const sessionRouter = Router();

/**
 * GET /me — returns the current user, or 401 if not signed in.
 * The frontend calls this on load to know who it's talking to.
 */
sessionRouter.get('/me', async (req, res) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  res.json({
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: (session.user as { role?: string }).role ?? 'customer',
  });
});
