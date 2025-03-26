import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

interface PageHeaderProps {
  title: string;
  description: string;
}

export default function PageHeader({ title, description }: PageHeaderProps) {
  const { toast } = useToast();
  const [isOptimizing, setIsOptimizing] = useState(false);

  const handleOptimize = async () => {
    setIsOptimizing(true);
    try {
      await apiRequest("POST", "/api/optimize-prices", {});
      
      toast({
        title: "Price Optimization Complete",
        description: "Products have been updated with optimal pricing.",
        variant: "default",
      });
      
      // Invalidate queries to refresh the product data
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    } catch (error) {
      toast({
        title: "Optimization Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="bg-white shadow-sm z-10">
      <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        <Button 
          onClick={handleOptimize} 
          disabled={isOptimizing}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {isOptimizing ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2"></i>
              Optimizing...
            </>
          ) : (
            <>
              <i className="fas fa-magic mr-2"></i>
              Optimize All Prices
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
