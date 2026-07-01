import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './auth.js';
import { arcjetGuard } from './middleware/arcjet.js';
import { sessionRouter } from './routes/session.js';

const app = express();
const PORT = Number(process.env.PORT ?? 4000);

app.use(
  cors({
    origin: (process.env.TRUSTED_ORIGINS ?? 'http://localhost:3000').split(','),
    credentials: true,
  })
);

// Bot/rate-limit guard sits in front of the auth handler only.
app.use('/api/auth', arcjetGuard);

/**
 * Better Auth owns everything under /api/auth/*:
 *   /api/auth/sign-in/social   (GitHub OAuth start)
 *   /api/auth/callback/github  (OAuth callback)
 *   /api/auth/sign-out
 *   /api/auth/token            (mint a JWT for the current session)
 *   /api/auth/jwks             (PUBLIC keys — the gateway verifies against this)
 *
 * Mounted BEFORE express.json(): the handler needs the raw body.
 */
app.all('/api/auth/*', toNodeHandler(auth));

// JSON parser for our own routes, after the auth handler.
app.use(express.json());

app.use('/', sessionRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`auth-service listening on :${PORT}`);
});
