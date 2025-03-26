import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

export default function MobileHeader() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: "Products", path: "/", icon: "fas fa-home" },
    { label: "Dashboard", path: "/dashboard", icon: "fas fa-chart-line" },
    { label: "Settings", path: "/settings", icon: "fas fa-cog" },
    { label: "Reports", path: "/reports", icon: "fas fa-file-alt" },
  ];

  const dataSources = [
    { name: "Amazon", status: "Connected", color: "bg-green-400" },
    { name: "Walmart", status: "Connected", color: "bg-green-400" },
    { name: "Best Buy", status: "Limited", color: "bg-yellow-400" },
  ];

  return (
    <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 flex items-center justify-between border-b border-gray-200 bg-white">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" className="p-2 rounded-md text-gray-500 hover:text-gray-600 focus:outline-none">
            <i className="fas fa-bars"></i>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex flex-col h-full bg-white">
            <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
              <h1 className="text-xl font-bold text-primary">PriceOptimizer</h1>
            </div>
            <div className="flex flex-col flex-grow px-4 py-4">
              <nav className="flex-1 space-y-2">
                {navItems.map((item) => (
                  <div key={item.path}>
                    <Link href={item.path}>
                      <div
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer",
                          location === item.path
                            ? "bg-gray-100 text-primary"
                            : "text-gray-600 hover:bg-gray-50 hover:text-primary"
                        )}
                      >
                        <i
                          className={cn(
                            item.icon,
                            "mr-3",
                            location === item.path ? "text-primary" : "text-gray-400"
                          )}
                        ></i>
                        {item.label}
                      </div>
                    </Link>
                  </div>
                ))}
              </nav>
              <div className="pt-4 mt-6 border-t border-gray-200">
                <div className="px-3 py-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Data Sources
                  </h3>
                  <ul className="mt-2 space-y-1">
                    {dataSources.map((source) => (
                      <li key={source.name} className="flex items-center text-sm text-gray-600">
                        <span className={`h-2 w-2 ${source.color} rounded-full mr-2`}></span>
                        {source.name}: {source.status}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      <div className="px-4">
        <h1 className="text-lg font-bold text-primary">PriceOptimizer</h1>
      </div>
      <button className="p-2 rounded-md text-gray-500 hover:text-gray-600 focus:outline-none">
        <i className="fas fa-user-circle text-xl"></i>
      </button>
    </div>
  );
}
