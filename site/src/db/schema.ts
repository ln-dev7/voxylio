import {
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

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
  // 3-day full trial (every site unlocked): stamped at the FIRST
  // authenticated /api/entitlements call — so accounts created before
  // the feature shipped get their full window too (owner decision,
  // 2026-08-26). The extension enforces `trialEndsAt = this + 3 days`.
  trialStartedAt: timestamp("trial_started_at"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Long-lived opaque tokens the extension authenticates with. Only a
 * SHA-256 hash is stored; the token itself is shown once at creation
 * and relayed to the extension by the account page.
 */
/**
 * Monthly Pro cloud consumption, one row per (user, "YYYY-MM"). Only
 * metered characters of translated text — context windows are free.
 * `/api/pro/translate` increments it atomically; `/api/entitlements`
 * reads it to report the remaining quota.
 */
export const proUsage = pgTable(
  "pro_usage",
  {
    userId: text("user_id").notNull(),
    period: text("period").notNull(), // "YYYY-MM" (UTC)
    chars: integer("chars").notNull().default(0), // contextual translation
    ttsChars: integer("tts_chars").notNull().default(0), // neural voice
    // Premium Audio: seconds of live transcription (no-subtitle dubbing)
    audioSeconds: integer("audio_seconds").notNull().default(0),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("pro_usage_user_period_idx").on(t.userId, t.period)],
);

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
