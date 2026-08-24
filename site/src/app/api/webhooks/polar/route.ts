import { Webhooks } from "@polar-sh/nextjs";
import { db, schema } from "@/db";

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
    const userId = state.externalId;
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
