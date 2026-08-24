import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

// Users and sessions live in the `neon_auth` schema, managed by Neon
// Auth. These tables only reference the Neon Auth user id as plain
// text — no FK into a managed schema.

/**
 * One row per user, kept up to date by Polar's `customer.state_changed`
 * webhook. `/api/entitlements` reads it — never Polar directly — so the
 * extension check stays a single indexed query.
 */
export const entitlement = pgTable("entitlement", {
  userId: text("user_id").primaryKey(),
  plan: text("plan").notNull().default("free"), // 'free' | 'pro'
  status: text("status").notNull().default("none"), // 'none' | 'active' | 'canceled' | 'revoked'
  polarCustomerId: text("polar_customer_id"),
  polarSubscriptionId: text("polar_subscription_id"),
  currentPeriodEnd: timestamp("current_period_end"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Long-lived opaque tokens the extension authenticates with. Only a
 * SHA-256 hash is stored; the token itself is shown once at creation
 * and relayed to the extension by the account page.
 */
export const extensionToken = pgTable(
  "extension_token",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    tokenHash: text("token_hash").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    lastUsedAt: timestamp("last_used_at"),
    revokedAt: timestamp("revoked_at"),
  },
  (t) => [uniqueIndex("extension_token_hash_idx").on(t.tokenHash)],
);
