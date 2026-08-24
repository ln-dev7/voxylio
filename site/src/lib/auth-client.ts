import { createAuthClient } from "@neondatabase/auth/next";

/** Browser-side auth client: `useSession`, Google sign-in via
 *  `authClient.signIn.social({ provider: "google" })`, `signOut`. */
export const authClient = createAuthClient();
