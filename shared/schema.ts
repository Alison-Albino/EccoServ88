import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, decimal } from "drizzle-orm/pg-core";
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
  visitType: text("visit_type").notNull(), // 'unique' ou 'periodic'
  nextVisitDate: timestamp("next_visit_date"),
  observations: text("observations").notNull(),
  status: text("status").notNull().default('pending'), // 'pending', 'completed', 'in_progress', 'cancelled'
  photos: text("photos").array().default([]),
  invoiceUrl: text("invoice_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  visitId: varchar("visit_id").references(() => visits.id).notNull(),
  clientId: varchar("client_id").references(() => clients.id).notNull(),
  providerId: varchar("provider_id").references(() => providers.id).notNull(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  description: text("description").notNull(),
  serviceValue: text("service_value").notNull(), // '0.00' for free services
  materialCosts: text("material_costs").default('0.00'),
  totalAmount: text("total_amount").notNull(),
  isFree: boolean("is_free").default(false),
  status: text("status").notNull().default('pending'), // 'pending', 'sent', 'paid', 'overdue', 'cancelled'
  dueDate: timestamp("due_date").notNull(),
  paidDate: timestamp("paid_date"),
  paymentMethod: text("payment_method"), // 'boleto', 'pix', 'card', 'cash'
  paymentUrl: text("payment_url"), // External payment link
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  sentAt: timestamp("sent_at"),
});

export const materialUsage = pgTable("material_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  visitId: varchar("visit_id").references(() => visits.id).notNull(),
  materialType: text("material_type").notNull(),
  quantityGrams: decimal("quantity_grams", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
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

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  sentAt: true,
});

export const insertMaterialUsageSchema = createInsertSchema(materialUsage).omit({
  id: true,
  createdAt: true,
});

// Login schema
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  userType: z.enum(['client', 'provider', 'admin']),
});

// Invoice creation schema with validation
export const createInvoiceSchema = z.object({
  visitId: z.string(),
  description: z.string().min(1),
  serviceValue: z.string().regex(/^\d+\.\d{2}$/),
  materialCosts: z.string().regex(/^\d+\.\d{2}$/).optional().default('0.00'),
  isFree: z.boolean().default(false),
  dueDate: z.string().or(z.date()),
  paymentMethod: z.enum(['boleto', 'pix', 'card', 'cash']).optional(),
  notes: z.string().optional(),
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
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertMaterialUsage = z.infer<typeof insertMaterialUsageSchema>;
export type MaterialUsage = typeof materialUsage.$inferSelect;
export type LoginRequest = z.infer<typeof loginSchema>;
export type CreateInvoiceRequest = z.infer<typeof createInvoiceSchema>;

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

export type InvoiceWithDetails = Invoice & {
  visit: VisitWithDetails;
  client: Client & { user: User };
  provider: Provider & { user: User };
};

export type VisitWithMaterials = VisitWithDetails & {
  materials: MaterialUsage[];
};

// Constants for available materials
export const AVAILABLE_MATERIALS = [
  'Cloro (livre ou total)',
  'pH',
  'Dureza total (Ca, Mg)',
  'Cloretos (Cl⁻)',
  'Sulfatos (SO₄²⁻)',
  'Fósforo total',
  'Ferro (Fe)',
  'Manganês (Mn)',
  'Nitrogênio total (amônia, nitrato, nitrito)',
] as const;

export type AvailableMaterial = typeof AVAILABLE_MATERIALS[number];

// Material usage form schema
export const materialUsageFormSchema = z.object({
  materials: z.array(z.object({
    type: z.string(),
    selected: z.boolean(),
    quantity: z.number().min(0).optional(),
    notes: z.string().optional(),
  })),
});

export type MaterialUsageForm = z.infer<typeof materialUsageFormSchema>;
