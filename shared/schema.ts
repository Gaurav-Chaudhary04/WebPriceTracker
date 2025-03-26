import { pgTable, text, serial, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table (kept from original schema)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Products table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sku: text("sku").notNull().unique(),
  category: text("category").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  optimalPrice: numeric("optimal_price", { precision: 10, scale: 2 }),
  status: text("status").notNull().default("unknown"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  updatedAt: true,
  optimalPrice: true,
  status: true,
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// Competitor prices table
export const competitorPrices = pgTable("competitor_prices", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  competitor: text("competitor").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertCompetitorPriceSchema = createInsertSchema(competitorPrices).omit({
  id: true,
  timestamp: true,
});

export type InsertCompetitorPrice = z.infer<typeof insertCompetitorPriceSchema>;
export type CompetitorPrice = typeof competitorPrices.$inferSelect;

// Price history table
export const priceHistory = pgTable("price_history", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  source: text("source").notNull(), // "your", "amazon", "walmart", "bestbuy", "optimal"
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  date: timestamp("date").notNull().defaultNow(),
});

export const insertPriceHistorySchema = createInsertSchema(priceHistory).omit({
  id: true,
});

export type InsertPriceHistory = z.infer<typeof insertPriceHistorySchema>;
export type PriceHistory = typeof priceHistory.$inferSelect;
