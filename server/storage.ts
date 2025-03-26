
import { 
  products, 
  competitorPrices, 
  priceHistory,
  type InsertProduct, 
  type Product, 
  type InsertCompetitorPrice, 
  type CompetitorPrice,
  type InsertPriceHistory,
  type PriceHistory,
  users,
  type User,
  type InsertUser
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Product operations
  createProduct(product: InsertProduct): Promise<Product>;
  getProduct(id: number): Promise<Product | undefined>;
  getAllProducts(): Promise<Product[]>;
  updateProduct(id: number, updates: Partial<Product>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  
  // Competitor price operations
  createCompetitorPrice(price: InsertCompetitorPrice): Promise<CompetitorPrice>;
  getCompetitorPricesByProductId(productId: number): Promise<CompetitorPrice[]>;
  getAllCompetitorPrices(): Promise<CompetitorPrice[]>;
  
  // Price history operations
  createPriceHistory(history: InsertPriceHistory): Promise<PriceHistory>;
  getPriceHistoryByProductId(productId: number, days?: number): Promise<PriceHistory[]>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private competitorPrices: Map<number, CompetitorPrice>;
  private priceHistories: Map<number, PriceHistory>;
  
  private userCurrentId: number;
  private productCurrentId: number;
  private competitorPriceCurrentId: number;
  private priceHistoryCurrentId: number;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.competitorPrices = new Map();
    this.priceHistories = new Map();
    
    this.userCurrentId = 1;
    this.productCurrentId = 1;
    this.competitorPriceCurrentId = 1;
    this.priceHistoryCurrentId = 1;
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Product methods
  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.productCurrentId++;
    const now = new Date();
    
    const product: Product = { 
      ...insertProduct, 
      id, 
      optimalPrice: null, 
      status: "unknown",
      updatedAt: now
    };
    
    this.products.set(id, product);
    return product;
  }
  
  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }
  
  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).sort((a, b) => a.id - b.id);
  }
  
  async updateProduct(id: number, updates: Partial<Product>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    
    const updatedProduct = { ...product, ...updates };
    
    if (!updates.updatedAt) {
      updatedProduct.updatedAt = new Date();
    }
    
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }
  
  async deleteProduct(id: number): Promise<boolean> {
    if (!this.products.has(id)) {
      return false;
    }
    
    this.products.delete(id);
    
    for (const [priceId, price] of this.competitorPrices) {
      if (price.productId === id) {
        this.competitorPrices.delete(priceId);
      }
    }
    
    for (const [historyId, history] of this.priceHistories) {
      if (history.productId === id) {
        this.priceHistories.delete(historyId);
      }
    }
    
    return true;
  }
  
  // Competitor price methods
  async createCompetitorPrice(insertPrice: InsertCompetitorPrice): Promise<CompetitorPrice> {
    const id = this.competitorPriceCurrentId++;
    const now = new Date();
    
    const competitorPrice: CompetitorPrice = { 
      ...insertPrice, 
      id, 
      timestamp: now 
    };
    
    this.competitorPrices.set(id, competitorPrice);
    return competitorPrice;
  }
  
  async getCompetitorPricesByProductId(productId: number): Promise<CompetitorPrice[]> {
    return Array.from(this.competitorPrices.values())
      .filter(price => price.productId === productId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  
  async getAllCompetitorPrices(): Promise<CompetitorPrice[]> {
    return Array.from(this.competitorPrices.values());
  }
  
  // Price history methods
  async createPriceHistory(insertHistory: InsertPriceHistory): Promise<PriceHistory> {
    const id = this.priceHistoryCurrentId++;
    
    const priceHistory: PriceHistory = { 
      ...insertHistory, 
      id,
      date: insertHistory.date || new Date()
    };
    
    this.priceHistories.set(id, priceHistory);
    return priceHistory;
  }
  
  async getPriceHistoryByProductId(productId: number, days = 7): Promise<PriceHistory[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return Array.from(this.priceHistories.values())
      .filter(history => 
        history.productId === productId && 
        history.date >= cutoffDate
      )
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }
}

export const storage = new MemStorage();
