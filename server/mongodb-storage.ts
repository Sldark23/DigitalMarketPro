import { ObjectId } from 'mongodb';
import { dbConnection } from './db';
import { 
  User, InsertUser, 
  Product, InsertProduct,
  Sale, InsertSale,
  AffiliateRelation, InsertAffiliateRelation,
  Coupon, InsertCoupon,
  Withdrawal, InsertWithdrawal,
  Review, InsertReview,
  Plan, InsertPlan, 
  Category, InsertCategory
} from "@shared/schema";
import { IStorage } from './storage';

export class MongoDBStorage implements IStorage {
  private db: any;
  
  // Initialize MongoDB connection and collections
  private async getDb() {
    if (!this.db) {
      this.db = await dbConnection.connect();
    }
    return this.db;
  }
  
  // Helper method to generate sequential IDs
  private async getNextId(collectionName: string): Promise<number> {
    const db = await this.getDb();
    const counters = db.collection('counters');
    const result = await counters.findOneAndUpdate(
      { _id: collectionName },
      { $inc: { sequence_value: 1 } },
      { upsert: true, returnDocument: 'after' }
    );
    
    return result.value?.sequence_value || 1;
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const db = await this.getDb();
    const user = await db.collection('users').findOne({ id });
    return user || undefined;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const db = await this.getDb();
    const user = await db.collection('users').findOne({ username });
    return user || undefined;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const db = await this.getDb();
    const user = await db.collection('users').findOne({ email });
    return user || undefined;
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const db = await this.getDb();
    const id = await this.getNextId('users');
    
    const user: User = { 
      id,
      username: insertUser.username,
      password: insertUser.password,
      email: insertUser.email,
      fullName: insertUser.fullName,
      role: insertUser.role || "buyer", 
      profilePicture: insertUser.profilePicture || null,
      balance: 0,
      planId: insertUser.planId || 1,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      createdAt: new Date()
    };
    
    await db.collection('users').insertOne(user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const db = await this.getDb();
    const result = await db.collection('users').findOneAndUpdate(
      { id },
      { $set: userData },
      { returnDocument: 'after' }
    );
    
    return result.value || undefined;
  }
  
  async updateUserStripeInfo(id: number, stripeInfo: { stripeCustomerId: string, stripeSubscriptionId: string }): Promise<User | undefined> {
    const db = await this.getDb();
    const result = await db.collection('users').findOneAndUpdate(
      { id },
      { $set: stripeInfo },
      { returnDocument: 'after' }
    );
    
    return result.value || undefined;
  }
  
  async listUsers(): Promise<User[]> {
    const db = await this.getDb();
    return await db.collection('users').find().toArray();
  }
  
  // Product methods
  async createProduct(product: InsertProduct): Promise<Product> {
    const db = await this.getDb();
    const id = await this.getNextId('products');
    
    const newProduct: Product = { 
      ...product, 
      id, 
      createdAt: new Date(),
      downloadUrl: product.downloadUrl || null,
      thumbnailUrl: product.thumbnailUrl || null,
      isPublic: product.isPublic !== undefined ? product.isPublic : true,
      isActive: product.isActive !== undefined ? product.isActive : true,
      isPaid: product.isPaid !== undefined ? product.isPaid : true,
      commissionRate: product.commissionRate !== undefined ? product.commissionRate : 10,
      commissionType: product.commissionType || "percentage",
      categoryId: product.categoryId || null
    };
    
    await db.collection('products').insertOne(newProduct);
    return newProduct;
  }
  
  async getProduct(id: number): Promise<Product | undefined> {
    const db = await this.getDb();
    const product = await db.collection('products').findOne({ id });
    return product || undefined;
  }
  
  async updateProduct(id: number, productData: Partial<Product>): Promise<Product | undefined> {
    const db = await this.getDb();
    const result = await db.collection('products').findOneAndUpdate(
      { id },
      { $set: productData },
      { returnDocument: 'after' }
    );
    
    return result.value || undefined;
  }
  
  async listProducts(filters?: { sellerId?: number; isPublic?: boolean; categoryId?: number; isPaid?: boolean }): Promise<Product[]> {
    const db = await this.getDb();
    const query: any = {};
    
    if (filters) {
      if (filters.sellerId !== undefined) query.sellerId = filters.sellerId;
      if (filters.isPublic !== undefined) query.isPublic = filters.isPublic;
      if (filters.categoryId !== undefined) query.categoryId = filters.categoryId;
      if (filters.isPaid !== undefined) query.isPaid = filters.isPaid;
    }
    
    return await db.collection('products').find(query).toArray();
  }
  
  async deleteProduct(id: number): Promise<boolean> {
    const db = await this.getDb();
    const result = await db.collection('products').deleteOne({ id });
    return result.deletedCount > 0;
  }
  
  // Sale methods
  async createSale(sale: InsertSale): Promise<Sale> {
    const db = await this.getDb();
    const id = await this.getNextId('sales');
    
    const newSale: Sale = { 
      id,
      productId: sale.productId, 
      buyerId: sale.buyerId,
      sellerId: sale.sellerId,
      affiliateId: sale.affiliateId || null,
      amount: sale.amount,
      sellerAmount: sale.sellerAmount,
      affiliateAmount: sale.affiliateAmount || null,
      platformFee: sale.platformFee,
      status: sale.status || "pending",
      paymentMethod: sale.paymentMethod,
      stripePaymentIntentId: sale.stripePaymentIntentId || null,
      createdAt: new Date() 
    };
    
    await db.collection('sales').insertOne(newSale);
    return newSale;
  }
  
  async getSale(id: number): Promise<Sale | undefined> {
    const db = await this.getDb();
    const sale = await db.collection('sales').findOne({ id });
    return sale || undefined;
  }
  
  async updateSaleStatus(id: number, status: string): Promise<Sale | undefined> {
    const db = await this.getDb();
    const result = await db.collection('sales').findOneAndUpdate(
      { id },
      { $set: { status } },
      { returnDocument: 'after' }
    );
    
    return result.value || undefined;
  }
  
  async listSalesByUser(userId: number, role: 'buyer' | 'seller' | 'affiliate'): Promise<Sale[]> {
    const db = await this.getDb();
    const query: any = {};
    
    if (role === 'buyer') query.buyerId = userId;
    else if (role === 'seller') query.sellerId = userId;
    else if (role === 'affiliate') query.affiliateId = userId;
    
    return await db.collection('sales').find(query).toArray();
  }
  
  // Affiliate methods
  async createAffiliateRelation(relation: InsertAffiliateRelation): Promise<AffiliateRelation> {
    const db = await this.getDb();
    const id = await this.getNextId('affiliateRelations');
    
    const newRelation: AffiliateRelation = { 
      id,
      productId: relation.productId,
      affiliateId: relation.affiliateId,
      status: relation.status || "pending",
      createdAt: new Date() 
    };
    
    await db.collection('affiliateRelations').insertOne(newRelation);
    return newRelation;
  }
  
  async getAffiliateRelation(id: number): Promise<AffiliateRelation | undefined> {
    const db = await this.getDb();
    const relation = await db.collection('affiliateRelations').findOne({ id });
    return relation || undefined;
  }
  
  async updateAffiliateRelationStatus(id: number, status: string): Promise<AffiliateRelation | undefined> {
    const db = await this.getDb();
    const result = await db.collection('affiliateRelations').findOneAndUpdate(
      { id },
      { $set: { status } },
      { returnDocument: 'after' }
    );
    
    return result.value || undefined;
  }
  
  async listAffiliateRelationsByUser(userId: number): Promise<AffiliateRelation[]> {
    const db = await this.getDb();
    return await db.collection('affiliateRelations').find({ affiliateId: userId }).toArray();
  }
  
  async listAffiliateRelationsByProduct(productId: number): Promise<AffiliateRelation[]> {
    const db = await this.getDb();
    return await db.collection('affiliateRelations').find({ productId }).toArray();
  }
  
  // Coupon methods
  async createCoupon(coupon: InsertCoupon): Promise<Coupon> {
    const db = await this.getDb();
    const id = await this.getNextId('coupons');
    
    const newCoupon: Coupon = { 
      id,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      sellerId: coupon.sellerId,
      productId: coupon.productId || null,
      maxUsage: coupon.maxUsage || null,
      expiresAt: coupon.expiresAt || null,
      usageCount: 0, 
      createdAt: new Date() 
    };
    
    await db.collection('coupons').insertOne(newCoupon);
    return newCoupon;
  }
  
  async getCouponByCode(code: string): Promise<Coupon | undefined> {
    const db = await this.getDb();
    const coupon = await db.collection('coupons').findOne({ code });
    return coupon || undefined;
  }
  
  async incrementCouponUsage(id: number): Promise<Coupon | undefined> {
    const db = await this.getDb();
    const result = await db.collection('coupons').findOneAndUpdate(
      { id },
      { $inc: { usageCount: 1 } },
      { returnDocument: 'after' }
    );
    
    return result.value || undefined;
  }
  
  async listCouponsBySeller(sellerId: number): Promise<Coupon[]> {
    const db = await this.getDb();
    return await db.collection('coupons').find({ sellerId }).toArray();
  }
  
  // Withdrawal methods
  async createWithdrawal(withdrawal: InsertWithdrawal): Promise<Withdrawal> {
    const db = await this.getDb();
    const id = await this.getNextId('withdrawals');
    
    const newWithdrawal: Withdrawal = { 
      id,
      userId: withdrawal.userId,
      amount: withdrawal.amount,
      status: 'pending',
      stripeTransferId: null,
      createdAt: new Date() 
    };
    
    await db.collection('withdrawals').insertOne(newWithdrawal);
    return newWithdrawal;
  }
  
  async updateWithdrawalStatus(id: number, status: string, stripeTransferId?: string): Promise<Withdrawal | undefined> {
    const db = await this.getDb();
    const update: any = { status };
    if (stripeTransferId) update.stripeTransferId = stripeTransferId;
    
    const result = await db.collection('withdrawals').findOneAndUpdate(
      { id },
      { $set: update },
      { returnDocument: 'after' }
    );
    
    return result.value || undefined;
  }
  
  async listWithdrawalsByUser(userId: number): Promise<Withdrawal[]> {
    const db = await this.getDb();
    return await db.collection('withdrawals').find({ userId }).toArray();
  }
  
  // Review methods
  async createReview(review: InsertReview): Promise<Review> {
    const db = await this.getDb();
    const id = await this.getNextId('reviews');
    
    const newReview: Review = { 
      id,
      productId: review.productId,
      userId: review.userId,
      rating: review.rating,
      comment: review.comment || null,
      createdAt: new Date() 
    };
    
    await db.collection('reviews').insertOne(newReview);
    return newReview;
  }
  
  async getReviewsByProduct(productId: number): Promise<Review[]> {
    const db = await this.getDb();
    return await db.collection('reviews').find({ productId }).toArray();
  }
  
  async getAverageRatingByProduct(productId: number): Promise<number> {
    const db = await this.getDb();
    const reviews = await this.getReviewsByProduct(productId);
    
    if (reviews.length === 0) return 0;
    
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    return totalRating / reviews.length;
  }
  
  // Plan methods
  async getPlan(id: number): Promise<Plan | undefined> {
    const db = await this.getDb();
    const plan = await db.collection('plans').findOne({ id });
    return plan || undefined;
  }
  
  async listPlans(): Promise<Plan[]> {
    const db = await this.getDb();
    return await db.collection('plans').find().sort({ price: 1 }).toArray();
  }
  
  // Category methods
  async createCategory(category: InsertCategory): Promise<Category> {
    const db = await this.getDb();
    const id = await this.getNextId('categories');
    
    const newCategory: Category = { 
      id,
      name: category.name,
      description: category.description || null,
      createdAt: new Date() 
    };
    
    await db.collection('categories').insertOne(newCategory);
    return newCategory;
  }
  
  async getCategory(id: number): Promise<Category | undefined> {
    const db = await this.getDb();
    const category = await db.collection('categories').findOne({ id });
    return category || undefined;
  }
  
  async listCategories(): Promise<Category[]> {
    const db = await this.getDb();
    return await db.collection('categories').find().toArray();
  }
}