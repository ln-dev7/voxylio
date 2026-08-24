import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

// Mounts every Better Auth endpoint under /api/auth/*, including the
// Polar plugin routes: /api/auth/polar/webhooks (Polar webhook target),
// /api/auth/customer/portal and /api/auth/customer/state.
export const { GET, POST } = toNextJsHandler(auth.handler);
