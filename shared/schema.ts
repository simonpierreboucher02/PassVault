import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  recoveryKey: text("recovery_key").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const credentials = pgTable("credentials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  url: text("url"),
  username: text("username").notNull(),
  encryptedPassword: text("encrypted_password").notNull(),
  category: text("category").notNull().default("other"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  credentials: many(credentials),
}));

export const credentialsRelations = relations(credentials, ({ one }) => ({
  user: one(users, {
    fields: [credentials.userId],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
}).extend({
  recoveryKey: z.string().optional(),
});

export const insertCredentialSchema = createInsertSchema(credentials).pick({
  name: true,
  url: true,
  username: true,
  encryptedPassword: true,
  category: true,
});

export const updateCredentialSchema = insertCredentialSchema.partial();

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertCredential = z.infer<typeof insertCredentialSchema>;
export type UpdateCredential = z.infer<typeof updateCredentialSchema>;
export type Credential = typeof credentials.$inferSelect;
