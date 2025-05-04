import { 
  users, User, InsertUser, 
  products, Product, InsertProduct,
  sales, Sale, InsertSale,
  affiliateRelations, AffiliateRelation, InsertAffiliateRelation,
  coupons, Coupon, InsertCoupon,
  withdrawals, Withdrawal, InsertWithdrawal,
  reviews, Review, InsertReview,
  plans, Plan, InsertPlan,
  categories, Category, InsertCategory
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  updateUserStripeInfo(id: number, stripeInfo: { stripeCustomerId: string, stripeSubscriptionId: string }): Promise<User | undefined>;
  listUsers(): Promise<User[]>;
  
  // Product methods
  createProduct(product: InsertProduct): Promise<Product>;
  getProduct(id: number): Promise<Product | undefined>;
  updateProduct(id: number, productData: Partial<Product>): Promise<Product | undefined>;
  listProducts(filters?: { sellerId?: number; isPublic?: boolean; categoryId?: number; isPaid?: boolean }): Promise<Product[]>;
  deleteProduct(id: number): Promise<boolean>;
  
  // Sale methods
  createSale(sale: InsertSale): Promise<Sale>;
  getSale(id: number): Promise<Sale | undefined>;
  updateSaleStatus(id: number, status: string): Promise<Sale | undefined>;
  listSalesByUser(userId: number, role: 'buyer' | 'seller' | 'affiliate'): Promise<Sale[]>;
  
  // Affiliate methods
  createAffiliateRelation(relation: InsertAffiliateRelation): Promise<AffiliateRelation>;
  getAffiliateRelation(id: number): Promise<AffiliateRelation | undefined>;
  updateAffiliateRelationStatus(id: number, status: string): Promise<AffiliateRelation | undefined>;
  listAffiliateRelationsByUser(userId: number): Promise<AffiliateRelation[]>;
  listAffiliateRelationsByProduct(productId: number): Promise<AffiliateRelation[]>;
  
  // Coupon methods
  createCoupon(coupon: InsertCoupon): Promise<Coupon>;
  getCouponByCode(code: string): Promise<Coupon | undefined>;
  incrementCouponUsage(id: number): Promise<Coupon | undefined>;
  listCouponsBySeller(sellerId: number): Promise<Coupon[]>;
  
  // Withdrawal methods
  createWithdrawal(withdrawal: InsertWithdrawal): Promise<Withdrawal>;
  updateWithdrawalStatus(id: number, status: string, stripeTransferId?: string): Promise<Withdrawal | undefined>;
  listWithdrawalsByUser(userId: number): Promise<Withdrawal[]>;
  
  // Review methods
  createReview(review: InsertReview): Promise<Review>;
  getReviewsByProduct(productId: number): Promise<Review[]>;
  getAverageRatingByProduct(productId: number): Promise<number>;
  
  // Plan methods
  getPlan(id: number): Promise<Plan | undefined>;
  listPlans(): Promise<Plan[]>;
  
  // Category methods
  createCategory(category: InsertCategory): Promise<Category>;
  getCategory(id: number): Promise<Category | undefined>;
  listCategories(): Promise<Category[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private sales: Map<number, Sale>;
  private affiliateRelations: Map<number, AffiliateRelation>;
  private coupons: Map<number, Coupon>;
  private withdrawals: Map<number, Withdrawal>;
  private reviews: Map<number, Review>;
  private plans: Map<number, Plan>;
  private categories: Map<number, Category>;
  
  private currentUserId: number;
  private currentProductId: number;
  private currentSaleId: number;
  private currentAffiliateRelationId: number;
  private currentCouponId: number;
  private currentWithdrawalId: number;
  private currentReviewId: number;
  private currentPlanId: number;
  private currentCategoryId: number;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.sales = new Map();
    this.affiliateRelations = new Map();
    this.coupons = new Map();
    this.withdrawals = new Map();
    this.reviews = new Map();
    this.plans = new Map();
    this.categories = new Map();
    
    this.currentUserId = 1;
    this.currentProductId = 1;
    this.currentSaleId = 1;
    this.currentAffiliateRelationId = 1;
    this.currentCouponId = 1;
    this.currentWithdrawalId = 1;
    this.currentReviewId = 1;
    this.currentPlanId = 1;
    this.currentCategoryId = 1;
    
    // Initialize default plans
    this.initializePlans();
    // Initialize default categories
    this.initializeCategories();
  }

  private initializePlans() {
    const defaultPlans: InsertPlan[] = [
      {
        name: "Free",
        price: 0,
        productLimit: 1,
        affiliateLimit: 0,
        supportLevel: "None",
        hasHighlight: false,
        platformFeePercentage: 6,
        stripePriceId: "price_free"
      },
      {
        name: "Start",
        price: 19.90,
        productLimit: 5,
        affiliateLimit: 2,
        supportLevel: "Email",
        hasHighlight: false,
        platformFeePercentage: 5,
        stripePriceId: "price_start"
      },
      {
        name: "Pro",
        price: 49.90,
        productLimit: 20,
        affiliateLimit: 0, // Unlimited
        supportLevel: "Rápido",
        hasHighlight: true,
        platformFeePercentage: 4,
        stripePriceId: "price_pro"
      },
      {
        name: "Master",
        price: 99.90,
        productLimit: 50,
        affiliateLimit: 0, // Unlimited
        supportLevel: "Premium",
        hasHighlight: true,
        platformFeePercentage: 3,
        stripePriceId: "price_master"
      },
      {
        name: "Infinity",
        price: 199.90,
        productLimit: 0, // Unlimited
        affiliateLimit: 0, // Unlimited
        supportLevel: "VIP",
        hasHighlight: true,
        platformFeePercentage: 2,
        stripePriceId: "price_infinity"
      }
    ];

    defaultPlans.forEach(plan => {
      this.plans.set(this.currentPlanId, { 
        ...plan, 
        id: this.currentPlanId,
        createdAt: new Date() 
      });
      this.currentPlanId++;
    });
  }

  private initializeCategories() {
    const defaultCategories: InsertCategory[] = [
      { name: "Marketing Digital", description: "Produtos relacionados a marketing digital e estratégias online." },
      { name: "Tecnologia", description: "Produtos relacionados a tecnologia, programação e desenvolvimento." },
      { name: "Finanças", description: "Produtos relacionados a finanças, investimentos e educação financeira." },
      { name: "Educação", description: "Produtos educacionais e cursos diversos." },
      { name: "Saúde e Bem-estar", description: "Produtos relacionados a saúde, bem-estar e qualidade de vida." }
    ];

    defaultCategories.forEach(category => {
      this.categories.set(this.currentCategoryId, { 
        ...category, 
        id: this.currentCategoryId,
        createdAt: new Date() 
      });
      this.currentCategoryId++;
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id, balance: 0, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserStripeInfo(id: number, stripeInfo: { stripeCustomerId: string, stripeSubscriptionId: string }): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { 
      ...user, 
      stripeCustomerId: stripeInfo.stripeCustomerId,
      stripeSubscriptionId: stripeInfo.stripeSubscriptionId
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async listUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Product methods
  async createProduct(product: InsertProduct): Promise<Product> {
    const id = this.currentProductId++;
    const newProduct: Product = { ...product, id, createdAt: new Date() };
    this.products.set(id, newProduct);
    return newProduct;
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async updateProduct(id: number, productData: Partial<Product>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    
    const updatedProduct = { ...product, ...productData };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async listProducts(filters?: { sellerId?: number; isPublic?: boolean; categoryId?: number; isPaid?: boolean }): Promise<Product[]> {
    let products = Array.from(this.products.values());
    
    if (filters) {
      if (filters.sellerId !== undefined) {
        products = products.filter(product => product.sellerId === filters.sellerId);
      }
      
      if (filters.isPublic !== undefined) {
        products = products.filter(product => product.isPublic === filters.isPublic);
      }
      
      if (filters.categoryId !== undefined) {
        products = products.filter(product => product.categoryId === filters.categoryId);
      }
      
      if (filters.isPaid !== undefined) {
        products = products.filter(product => product.isPaid === filters.isPaid);
      }
    }
    
    return products;
  }

  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }

  // Sale methods
  async createSale(sale: InsertSale): Promise<Sale> {
    const id = this.currentSaleId++;
    const newSale: Sale = { ...sale, id, createdAt: new Date() };
    this.sales.set(id, newSale);
    return newSale;
  }

  async getSale(id: number): Promise<Sale | undefined> {
    return this.sales.get(id);
  }

  async updateSaleStatus(id: number, status: string): Promise<Sale | undefined> {
    const sale = this.sales.get(id);
    if (!sale) return undefined;
    
    const updatedSale = { ...sale, status };
    this.sales.set(id, updatedSale);
    return updatedSale;
  }

  async listSalesByUser(userId: number, role: 'buyer' | 'seller' | 'affiliate'): Promise<Sale[]> {
    const sales = Array.from(this.sales.values());
    
    if (role === 'buyer') {
      return sales.filter(sale => sale.buyerId === userId);
    } else if (role === 'seller') {
      return sales.filter(sale => sale.sellerId === userId);
    } else {
      return sales.filter(sale => sale.affiliateId === userId);
    }
  }

  // Affiliate methods
  async createAffiliateRelation(relation: InsertAffiliateRelation): Promise<AffiliateRelation> {
    const id = this.currentAffiliateRelationId++;
    const newRelation: AffiliateRelation = { ...relation, id, createdAt: new Date() };
    this.affiliateRelations.set(id, newRelation);
    return newRelation;
  }

  async getAffiliateRelation(id: number): Promise<AffiliateRelation | undefined> {
    return this.affiliateRelations.get(id);
  }

  async updateAffiliateRelationStatus(id: number, status: string): Promise<AffiliateRelation | undefined> {
    const relation = this.affiliateRelations.get(id);
    if (!relation) return undefined;
    
    const updatedRelation = { ...relation, status };
    this.affiliateRelations.set(id, updatedRelation);
    return updatedRelation;
  }

  async listAffiliateRelationsByUser(userId: number): Promise<AffiliateRelation[]> {
    return Array.from(this.affiliateRelations.values())
      .filter(relation => relation.affiliateId === userId);
  }

  async listAffiliateRelationsByProduct(productId: number): Promise<AffiliateRelation[]> {
    return Array.from(this.affiliateRelations.values())
      .filter(relation => relation.productId === productId);
  }

  // Coupon methods
  async createCoupon(coupon: InsertCoupon): Promise<Coupon> {
    const id = this.currentCouponId++;
    const newCoupon: Coupon = { ...coupon, id, usageCount: 0, createdAt: new Date() };
    this.coupons.set(id, newCoupon);
    return newCoupon;
  }

  async getCouponByCode(code: string): Promise<Coupon | undefined> {
    return Array.from(this.coupons.values())
      .find(coupon => coupon.code === code);
  }

  async incrementCouponUsage(id: number): Promise<Coupon | undefined> {
    const coupon = this.coupons.get(id);
    if (!coupon) return undefined;
    
    const updatedCoupon = { ...coupon, usageCount: coupon.usageCount + 1 };
    this.coupons.set(id, updatedCoupon);
    return updatedCoupon;
  }

  async listCouponsBySeller(sellerId: number): Promise<Coupon[]> {
    return Array.from(this.coupons.values())
      .filter(coupon => coupon.sellerId === sellerId);
  }

  // Withdrawal methods
  async createWithdrawal(withdrawal: InsertWithdrawal): Promise<Withdrawal> {
    const id = this.currentWithdrawalId++;
    const newWithdrawal: Withdrawal = { 
      ...withdrawal, 
      id, 
      status: 'pending',
      createdAt: new Date() 
    };
    this.withdrawals.set(id, newWithdrawal);
    return newWithdrawal;
  }

  async updateWithdrawalStatus(id: number, status: string, stripeTransferId?: string): Promise<Withdrawal | undefined> {
    const withdrawal = this.withdrawals.get(id);
    if (!withdrawal) return undefined;
    
    const updatedWithdrawal = { 
      ...withdrawal, 
      status,
      ...(stripeTransferId && { stripeTransferId })
    };
    this.withdrawals.set(id, updatedWithdrawal);
    return updatedWithdrawal;
  }

  async listWithdrawalsByUser(userId: number): Promise<Withdrawal[]> {
    return Array.from(this.withdrawals.values())
      .filter(withdrawal => withdrawal.userId === userId);
  }

  // Review methods
  async createReview(review: InsertReview): Promise<Review> {
    const id = this.currentReviewId++;
    const newReview: Review = { ...review, id, createdAt: new Date() };
    this.reviews.set(id, newReview);
    return newReview;
  }

  async getReviewsByProduct(productId: number): Promise<Review[]> {
    return Array.from(this.reviews.values())
      .filter(review => review.productId === productId);
  }

  async getAverageRatingByProduct(productId: number): Promise<number> {
    const reviews = await this.getReviewsByProduct(productId);
    if (reviews.length === 0) return 0;
    
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / reviews.length;
  }

  // Plan methods
  async getPlan(id: number): Promise<Plan | undefined> {
    return this.plans.get(id);
  }

  async listPlans(): Promise<Plan[]> {
    return Array.from(this.plans.values());
  }

  // Category methods
  async createCategory(category: InsertCategory): Promise<Category> {
    const id = this.currentCategoryId++;
    const newCategory: Category = { ...category, id, createdAt: new Date() };
    this.categories.set(id, newCategory);
    return newCategory;
  }

  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async listCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }
}

// Import MongoDB storage implementation
import { MongoDBStorage } from './mongodb-storage';

// Choose which storage to use based on environment
const USE_MONGODB = process.env.USE_MONGODB === 'true';

// Export the storage instance
export const storage = USE_MONGODB ? new MongoDBStorage() : new MemStorage();
