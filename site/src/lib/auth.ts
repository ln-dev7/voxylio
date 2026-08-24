import { createNeonAuth } from "@neondatabase/auth/next/server";

/**
 * Managed Neon Auth: the auth server is hosted by Neon (Google sign-in
 * configured in the Neon console), this app only proxies /api/auth/* to
 * it and reads sessions. Users live in the `neon_auth` schema of the
 * same Postgres database.
 *
 * The build-time fallbacks only exist so `next build` can evaluate the
 * routes without env vars; real values are required at runtime.
 */
export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL ?? "https://invalid.neonauth.local",
  cookies: {
    secret:
      process.env.NEON_AUTH_COOKIE_SECRET ??
      "insecure-build-placeholder-secret-000000",
  },
});
