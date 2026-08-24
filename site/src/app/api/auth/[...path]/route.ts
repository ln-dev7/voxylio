import { auth } from "@/lib/auth";

// Proxies every auth request (sign-in, callback, session…) to the
// Neon-hosted auth server configured in src/lib/auth.ts.
export const { GET, POST } = auth.handler();
