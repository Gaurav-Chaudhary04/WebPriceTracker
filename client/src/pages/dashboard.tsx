import { useState } from "react";
import Sidebar from "@/components/ui/sidebar";
import MobileHeader from "@/components/mobile-header";
import PageHeader from "@/components/page-header";
import StatsOverview from "@/components/stats-overview";
import FeaturedProduct from "@/components/featured-product";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { ProductWithCompetitorPrices } from "@/types";

export default function Dashboard() {
  // Get top products with competitive issues
  const { data: products } = useQuery<ProductWithCompetitorPrices[]>({
    queryKey: ["/api/products"],
  });

  const productsNeedingAdjustment = products?.filter(p => 
    p.status === "Adjustment Needed" || p.status === "Consider Adjustment"
  ).slice(0, 5);

  const competitivePriceIssues = products?.reduce((acc, product) => {
    if (product.competitorPrices) {
      Object.entries(product.competitorPrices).forEach(([competitor, data]) => {
        const priceDiff = parseFloat(data.price) - parseFloat(product.price);
        if (priceDiff < -10) {
          acc.underpriced.push({
            product: product.name,
            competitor,
            diff: Math.abs(priceDiff).toFixed(2)
          });
        } else if (priceDiff > 10) {
          acc.overpriced.push({
            product: product.name,
            competitor,
            diff: priceDiff.toFixed(2)
          });
        }
      });
    }
    return acc;
  }, { overpriced: [] as any[], underpriced: [] as any[] }) || { overpriced: [], underpriced: [] };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <MobileHeader />
        
        <PageHeader 
          title="Dashboard" 
          description="Analytics and insights for your pricing strategy" 
        />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
          <StatsOverview />
          <FeaturedProduct />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">Products Needing Attention</CardTitle>
              </CardHeader>
              <CardContent>
                {productsNeedingAdjustment && productsNeedingAdjustment.length > 0 ? (
                  <ul className="space-y-3">
                    {productsNeedingAdjustment.map((product, index) => (
                      <li key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div>
                          <span className="font-medium">{product.name}</span>
                          <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            product.status === "Adjustment Needed" 
                              ? "bg-red-100 text-red-800" 
                              : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {product.status}
                          </span>
                        </div>
                        <div className="text-sm">
                          Current: <span className="font-medium">${parseFloat(product.price).toFixed(2)}</span>
                          {product.optimalPrice && (
                            <span className="ml-2">
                              Optimal: <span className="font-medium text-primary">${parseFloat(product.optimalPrice).toFixed(2)}</span>
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    No products need attention right now
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">Competitive Price Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  <div>
                    <h4 className="font-medium text-sm text-gray-500 mb-2">Products Potentially Overpriced</h4>
                    {competitivePriceIssues.overpriced.length > 0 ? (
                      <ul className="space-y-2">
                        {competitivePriceIssues.overpriced.slice(0, 3).map((issue, index) => (
                          <li key={index} className="flex justify-between items-center p-2 bg-red-50 rounded-md text-sm">
                            <span>{issue.product}</span>
                            <span className="text-red-600">${issue.diff} higher than {issue.competitor}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-sm text-gray-500 italic">No overpricing issues detected</div>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm text-gray-500 mb-2">Products Potentially Underpriced</h4>
                    {competitivePriceIssues.underpriced.length > 0 ? (
                      <ul className="space-y-2">
                        {competitivePriceIssues.underpriced.slice(0, 3).map((issue, index) => (
                          <li key={index} className="flex justify-between items-center p-2 bg-green-50 rounded-md text-sm">
                            <span>{issue.product}</span>
                            <span className="text-green-600">${issue.diff} lower than {issue.competitor}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-sm text-gray-500 italic">No underpricing issues detected</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
