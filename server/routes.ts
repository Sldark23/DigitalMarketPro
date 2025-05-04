import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertProductSchema, 
  insertSaleSchema, 
  insertAffiliateRelationSchema,
  insertCouponSchema,
  insertWithdrawalSchema,
  insertReviewSchema
} from "@shared/schema";
import * as crypto from "crypto";
import session from "express-session";
import MemoryStore from "memorystore";

// Declare module for extending express-session
declare module 'express-session' {
  interface SessionData {
    userId?: number;
  }
}

// Check for required Stripe keys
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

if (!process.env.VITE_STRIPE_PUBLIC_KEY) {
  console.warn('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}

import Stripe from "stripe";

let stripe: Stripe | undefined;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-04-30.basil", // Versão mais recente da API
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure session
  const MemoryStoreSession = MemoryStore(session);
  app.use(session({
    secret: process.env.SESSION_SECRET || "catpay-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 86400000 }, // 24 hours
    store: new MemoryStoreSession({
      checkPeriod: 86400000 // prune expired entries every 24h
    })
  }));

  // Auth middleware
  const authenticate = (req: Request, res: Response, next: Function) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Role-based authorization middleware
  const authorize = (roles: string[]) => {
    return async (req: Request, res: Response, next: Function) => {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user || !roles.includes(user.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      next();
    };
  };

  // Auth routes
  app.post("/api/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username or email already exists
      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }
      
      // Hash password
      const hashedPassword = crypto.createHash('sha256').update(userData.password).digest('hex');
      
      // Create user
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });
      
      // Set session
      req.session.userId = user.id;
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
      if (user.password !== hashedPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Set session
      req.session.userId = user.id;
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/me", authenticate, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Product routes
  app.post("/api/products", authenticate, authorize(["vendor", "admin"]), async (req, res) => {
    try {
      const productData = insertProductSchema.parse({
        ...req.body,
        sellerId: req.session.userId
      });
      
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/products", async (req, res) => {
    try {
      const filters: any = {};
      
      if (req.query.sellerId) {
        filters.sellerId = parseInt(req.query.sellerId as string);
      }
      
      if (req.query.isPublic) {
        filters.isPublic = req.query.isPublic === "true";
      }
      
      if (req.query.categoryId) {
        filters.categoryId = parseInt(req.query.categoryId as string);
      }
      
      if (req.query.isPaid) {
        filters.isPaid = req.query.isPaid === "true";
      }
      
      const products = await storage.listProducts(filters);
      res.status(200).json(products);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.status(200).json(product);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/products/:id", authenticate, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      if (product.sellerId !== req.session.userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedProduct = await storage.updateProduct(productId, req.body);
      res.status(200).json(updatedProduct);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/products/:id", authenticate, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      if (product.sellerId !== req.session.userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      await storage.deleteProduct(productId);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Sale routes
  app.post("/api/sales", authenticate, async (req, res) => {
    try {
      const saleData = insertSaleSchema.parse({
        ...req.body,
        buyerId: req.session.userId
      });
      
      const sale = await storage.createSale(saleData);
      res.status(201).json(sale);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/sales", authenticate, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      let sales;
      
      if (user.role === "admin") {
        // Admin can see all sales
        const allUsers = await storage.listUsers();
        const allSales = [];
        for (const user of allUsers) {
          const userSales = await storage.listSalesByUser(user.id, "buyer");
          allSales.push(...userSales);
        }
        sales = allSales;
      } else if (user.role === "vendor") {
        // Vendor sees their products' sales
        sales = await storage.listSalesByUser(userId, "seller");
      } else if (user.role === "affiliate") {
        // Affiliate sees sales from their affiliate links
        sales = await storage.listSalesByUser(userId, "affiliate");
      } else {
        // Buyer sees their purchases
        sales = await storage.listSalesByUser(userId, "buyer");
      }
      
      res.status(200).json(sales);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Affiliate routes
  app.post("/api/affiliate-relations", authenticate, authorize(["affiliate", "vendor", "admin"]), async (req, res) => {
    try {
      const relationData = insertAffiliateRelationSchema.parse({
        ...req.body,
        affiliateId: req.session.userId
      });
      
      const relation = await storage.createAffiliateRelation(relationData);
      res.status(201).json(relation);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/affiliate-relations", authenticate, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      let relations;
      
      if (user.role === "vendor" || user.role === "admin") {
        // Get products by vendor
        const products = await storage.listProducts({ sellerId: userId });
        
        // Get relations for all vendor's products
        relations = [];
        for (const product of products) {
          const productRelations = await storage.listAffiliateRelationsByProduct(product.id);
          relations.push(...productRelations);
        }
      } else {
        // Get relations for affiliate
        relations = await storage.listAffiliateRelationsByUser(userId);
      }
      
      res.status(200).json(relations);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/affiliate-relations/:id/status", authenticate, authorize(["vendor", "admin"]), async (req, res) => {
    try {
      const relationId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status || !["pending", "approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const relation = await storage.getAffiliateRelation(relationId);
      if (!relation) {
        return res.status(404).json({ message: "Affiliate relation not found" });
      }
      
      // Check if the product belongs to the vendor
      const product = await storage.getProduct(relation.productId);
      const currentUser = await storage.getUser(req.session.userId!);
      if (!product || (product.sellerId !== req.session.userId && currentUser?.role !== "admin")) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedRelation = await storage.updateAffiliateRelationStatus(relationId, status);
      res.status(200).json(updatedRelation);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Coupon routes
  app.post("/api/coupons", authenticate, authorize(["vendor", "admin"]), async (req, res) => {
    try {
      const couponData = insertCouponSchema.parse({
        ...req.body,
        sellerId: req.session.userId
      });
      
      // Check if coupon code already exists
      const existingCoupon = await storage.getCouponByCode(couponData.code);
      if (existingCoupon) {
        return res.status(400).json({ message: "Coupon code already exists" });
      }
      
      const coupon = await storage.createCoupon(couponData);
      res.status(201).json(coupon);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/coupons", authenticate, authorize(["vendor", "admin"]), async (req, res) => {
    try {
      const userId = req.session.userId!;
      const coupons = await storage.listCouponsBySeller(userId);
      res.status(200).json(coupons);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/coupons/:code/validate", async (req, res) => {
    try {
      const code = req.params.code;
      const productId = parseInt(req.query.productId as string);
      
      if (!code || isNaN(productId)) {
        return res.status(400).json({ message: "Invalid coupon code or product ID" });
      }
      
      const coupon = await storage.getCouponByCode(code);
      
      if (!coupon) {
        return res.status(404).json({ message: "Coupon not found" });
      }
      
      // Check if coupon is associated with specific product
      if (coupon.productId !== null && coupon.productId !== productId) {
        return res.status(400).json({ message: "Coupon not valid for this product" });
      }
      
      // Check max usage
      if (coupon.maxUsage !== null && coupon.usageCount >= coupon.maxUsage) {
        return res.status(400).json({ message: "Coupon reached maximum usage" });
      }
      
      // Check expiration
      if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
        return res.status(400).json({ message: "Coupon expired" });
      }
      
      res.status(200).json(coupon);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Withdrawal routes
  app.post("/api/withdrawals", authenticate, authorize(["vendor", "affiliate"]), async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { amount } = req.body;
      
      if (!amount || amount < 20) {
        return res.status(400).json({ message: "Minimum withdrawal amount is R$20" });
      }
      
      if (user.balance < amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      // Create withdrawal request
      const withdrawal = await storage.createWithdrawal({
        userId,
        amount
      });
      
      // Update user balance
      await storage.updateUser(userId, {
        balance: user.balance - amount
      });
      
      res.status(201).json(withdrawal);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/withdrawals", authenticate, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      let withdrawals;
      
      if (user.role === "admin") {
        // Admin can see all withdrawals
        const allUsers = await storage.listUsers();
        const allWithdrawals = [];
        for (const user of allUsers) {
          const userWithdrawals = await storage.listWithdrawalsByUser(user.id);
          allWithdrawals.push(...userWithdrawals);
        }
        withdrawals = allWithdrawals;
      } else {
        // User sees their own withdrawals
        withdrawals = await storage.listWithdrawalsByUser(userId);
      }
      
      res.status(200).json(withdrawals);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/withdrawals/:id/status", authenticate, authorize(["admin"]), async (req, res) => {
    try {
      const withdrawalId = parseInt(req.params.id);
      const { status, stripeTransferId } = req.body;
      
      if (!status || !["pending", "completed", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const withdrawal = await storage.updateWithdrawalStatus(withdrawalId, status, stripeTransferId);
      
      if (!withdrawal) {
        return res.status(404).json({ message: "Withdrawal not found" });
      }
      
      // If rejected, return funds to user
      if (status === "rejected") {
        const user = await storage.getUser(withdrawal.userId);
        if (user) {
          await storage.updateUser(user.id, {
            balance: user.balance + withdrawal.amount
          });
        }
      }
      
      res.status(200).json(withdrawal);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Review routes
  app.post("/api/reviews", authenticate, async (req, res) => {
    try {
      const reviewData = insertReviewSchema.parse({
        ...req.body,
        userId: req.session.userId
      });
      
      // Check if product exists
      const product = await storage.getProduct(reviewData.productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Check if user has purchased the product
      const sales = await storage.listSalesByUser(req.session.userId!, "buyer");
      const hasPurchased = sales.some(sale => 
        sale.productId === reviewData.productId && 
        sale.status === "completed"
      );
      
      if (!hasPurchased) {
        return res.status(403).json({ message: "You must purchase the product to review it" });
      }
      
      const review = await storage.createReview(reviewData);
      res.status(201).json(review);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/products/:id/reviews", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      
      // Check if product exists
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      const reviews = await storage.getReviewsByProduct(productId);
      res.status(200).json(reviews);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Plan routes
  app.get("/api/plans", async (req, res) => {
    try {
      const plans = await storage.listPlans();
      res.status(200).json(plans);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Category routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.listCategories();
      res.status(200).json(categories);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Stripe integration
  if (stripe) {
    // Create payment intent for one-time purchase
    app.post("/api/create-payment-intent", authenticate, async (req, res) => {
      try {
        const { productId, couponCode, affiliateId } = req.body;
        
        // Get product
        const product = await storage.getProduct(productId);
        if (!product) {
          return res.status(404).json({ message: "Product not found" });
        }
        
        // Calculate amount
        let amount = product.price;
        
        // Apply coupon if provided
        if (couponCode) {
          const coupon = await storage.getCouponByCode(couponCode);
          
          if (coupon && 
              (!coupon.productId || coupon.productId === product.id) && 
              (!coupon.maxUsage || coupon.usageCount < coupon.maxUsage) &&
              (!coupon.expiresAt || new Date(coupon.expiresAt) >= new Date())
          ) {
            if (coupon.type === "percentage") {
              amount = amount * (1 - coupon.value / 100);
            } else {
              amount = Math.max(0, amount - coupon.value);
            }
            
            // Increment coupon usage
            await storage.incrementCouponUsage(coupon.id);
          }
        }
        
        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency: "brl",
          metadata: {
            productId,
            buyerId: req.session.userId,
            sellerId: product.sellerId,
            ...(affiliateId && { affiliateId }),
            ...(couponCode && { couponCode })
          }
        });
        
        res.status(200).json({ clientSecret: paymentIntent.client_secret });
      } catch (error: any) {
        res.status(400).json({ message: error.message });
      }
    });

    // Webhook to handle successful payments
    app.post("/api/stripe-webhook", async (req, res) => {
      const payload = req.body;
      const sig = req.headers['stripe-signature'];
      
      let event;
      
      try {
        // Verificar se o webhook secret está definido
        if (!process.env.STRIPE_WEBHOOK_SECRET) {
          throw new Error('Missing STRIPE_WEBHOOK_SECRET');
        }
        
        event = stripe.webhooks.constructEvent(
          payload, 
          sig || '', 
          process.env.STRIPE_WEBHOOK_SECRET
        );
      } catch (err: any) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
      
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const metadata = paymentIntent.metadata;
        
        // Create sale record
        const product = await storage.getProduct(parseInt(metadata.productId));
        if (!product) {
          return res.status(400).json({ message: "Product not found" });
        }
        
        const buyerId = parseInt(metadata.buyerId);
        const sellerId = parseInt(metadata.sellerId);
        const affiliateId = metadata.affiliateId ? parseInt(metadata.affiliateId) : undefined;
        
        // Calculate amounts
        const amount = paymentIntent.amount / 100; // Convert from cents
        
        // Get seller's plan to determine platform fee
        const seller = await storage.getUser(sellerId);
        if (!seller) {
          return res.status(400).json({ message: "Seller not found" });
        }
        
        // Default to free plan if seller doesn't have a plan
        const planId = seller.planId || 1; // Plano gratuito tem ID 1
        const plan = await storage.getPlan(planId);
        if (!plan) {
          return res.status(400).json({ message: "Plan not found" });
        }
        
        const platformFeePercentage = plan.platformFeePercentage;
        
        // Calculate affiliate amount if applicable
        let affiliateAmount = 0;
        let sellerAmount = amount;
        
        if (affiliateId) {
          // Calculate commission based on product settings
          if (product.commissionType === "percentage") {
            affiliateAmount = amount * (product.commissionRate / 100);
          } else {
            affiliateAmount = product.commissionRate;
          }
          
          // Apply platform fee to affiliate amount (4%)
          const affiliatePlatformFee = affiliateAmount * 0.04;
          affiliateAmount -= affiliatePlatformFee;
          
          // Update affiliate balance
          const affiliate = await storage.getUser(affiliateId);
          if (affiliate) {
            await storage.updateUser(affiliateId, {
              balance: affiliate.balance + affiliateAmount
            });
          }
          
          // Adjust seller amount
          sellerAmount -= affiliateAmount;
        }
        
        // Apply platform fee to seller amount
        const platformFee = sellerAmount * (platformFeePercentage / 100);
        sellerAmount -= platformFee;
        
        // Update seller balance
        await storage.updateUser(sellerId, {
          balance: seller.balance + sellerAmount
        });
        
        // Create sale record
        await storage.createSale({
          productId: parseInt(metadata.productId),
          buyerId,
          sellerId,
          affiliateId,
          amount,
          sellerAmount,
          affiliateAmount,
          platformFee,
          status: "completed",
          paymentMethod: "stripe",
          stripePaymentIntentId: paymentIntent.id
        });
      } else if (event.type === 'payment_intent.payment_failed') {
        const paymentIntent = event.data.object;
        console.log('Payment failed:', paymentIntent.id);
      }
      
      res.status(200).json({ received: true });
    });

    // Create subscription
    app.post("/api/create-subscription", authenticate, async (req, res) => {
      try {
        const { planId } = req.body;
        
        // Get user
        const userId = req.session.userId!;
        const user = await storage.getUser(userId);
        
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        
        // Get plan
        const plan = await storage.getPlan(planId);
        if (!plan) {
          return res.status(404).json({ message: "Plan not found" });
        }
        
        // Free plan doesn't need payment
        if (plan.price === 0) {
          await storage.updateUser(userId, { planId });
          return res.status(200).json({ success: true, message: "Subscribed to free plan" });
        }
        
        // Create or get stripe customer
        let customerId = user.stripeCustomerId;
        
        if (!customerId) {
          const customer = await stripe.customers.create({
            email: user.email,
            name: user.fullName || user.username,
          });
          
          customerId = customer.id;
          await storage.updateUser(userId, { stripeCustomerId: customerId });
        }
        
        // Create subscription
        const subscription = await stripe.subscriptions.create({
          customer: customerId,
          items: [{
            // Garantir que temos um preço válido
            price: plan.stripePriceId || '', // Fallback vazio caso não exista
          }],
          payment_behavior: 'default_incomplete',
          expand: ['latest_invoice.payment_intent'],
        });
        
        // Update user with subscription info
        await storage.updateUser(userId, {
          planId,
          stripeSubscriptionId: subscription.id
        });
        
        // Garantir que temos um clientSecret válido
        let clientSecret = '';
        if (subscription.latest_invoice && 
            typeof subscription.latest_invoice !== 'string' && 
            subscription.latest_invoice.payment_intent && 
            typeof subscription.latest_invoice.payment_intent !== 'string') {
          clientSecret = subscription.latest_invoice.payment_intent.client_secret || '';
        }
        
        res.status(200).json({
          subscriptionId: subscription.id,
          clientSecret,
        });
      } catch (error: any) {
        res.status(400).json({ message: error.message });
      }
    });
  }

  const httpServer = createServer(app);
  return httpServer;
}
