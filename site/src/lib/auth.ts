import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { checkout, polar, portal, webhooks } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import { db, schema } from "@/db";
import { SITE_URL } from "@/lib/constants";

const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server: process.env.POLAR_SERVER === "sandbox" ? "sandbox" : "production",
});

/**
 * Server-side auth. Google is the only sign-in method, by design.
 * The Polar plugin creates the Polar customer at signup (externalId =
 * Better Auth user id), exposes checkout + customer portal, and feeds
 * the `entitlement` table through the customer.state_changed webhook.
 */
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? SITE_URL,
  database: drizzleAdapter(db, { provider: "pg", schema }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [
    polar({
      client: polarClient,
      createCustomerOnSignUp: true,
      use: [
        checkout({
          products: [
            {
              productId: process.env.POLAR_PRODUCT_PRO_ID ?? "",
              slug: "pro",
            },
          ],
          successUrl: "/account?checkout=success",
          authenticatedUsersOnly: true,
        }),
        portal(),
        webhooks({
          secret: process.env.POLAR_WEBHOOK_SECRET ?? "",
          // Polar's recommended single source of truth: fires on every
          // change to a customer's subscriptions/benefits.
          onCustomerStateChanged: async (payload) => {
            const state = payload.data;
            const userId = state.externalId;
            if (!userId) return;

            const subs = state.activeSubscriptions ?? [];
            const active = subs.find(
              (s) => s.status === "active" || s.status === "trialing",
            );
            const now = new Date();

            const values = {
              userId,
              plan: active ? "pro" : "free",
              status: active
                ? active.cancelAtPeriodEnd
                  ? "canceled" // stays pro until the period ends
                  : "active"
                : "none",
              polarCustomerId: state.id,
              polarSubscriptionId: active?.id ?? null,
              currentPeriodEnd: active?.currentPeriodEnd
                ? new Date(active.currentPeriodEnd)
                : null,
              updatedAt: now,
            };

            await db
              .insert(schema.entitlement)
              .values(values)
              .onConflictDoUpdate({
                target: schema.entitlement.userId,
                set: values,
              });
          },
        }),
      ],
    }),
  ],
});
