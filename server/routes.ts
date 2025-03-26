import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { productService } from "./services/product-service";
import { priceService } from "./services/price-service";
import { format } from "date-fns";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize products if empty
  await productService.initializeProducts();

  // API endpoints
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      const productsWithCompetitorPrices = await Promise.all(
        products.map(async (product) => {
          const competitorPrices = await storage.getCompetitorPricesByProductId(product.id);
          const compPrices = competitorPrices.reduce((acc, cp) => {
            acc[cp.competitor] = cp;
            return acc;
          }, {} as Record<string, any>);
          return { ...product, competitorPrices: compPrices };
        })
      );
      res.json(productsWithCompetitorPrices);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "An error occurred fetching products" });
    }
  });

  app.get("/api/categories", async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      const categories = [...new Set(products.map(product => product.category))];
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "An error occurred fetching categories" });
    }
  });

  app.get("/api/stats", async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      const competitiveProducts = products.filter(p => p.status === "Competitive").length;
      const needsAdjustment = products.filter(p => p.status !== "Competitive").length;

      // Format last updated
      const lastUpdated = products.length > 0 
        ? format(new Date(products[0].updatedAt), "h:mm aa")
        : "Never";

      res.json({
        totalProducts: products.length,
        competitiveProducts,
        needsAdjustment,
        lastUpdated
      });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "An error occurred fetching stats" });
    }
  });

  app.get("/api/price-history/:productId/:days", async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const days = parseInt(req.params.days);

      if (isNaN(productId) || isNaN(days)) {
        return res.status(400).json({ message: "Invalid product ID or days parameter" });
      }

      const priceHistory = await priceService.getPriceHistory(productId, days);
      res.json(priceHistory);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "An error occurred fetching price history" });
    }
  });

  app.post("/api/optimize-prices", async (req, res) => {
    try {
      await priceService.optimizeAllPrices();
      res.json({ message: "Prices optimized successfully" });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "An error occurred optimizing prices" });
    }
  });

  app.post("/api/optimize-prices/:productId", async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);

      if (isNaN(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      await priceService.optimizeSinglePrice(productId);
      res.json({ message: "Price optimized successfully" });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "An error occurred optimizing the price" });
    }
  });

  app.get("/api/competitor-data", async (req, res) => {
    try {
      await productService.updateCompetitorPrices();
      const competitorPrices = await storage.getAllCompetitorPrices();
      res.json(competitorPrices);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "An error occurred fetching competitor data" });
    }
  });

  // Create a new product
  app.post("/api/products", async (req, res) => {
    try {
      const { name, sku, category, price } = req.body;

      // Validate required fields
      if (!name || !sku || !category || !price) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Create product with initial status "Pending Analysis"
      const newProduct = await storage.createProduct({
        name,
        sku,
        category,
        price: price.toString(),
      });

      // Add initial competitor prices
      const competitorPrices = [];
      for (const competitor of ["amazon", "walmart", "bestbuy"]) {
        // Generate a competitor price within ±10% of the product price
        const variancePercent = Math.random() * 20 - 10; // Random between -10% and +10%
        const variance = parseFloat(price) * (variancePercent / 100);
        const competitorPrice = Math.max(parseFloat(price) + variance, 0.01).toFixed(2);

        const cp = await storage.createCompetitorPrice({
          productId: newProduct.id,
          competitor,
          price: competitorPrice
        });
        competitorPrices.push(cp);

        // Add to price history
        await storage.createPriceHistory({
          productId: newProduct.id,
          source: competitor,
          price: competitorPrice,
          date: new Date().toISOString()
        });
      }

      // Calculate optimal price
      const avgCompetitorPrice = competitorPrices.reduce((sum, cp) => sum + parseFloat(cp.price), 0) / competitorPrices.length;
      const optimalPrice = Math.max(avgCompetitorPrice * 0.95, parseFloat(price) * 0.9).toFixed(2);

      // Update product with optimal price
      await storage.updateProduct(newProduct.id, {
        optimalPrice,
        status: parseFloat(price) === parseFloat(optimalPrice) ? "Competitive" : "Consider Adjustment"
      });

      // Generate 30 days of initial price history
      await productService.generatePriceHistory(newProduct.id, 30);

      res.status(201).json(newProduct);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "An error occurred creating the product" });
    }
  });

  // Update a product
  app.put("/api/products/:productId", async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const { name, sku, category, price } = req.body;

      if (isNaN(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      // Validate required fields
      if (!name && !sku && !category && !price) {
        return res.status(400).json({ message: "At least one field to update is required" });
      }

      const updates: Partial<any> = {};
      if (name) updates.name = name;
      if (sku) updates.sku = sku;
      if (category) updates.category = category;
      if (price) updates.price = price.toString();
      updates.updatedAt = new Date();

      const updatedProduct = await storage.updateProduct(productId, updates);

      if (!updatedProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json(updatedProduct);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "An error occurred updating the product" });
    }
  });

  // Delete a product
  app.delete("/api/products/:productId", async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);

      if (isNaN(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      const result = await storage.deleteProduct(productId);

      if (!result) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "An error occurred deleting the product" });
    }
  });

  // Manually update price
  app.patch("/api/products/:productId/price", async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const { price } = req.body;

      if (isNaN(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      if (!price || isNaN(parseFloat(price))) {
        return res.status(400).json({ message: "Valid price is required" });
      }

      const updatedProduct = await storage.updateProduct(productId, { 
        price: price.toString(),
        updatedAt: new Date()
      });

      if (!updatedProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Add to price history
      await storage.createPriceHistory({
        productId,
        source: "your",
        price: price.toString(),
        date: new Date()
      });

      res.json(updatedProduct);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "An error occurred updating the price" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}