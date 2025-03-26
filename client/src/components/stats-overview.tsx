import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { StatsOverview as StatsOverviewType } from "@/types";

export default function StatsOverview() {
  const { data: stats, isLoading } = useQuery<StatsOverviewType>({
    queryKey: ["/api/stats"],
  });

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, index) => (
          <Card key={index} className="bg-white overflow-hidden shadow rounded-lg">
            <CardContent className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-gray-100 rounded-md p-3">
                  <div className="h-5 w-5 animate-pulse bg-gray-200 rounded"></div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <div className="h-4 w-24 animate-pulse bg-gray-200 rounded"></div>
                  <div className="h-8 w-16 mt-2 animate-pulse bg-gray-200 rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Products",
      value: stats.totalProducts,
      icon: "fas fa-tag",
      iconBg: "bg-indigo-100",
      iconColor: "text-primary",
    },
    {
      title: "Competitively Priced",
      value: stats.competitiveProducts,
      percentage: Math.round((stats.competitiveProducts / stats.totalProducts) * 100),
      icon: "fas fa-arrow-up",
      iconBg: "bg-green-100",
      iconColor: "text-secondary",
      percentageColor: "text-green-600",
    },
    {
      title: "Needs Adjustment",
      value: stats.needsAdjustment,
      percentage: Math.round((stats.needsAdjustment / stats.totalProducts) * 100),
      icon: "fas fa-arrow-down",
      iconBg: "bg-red-100",
      iconColor: "text-danger",
      percentageColor: "text-red-600",
    },
    {
      title: "Last Updated",
      value: stats.lastUpdated,
      icon: "fas fa-sync",
      iconBg: "bg-amber-100",
      iconColor: "text-accent",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statCards.map((card, index) => (
        <Card key={index} className="bg-white overflow-hidden shadow rounded-lg">
          <CardContent className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className={`flex-shrink-0 ${card.iconBg} rounded-md p-3`}>
                <i className={`${card.icon} ${card.iconColor}`}></i>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">{card.title}</dt>
                  <dd className="flex items-baseline">
                    <div className={card.title === "Last Updated" ? "text-lg font-semibold text-gray-900" : "text-2xl font-semibold text-gray-900"}>
                      {card.value}
                    </div>
                    {card.percentage !== undefined && (
                      <span className={`ml-2 text-sm font-medium ${card.percentageColor}`}>
                        {card.percentage}%
                      </span>
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
