import { pgTable, text, serial, integer, boolean, real, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("buyer"), // buyer, vendor, affiliate, admin
  profilePicture: text("profile_picture"),
  balance: real("balance").notNull().default(0),
  planId: integer("plan_id").references(() => plans.id).default(1), // Free plan by default
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Subscription Plans
export const plans = pgTable("plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  price: real("price").notNull(),
  productLimit: integer("product_limit").notNull(),
  affiliateLimit: integer("affiliate_limit"),
  supportLevel: text("support_level").notNull(),
  hasHighlight: boolean("has_highlight").notNull().default(false),
  platformFeePercentage: real("platform_fee_percentage").notNull(),
  stripePriceId: text("stripe_price_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Digital Products
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: real("price").notNull(),
  productType: text("product_type").notNull(), // pdf, ebook, course, link, etc
  downloadUrl: text("download_url"),
  thumbnailUrl: text("thumbnail_url"),
  isPublic: boolean("is_public").notNull().default(true),
  isActive: boolean("is_active").notNull().default(true),
  isPaid: boolean("is_paid").notNull().default(true),
  commissionRate: real("commission_rate").notNull().default(10),
  commissionType: text("commission_type").notNull().default("percentage"), // percentage or fixed
  categoryId: integer("category_id").references(() => categories.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Categories
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Sales/Purchases
export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id),
  buyerId: integer("buyer_id").notNull().references(() => users.id),
  sellerId: integer("seller_id").notNull().references(() => users.id),
  affiliateId: integer("affiliate_id").references(() => users.id),
  amount: real("amount").notNull(),
  sellerAmount: real("seller_amount").notNull(),
  affiliateAmount: real("affiliate_amount"),
  platformFee: real("platform_fee").notNull(),
  status: text("status").notNull().default("pending"), // pending, completed, refunded
  paymentMethod: text("payment_method").notNull(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Affiliates
export const affiliateRelations = pgTable("affiliate_relations", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id),
  affiliateId: integer("affiliate_id").notNull().references(() => users.id),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Coupons
export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull().references(() => users.id),
  code: text("code").notNull().unique(),
  type: text("type").notNull(), // percentage, fixed
  value: real("value").notNull(),
  productId: integer("product_id").references(() => products.id), // If null, applies to all products
  maxUsage: integer("max_usage"),
  usageCount: integer("usage_count").notNull().default(0),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Withdrawals
export const withdrawals = pgTable("withdrawals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: real("amount").notNull(),
  status: text("status").notNull().default("pending"), // pending, completed, rejected
  stripeTransferId: text("stripe_transfer_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Reviews
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id),
  userId: integer("user_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  balance: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true
});

export const insertSaleSchema = createInsertSchema(sales).omit({
  id: true,
  createdAt: true
});

export const insertAffiliateRelationSchema = createInsertSchema(affiliateRelations).omit({
  id: true,
  createdAt: true
});

export const insertCouponSchema = createInsertSchema(coupons).omit({
  id: true,
  usageCount: true,
  createdAt: true
});

export const insertWithdrawalSchema = createInsertSchema(withdrawals).omit({
  id: true,
  status: true,
  stripeTransferId: true,
  createdAt: true
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true
});

export const insertPlanSchema = createInsertSchema(plans).omit({
  id: true,
  createdAt: true
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Sale = typeof sales.$inferSelect;
export type InsertSale = z.infer<typeof insertSaleSchema>;

export type AffiliateRelation = typeof affiliateRelations.$inferSelect;
export type InsertAffiliateRelation = z.infer<typeof insertAffiliateRelationSchema>;

export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = z.infer<typeof insertCouponSchema>;

export type Withdrawal = typeof withdrawals.$inferSelect;
export type InsertWithdrawal = z.infer<typeof insertWithdrawalSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type Plan = typeof plans.$inferSelect;
export type InsertPlan = z.infer<typeof insertPlanSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
