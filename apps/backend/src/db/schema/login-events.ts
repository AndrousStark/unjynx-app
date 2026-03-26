import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";

export const loginEvents = pgTable(
  "login_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id"),
    email: text("email"),
    eventType: text("event_type").notNull(), // login_success, login_failed, logout, mfa_success, lockout
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    deviceType: text("device_type"), // mobile, desktop, tablet
    browser: text("browser"),
    os: text("os"),
    geoCountry: text("geo_country"),
    geoCity: text("geo_city"),
    logtoEvent: text("logto_event"), // original Logto event key
    metadata: text("metadata"), // JSON string
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("login_events_user_id_idx").on(table.userId),
    index("login_events_event_type_idx").on(table.eventType),
    index("login_events_ip_address_idx").on(table.ipAddress),
    index("login_events_created_at_idx").on(table.createdAt),
  ],
);

export type LoginEvent = typeof loginEvents.$inferSelect;
export type NewLoginEvent = typeof loginEvents.$inferInsert;
