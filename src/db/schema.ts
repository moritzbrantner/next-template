
import { pgEnum, pgTable, primaryKey, text, timestamp, integer, index, uniqueIndex, jsonb } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("Role", ["ADMIN", "MANAGER", "USER"]);

export const users = pgTable(
  "User",
  {
    id: text("id").primaryKey(),
    email: text("email"),
    name: text("name"),
    image: text("image"),
    emailVerified: timestamp("emailVerified", { withTimezone: false, mode: "date" }),
    role: roleEnum("role").notNull().default("USER"),
    passwordHash: text("passwordHash"),
    failedSignInAttempts: integer("failedSignInAttempts").notNull().default(0),
    lockoutUntil: timestamp("lockoutUntil", { withTimezone: false, mode: "date" }),
    createdAt: timestamp("createdAt", { withTimezone: false, mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { withTimezone: false, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("User_email_key").on(table.email), index("User_email_idx").on(table.email), index("User_role_idx").on(table.role)],
);

export const profiles = pgTable(
  "Profile",
  {
    id: text("id").primaryKey(),
    userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    bio: text("bio"),
    locale: text("locale"),
    timezone: text("timezone"),
    createdAt: timestamp("createdAt", { withTimezone: false, mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { withTimezone: false, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("Profile_userId_key").on(table.userId)],
);

export const userFollows = pgTable(
  "UserFollow",
  {
    followerId: text("followerId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    followingId: text("followingId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    createdAt: timestamp("createdAt", { withTimezone: false, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.followerId, table.followingId], name: "UserFollow_pkey" }),
    index("UserFollow_followerId_idx").on(table.followerId),
    index("UserFollow_followingId_idx").on(table.followingId),
  ],
);

export const accounts = pgTable(
  "Account",
  {
    userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
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
  },
  (table) => [
    primaryKey({ columns: [table.provider, table.providerAccountId], name: "Account_pkey" }),
    index("Account_userId_idx").on(table.userId),
  ],
);

export const sessions = pgTable(
  "Session",
  {
    sessionToken: text("sessionToken").notNull().primaryKey(),
    userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    expires: timestamp("expires", { withTimezone: false, mode: "date" }).notNull(),
  },
  (table) => [index("Session_userId_idx").on(table.userId)],
);

export const verificationTokens = pgTable(
  "VerificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: false, mode: "date" }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.identifier, table.token], name: "VerificationToken_pkey" }),
    uniqueIndex("VerificationToken_token_key").on(table.token),
  ],
);


export const securityRateLimitCounters = pgTable("SecurityRateLimitCounter", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  resetAt: timestamp("resetAt", { withTimezone: false, mode: "date" }).notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: false, mode: "date" }).notNull().defaultNow(),
});

export const securityAuditLogs = pgTable(
  "SecurityAuditLog",
  {
    id: text("id").primaryKey(),
    actorId: text("actorId"),
    action: text("action").notNull(),
    outcome: text("outcome").notNull(),
    statusCode: integer("statusCode").notNull(),
    metadata: jsonb("metadata").notNull().default({}),
    timestamp: timestamp("timestamp", { withTimezone: false, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [index("SecurityAuditLog_actorId_idx").on(table.actorId), index("SecurityAuditLog_action_idx").on(table.action)],
);

export const pageVisits = pgTable(
  "PageVisit",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    href: text("href").notNull(),
    pathname: text("pathname").notNull(),
    visitedAt: timestamp("visitedAt", { withTimezone: false, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("PageVisit_userId_visitedAt_idx").on(table.userId, table.visitedAt),
    index("PageVisit_pathname_idx").on(table.pathname),
    index("PageVisit_visitedAt_idx").on(table.visitedAt),
  ],
);

export const pageVisitQueryParameters = pgTable(
  "PageVisitQueryParameter",
  {
    id: text("id").primaryKey(),
    pageVisitId: text("pageVisitId")
      .notNull()
      .references(() => pageVisits.id, { onDelete: "cascade", onUpdate: "cascade" }),
    key: text("key").notNull(),
    value: text("value").notNull(),
    position: integer("position").notNull(),
  },
  (table) => [
    index("PageVisitQueryParameter_pageVisitId_idx").on(table.pageVisitId),
    index("PageVisitQueryParameter_key_idx").on(table.key),
    index("PageVisitQueryParameter_key_value_idx").on(table.key, table.value),
  ],
);
