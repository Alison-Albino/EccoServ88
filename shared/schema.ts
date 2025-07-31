import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  userType: text("user_type").notNull(), // 'client', 'provider', 'admin'
  createdAt: timestamp("created_at").defaultNow(),
});

export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  address: text("address"),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const wells = pgTable("wells", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").references(() => clients.id).notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'residential', 'industrial', 'agricultural'
  location: text("location"),
  status: text("status").notNull().default('active'), // 'active', 'maintenance', 'attention', 'inactive'
  createdAt: timestamp("created_at").defaultNow(),
});

export const providers = pgTable("providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  specialties: text("specialties").array(),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const visits = pgTable("visits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  wellId: varchar("well_id").references(() => wells.id).notNull(),
  providerId: varchar("provider_id").references(() => providers.id).notNull(),
  visitDate: timestamp("visit_date").notNull(),
  serviceType: text("service_type").notNull(),
  observations: text("observations").notNull(),
  status: text("status").notNull().default('pending'), // 'pending', 'completed', 'in_progress', 'cancelled'
  photos: text("photos").array().default([]),
  invoiceUrl: text("invoice_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
});

export const insertWellSchema = createInsertSchema(wells).omit({
  id: true,
  createdAt: true,
});

export const insertProviderSchema = createInsertSchema(providers).omit({
  id: true,
  createdAt: true,
});

export const insertVisitSchema = createInsertSchema(visits).omit({
  id: true,
  createdAt: true,
});

// Login schema
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  userType: z.enum(['client', 'provider', 'admin']),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;
export type InsertWell = z.infer<typeof insertWellSchema>;
export type Well = typeof wells.$inferSelect;
export type InsertProvider = z.infer<typeof insertProviderSchema>;
export type Provider = typeof providers.$inferSelect;
export type InsertVisit = z.infer<typeof insertVisitSchema>;
export type Visit = typeof visits.$inferSelect;
export type LoginRequest = z.infer<typeof loginSchema>;

// Extended types for API responses
export type UserWithProfile = User & {
  client?: Client;
  provider?: Provider;
};

export type WellWithClient = Well & {
  client: Client & { user: User };
};

export type VisitWithDetails = Visit & {
  well: WellWithClient;
  provider: Provider & { user: User };
};
