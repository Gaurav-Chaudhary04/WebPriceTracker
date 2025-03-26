import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { Product, PriceHistory } from "@/types";
import { Chart, registerables } from 'chart.js';
import { Skeleton } from "@/components/ui/skeleton";

// Register Chart.js components
Chart.register(...registerables);

export default function FeaturedProduct() {
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [timeRange, setTimeRange] = useState<string>("7");

function getChartColor(index: number): string {
  const colors = [
    'var(--chart-1)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)'
  ];
  return colors[index % colors.length];
}


  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);

  // Fetch products for dropdown
  const { data: products, isLoading: isProductsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Fetch price history for selected product
  const { data: priceHistory, isLoading: isHistoryLoading } = useQuery<PriceHistory>({
    queryKey: [`/api/price-history/${selectedProduct}/${timeRange}`],
    enabled: !!selectedProduct,
  });

  // Initialize product selection when data is loaded
  useEffect(() => {
    if (products && products.length > 0 && !selectedProduct) {
      setSelectedProduct(String(products[0].id));
    }
  }, [products, selectedProduct]);

  // Create or update chart when data changes
  useEffect(() => {
    if (!chartRef.current || !priceHistory) return;

    const canvas = chartRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Always destroy previous instance
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const selectedProductData = products?.find(p => p.id === Number(selectedProduct));

    // Create new chart after cleanup
    const newChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: priceHistory.labels,
        datasets: Object.entries(priceHistory.datasets).map(([source, prices]) => {
          const colors = {
            'our': 'rgb(79, 70, 229)', // Indigo for our price
            'walmart': 'rgb(245, 158, 11)', // Orange for Walmart
            'amazon': 'rgb(16, 185, 129)', // Green for Amazon
            'bestbuy': 'rgb(96, 165, 250)', // Blue for Best Buy
          };
          return {
            label: source.charAt(0).toUpperCase() + source.slice(1),
            data: prices,
            borderColor: colors[source as keyof typeof colors] || `rgb(${getChartColor(0)})`,
            tension: 0.1,
            fill: false
          };
        })
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: false,
            ticks: {
              callback: (value) => `$${value}`
            }
          }
        },
        plugins: {
          legend: {
            position: 'top'
          }
        }
      }
    });

    chartInstance.current = newChart;

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [selectedProduct, timeRange, priceHistory, products]);

  return (
    <Card className="bg-white overflow-hidden shadow rounded-lg mb-6">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">Featured Product Analysis</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Price trend against competitors</p>
        </div>
        <div className="flex space-x-3">
          {isProductsLoading ? (
            <>
              <Skeleton className="h-9 w-40" />
              <Skeleton className="h-9 w-32" />
            </>
          ) : (
            <>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products?.map((product) => (
                    <SelectItem key={product.id} value={String(product.id)}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 Days</SelectItem>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                  <SelectItem value="90">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}
        </div>
      </div>
      <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
        <div className="p-4 h-80 relative">
          {isHistoryLoading || !priceHistory ? (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500">
              <span>Loading chart data...</span>
            </div>
          ) : (
            <canvas ref={chartRef} />
          )}
        </div>
      </div>
    </Card>
  );
}