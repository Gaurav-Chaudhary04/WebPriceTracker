import { storage } from "../storage";
import { format, subDays, parseISO } from "date-fns";
import { PriceHistory } from "@shared/schema";

export class PriceService {
  async getPriceHistory(productId: number, days: number) {
    const history = await storage.getPriceHistoryByProductId(productId, days);
    const labels: string[] = [];
    const datasets: Record<string, string[]> = {};

    // Group by date and source
    history.forEach(entry => {
      const dateStr = format(new Date(entry.date), 'MMM d');
      if (!labels.includes(dateStr)) {
        labels.push(dateStr);
      }

      if (!datasets[entry.source]) {
        datasets[entry.source] = new Array(labels.length).fill('0');
      }

      const dateIndex = labels.indexOf(dateStr);
      datasets[entry.source][dateIndex] = entry.price;
    });

    return { labels, datasets };
  }

  async optimizeAllPrices() {
    const products = await storage.getAllProducts();
    for (const product of products) {
      await this.optimizeSinglePrice(product.id);
    }
  }

  async optimizeSinglePrice(productId: number) {
    const product = await storage.getProduct(productId);
    if (!product) return;

    const competitorPrices = await storage.getCompetitorPricesByProductId(productId);
    if (competitorPrices.length === 0) return;

    const avgPrice = competitorPrices.reduce((sum, cp) => sum + parseFloat(cp.price), 0) / competitorPrices.length;
    const optimalPrice = (avgPrice * 0.95).toFixed(2);

    await storage.updateProduct(productId, { 
      optimalPrice,
      status: Math.abs(parseFloat(product.price) - parseFloat(optimalPrice)) < 0.01 ? "Competitive" : "Consider Adjustment"
    });
  }
}

export const priceService = new PriceService();