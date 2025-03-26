export interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  price: string;
  optimalPrice: string | null;
  status: string;
  updatedAt: string;
}

export interface CompetitorPrice {
  id: number;
  productId: number;
  competitor: string;
  price: string;
  timestamp: string;
}

export interface ProductWithCompetitorPrices extends Product {
  competitorPrices: {
    [competitor: string]: CompetitorPrice;
  };
}

export interface PriceHistoryEntry {
  id: number;
  productId: number;
  source: string;
  price: string;
  date: string;
}

export interface PriceHistory {
  labels: string[];
  datasets: {
    [source: string]: string[];
  }
}

export interface StatsOverview {
  totalProducts: number;
  competitiveProducts: number;
  needsAdjustment: number;
  lastUpdated: string;
}
