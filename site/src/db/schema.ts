import {
  boolean,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ── Better Auth core tables ─────────────────────────────────────────
// Standard schema expected by better-auth's drizzle adapter.

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Voxylio tables ──────────────────────────────────────────────────

/**
 * One row per user, kept up to date by Polar's `customer.state_changed`
 * webhook. `/api/entitlements` reads it — never Polar directly — so the
 * extension check stays a single indexed query.
 */
export const entitlement = pgTable("entitlement", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
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
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    lastUsedAt: timestamp("last_used_at"),
    revokedAt: timestamp("revoked_at"),
  },
  (t) => [uniqueIndex("extension_token_hash_idx").on(t.tokenHash)],
);
