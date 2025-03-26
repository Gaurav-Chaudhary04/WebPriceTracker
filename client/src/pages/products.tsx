import { useState } from "react";
import Sidebar from "@/components/ui/sidebar";
import MobileHeader from "@/components/mobile-header";
import PageHeader from "@/components/page-header";
import StatsOverview from "@/components/stats-overview";
import FeaturedProduct from "@/components/featured-product";
import ProductsTable from "@/components/products-table";

export default function Products() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <MobileHeader />
        
        <PageHeader 
          title="Products Overview" 
          description="Monitor and optimize your product prices against competitors" 
        />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
          <StatsOverview />
          <FeaturedProduct />
          <ProductsTable />
        </main>
      </div>
    </div>
  );
}
