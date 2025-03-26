import { storage } from "../storage";
import { subDays } from "date-fns";
import type { InsertProduct } from "@shared/schema";

export class ProductService {
  // Initial product data
  private initialProducts: InsertProduct[] = [
    { name: "Apple AirPods Pro", sku: "AP-PRO-2023", category: "Audio", price: "229.99" },
    { name: "Samsung Galaxy Watch 4", sku: "SGW-40MM", category: "Wearables", price: "199.99" },
    { name: "Sony WH-1000XM4", sku: "SONY-WH1000", category: "Audio", price: "279.99" },
    { name: "Nintendo Switch", sku: "NINT-SWITCH-V2", category: "Gaming", price: "299.99" },
    { name: "iPad Air (2022)", sku: "IPAD-AIR-22", category: "Tablets", price: "549.99" },
    { name: "Bose QuietComfort Earbuds", sku: "BOSE-QC-EB", category: "Audio", price: "199.99" },
    { name: "Fitbit Versa 3", sku: "FITBIT-V3", category: "Wearables", price: "169.99" },
    { name: "DJI Mini 3 Pro", sku: "DJI-MINI3P", category: "Electronics", price: "759.99" },
    { name: "Canon EOS R6", sku: "CANON-EOSR6", category: "Cameras", price: "2299.99" },
    { name: "Logitech MX Master 3", sku: "LOGI-MXM3", category: "Computers", price: "99.99" },
  ];

  // Competitors
  private competitors = ["amazon", "walmart", "bestbuy"];

  async initializeProducts() {
    const existingProducts = await storage.getAllProducts();

    if (existingProducts.length === 0) {
      // Add products
      for (const productData of this.initialProducts) {
        const product = await storage.createProduct(productData);

        // Add initial competitor prices
        for (const competitor of this.competitors) {
          // Generate a competitor price within ±10% of the product price
          const variancePercent = Math.random() * 20 - 10; // Random between -10% and +10%
          const variance = parseFloat(product.price) * (variancePercent / 100);
          const competitorPrice = Math.max(parseFloat(product.price) + variance, 0.01).toFixed(2);

          await storage.createCompetitorPrice({
            productId: product.id,
            competitor,
            price: competitorPrice
          });
        }

        // Generate 7 days of price history for each product
        await this.generatePriceHistory(product.id, 7);
      }

      // Update product statuses and optimal prices
      await this.updateProductStatuses();
    }
  }

  async generatePriceHistory(productId: number, days: number) {
    const product = await storage.getProduct(productId);
    if (!product) return;

    const basePrice = parseFloat(product.price);
    const competitorPrices = await storage.getCompetitorPricesByProductId(productId);
    const pricesByCompetitor: Record<string, number> = {};

    competitorPrices.forEach(cp => {
      pricesByCompetitor[cp.competitor] = parseFloat(cp.price);
    });

    // Generate historical data for the past N days
    for (let i = days; i >= 0; i--) {
      const date = subDays(new Date(), i);

      // Add your price history
      await storage.createPriceHistory({
        productId,
        source: "your",
        price: basePrice.toString(),
        date
      });

      // Add competitor prices with daily variations
      for (const competitor of this.competitors) {
        const baseCompPrice = pricesByCompetitor[competitor] || basePrice;
        const dailyVariance = baseCompPrice * (Math.random() * 0.04 - 0.02);
        const historicalPrice = (baseCompPrice + dailyVariance).toFixed(2);

        await storage.createPriceHistory({
          productId,
          source: competitor,
          price: historicalPrice,
          date
        });
      }
    }
  }

  async updateCompetitorPrices() {
    const products = await storage.getAllProducts();

    for (const product of products) {
      for (const competitor of this.competitors) {
        const competitorPrices = await storage.getCompetitorPricesByProductId(product.id);
        const existingPrice = competitorPrices.find(p => p.competitor === competitor);

        if (existingPrice) {
          const currentPrice = parseFloat(existingPrice.price);
          const variance = currentPrice * (Math.random() * 0.06 - 0.03);
          const newPrice = Math.max(currentPrice + variance, 0.01).toFixed(2);

          await storage.createCompetitorPrice({
            productId: product.id,
            competitor,
            price: newPrice
          });

          await storage.createPriceHistory({
            productId: product.id,
            source: competitor,
            price: newPrice,
            date: new Date().toISOString()
          });
        }
      }
    }

    await this.updateProductStatuses();
  }

  private async updateProductStatuses() {
    const products = await storage.getAllProducts();

    for (const product of products) {
      const competitorPrices = await storage.getCompetitorPricesByProductId(product.id);

      if (competitorPrices.length === 0) continue;

      const avgCompetitorPrice = competitorPrices.reduce((sum, cp) => sum + parseFloat(cp.price), 0) / competitorPrices.length;
      const optimalPrice = Math.max(avgCompetitorPrice * 0.95, parseFloat(product.price) * 0.9).toFixed(2);
      const status = this.determineProductStatus(parseFloat(product.price), parseFloat(optimalPrice));

      await storage.updateProduct(product.id, { optimalPrice, status });
    }
  }

  private determineProductStatus(currentPrice: number, optimalPrice: number): string {
    const priceDiff = Math.abs(currentPrice - optimalPrice);
    const percentDiff = (priceDiff / currentPrice) * 100;

    if (percentDiff < 2) return "Competitive";
    if (percentDiff < 5) return "Consider Adjustment";
    return "Adjustment Needed";
  }
}

export const productService = new ProductService();