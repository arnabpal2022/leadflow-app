import { relations } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createId } from "@paralleldrive/cuid2";

export const users = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),

  name: text("name"),

  email: text("email").notNull().unique(),

  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),

  image: text("image"),

  role: text("role", { enum: ["user", "admin"] }).default("user"),

  createdAt: integer("createdAt", { mode: "timestamp_ms" }).$defaultFn(
    () => new Date()
  ),
});

export const accounts = sqliteTable("accounts", {
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  type: text("type").notNull(),

  provider: text("provider").notNull(),

  providerAccountId: text("providerAccountId").notNull(),

  refresh_token: text("refresh_token"),

  access_token: text("access_token"),

  expires_at: integer("expires_at"),

  token_type: text("token_type"),

  scope: text("scope"),

  id_token: text("id_token"),

  session_state: text("session_state"),
});

export const sessions = sqliteTable("sessions", {
  sessionToken: text("sessionToken").primaryKey(),

  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

export const verificationTokens = sqliteTable("verificationTokens", {
  identifier: text("identifier").notNull(),

  token: text("token").notNull(),

  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

export const buyers = sqliteTable("buyers", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),

  fullName: text("fullName").notNull(),

  email: text("email"),

  phone: text("phone").notNull(),

  city: text("city", {
    enum: ["Chandigarh", "Mohali", "Zirakpur", "Panchkula", "Other"],
  }).notNull(),

  propertyType: text("propertyType", {
    enum: ["Apartment", "Villa", "Plot", "Office", "Retail"],
  }).notNull(),

  bhk: text("bhk", { enum: ["1", "2", "3", "4", "Studio"] }),

  purpose: text("purpose", { enum: ["Buy", "Rent"] }).notNull(),

  budgetMin: integer("budgetMin"),

  budgetMax: integer("budgetMax"),

  timeline: text("timeline", {
    enum: ["0-3m", "3-6m", ">6m", "Exploring"],
  }).notNull(),

  source: text("source", {
    enum: ["Website", "Referral", "Walk-in", "Call", "Other"],
  }).notNull(),

  status: text("status", {
    enum: [
      "New",
      "Qualified",
      "Contacted",
      "Visited",
      "Negotiation",
      "Converted",
      "Dropped",
    ],
  })
    .default("New")
    .notNull(),

  notes: text("notes"),

  tags: text("tags"),

  ownerId: text("ownerId")
    .notNull()
    .references(() => users.id),

  createdAt: integer("createdAt", { mode: "timestamp_ms" }).$defaultFn(
    () => new Date()
  ),

  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).$defaultFn(
    () => new Date()
  ),
});

// Buyer history table
export const buyerHistory = sqliteTable("buyer_history", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),

  buyerId: text("buyerId")
    .notNull()
    .references(() => buyers.id, { onDelete: "cascade" }),

  changedBy: text("changedBy")
    .notNull()
    .references(() => users.id),

  changedAt: integer("changedAt", { mode: "timestamp_ms" }).$defaultFn(
    () => new Date()
  ),

  diff: text("diff").notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  buyers: many(buyers),
  buyerHistory: many(buyerHistory),
}));

export const buyersRelations = relations(buyers, ({ one, many }) => ({
  owner: one(users, {
    fields: [buyers.ownerId],
    references: [users.id],
  }),
  history: many(buyerHistory),
}));

export const buyerHistoryRelations = relations(buyerHistory, ({ one }) => ({
  buyer: one(buyers, {
    fields: [buyerHistory.buyerId],
    references: [buyers.id],
  }),

  changedByUser: one(users, {
    fields: [buyerHistory.changedBy],
    references: [users.id],
  }),
}));
