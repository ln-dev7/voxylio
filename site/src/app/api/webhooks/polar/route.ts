import { Webhooks } from "@polar-sh/nextjs";
import { db, schema } from "@/db";
import { polar } from "@/lib/polar";
import { lookupUserIdByEmail } from "@/lib/entitlement";

/**
 * Polar webhook target (configure in Polar: format Raw, event
 * customer.state_changed). Signature is verified by the helper with
 * POLAR_WEBHOOK_SECRET. `externalId` is the Neon Auth user id set at
 * checkout, so the entitlement lands on the right account.
 */
export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET ?? "",
  onCustomerStateChanged: async (payload) => {
    const state = payload.data;

    // A customer that existed in Polar BEFORE we sent external ids
    // (early tests, manual creation) is matched by email at checkout
    // and keeps `external_id: null` — the checkout's externalCustomerId
    // does not overwrite it. Fall back to the email (unique in auth),
    // then write the external id back to Polar so every later event
    // carries it. This exact gap once left a paid account on "free".
    let userId = state.externalId;
    if (!userId && state.email) {
      userId = await lookupUserIdByEmail(state.email);
      if (userId) {
        try {
          await polar.customers.update({
            id: state.id,
            customerUpdate: { externalId: userId },
          });
        } catch {
          /* self-heal only — the upsert below is what matters */
        }
      }
    }
    if (!userId) return;

    const subs = state.activeSubscriptions ?? [];
    const active = subs.find(
      (s) => s.status === "active" || s.status === "trialing",
    );

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
      updatedAt: new Date(),
    };

    await db
      .insert(schema.entitlement)
      .values(values)
      .onConflictDoUpdate({ target: schema.entitlement.userId, set: values });
  },
});
