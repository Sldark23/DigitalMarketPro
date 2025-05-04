import { MongoClient, ObjectId } from 'mongodb';
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

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://User:MLKAXJ3b8XWm9wxV@cluster0.hd1hxm7.mongodb.net/';
const DB_NAME = 'catpay';

export class MongoDBConnection {
  private client: MongoClient;
  private connected: boolean = false;
  
  constructor() {
    this.client = new MongoClient(MONGODB_URI);
  }
  
  async connect() {
    if (!this.connected) {
      try {
        await this.client.connect();
        console.log('Connected to MongoDB Atlas');
        this.connected = true;
      } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        throw error;
      }
    }
    return this.client.db(DB_NAME);
  }
  
  async close() {
    if (this.connected) {
      await this.client.close();
      this.connected = false;
      console.log('Disconnected from MongoDB');
    }
  }

  // Helper method to convert MongoDB _id to string id
  mapIdToString<T extends { _id?: ObjectId }>(doc: T): Omit<T, '_id'> & { id: number } {
    if (!doc) return null as any;
    
    // Extract and remove _id
    const { _id, ...rest } = doc;
    
    // If _id exists, convert to string and add as id
    const result = {
      ...rest,
      id: _id ? parseInt(_id.toString().substring(0, 8), 16) : undefined
    } as Omit<T, '_id'> & { id: number };
    
    return result;
  }
  
  // Helper method to prepare documents for insertion by removing id
  prepareDocumentForInsertion<T extends { id?: number }>(doc: T): Omit<T, 'id'> {
    if (!doc) return null as any;
    
    // Extract and remove id
    const { id, ...rest } = doc;
    
    return rest as Omit<T, 'id'>;
  }
}

// Create a singleton instance
export const dbConnection = new MongoDBConnection();