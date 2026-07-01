import { betterAuth } from 'better-auth';
import { jwt } from 'better-auth/plugins';
import { pool } from './db/index.js';

const BASE_URL = process.env.BETTER_AUTH_URL ?? 'http://localhost:4000';

export const auth = betterAuth({
  baseURL: BASE_URL,
  secret: process.env.BETTER_AUTH_SECRET,

  // Better Auth owns its schema in this Postgres pool.
  database: pool,

  // Cookie needs to survive the Vercel-frontend -> EC2-api cross-origin hop.
  advanced: {
    defaultCookieAttributes: {
      sameSite: 'none',
      secure: true,
    },
  },

  trustedOrigins: (process.env.TRUSTED_ORIGINS ?? 'http://localhost:3000').split(','),

  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },

  // Every user carries a role. Not settable by the user — seeded/promoted server-side.
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'customer',
        input: false,
      },
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },

  plugins: [
    jwt({
      jwks: {
        // Asymmetric keys, generated and stored by Better Auth in the `jwks`
        // table. The gateway fetches the PUBLIC key from the JWKS endpoint and
        // verifies tokens locally — the private key never leaves this service.
        keyPairConfig: { alg: 'ES256' },
      },
      jwt: {
        issuer: BASE_URL,
        audience: 'print3d-api',
        expirationTime: '15m',
        // Shape the token: what the gateway and downstream services read.
        definePayload: ({ user }) => ({
          id: user.id,
          email: user.email,
          role: (user as { role?: string }).role ?? 'customer',
        }),
      },
    }),
  ],
});
