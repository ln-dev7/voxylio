import { createAuthClient } from "better-auth/react";
import { polarClient } from "@polar-sh/better-auth";

/** Browser-side auth client: session hook, Google sign-in, Polar
 *  checkout (`authClient.checkout({ slug: "pro" })`) and customer
 *  portal (`authClient.customer.portal()`). */
export const authClient = createAuthClient({
  plugins: [polarClient()],
});
