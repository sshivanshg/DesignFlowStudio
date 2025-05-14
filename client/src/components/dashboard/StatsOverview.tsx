import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building, DollarSign, FileText, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Stat {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  change: {
    value: number;
    isPositive: boolean;
  };
  period: string;
}

export default function StatsOverview() {
  // Fetch real dashboard stats from our API
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }
      return response.json();
    }
  });

  const statCards: Stat[] = [
    {
      title: "Active Projects",
      value: stats?.activeProjects || 0,
      icon: <Building className="h-6 w-6" />,
      iconBg: "bg-blue-100",
      iconColor: "text-primary",
      change: {
        value: 4,
        isPositive: true,
      },
      period: "from last month",
    },
    {
      title: "Monthly Revenue",
      value: stats?.revenue || '₹0',
      icon: <DollarSign className="h-6 w-6" />,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      change: {
        value: 12.5,
        isPositive: true,
      },
      period: "from last month",
    },
    {
      title: "Pending Proposals",
      value: stats?.pendingProposals || 0,
      icon: <FileText className="h-6 w-6" />,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      change: {
        value: 2,
        isPositive: false,
      },
      period: "from last month",
    },
    {
      title: "Client Interactions",
      value: stats?.interactions || 0,
      icon: <MessageSquare className="h-6 w-6" />,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      change: {
        value: 8.3,
        isPositive: true,
      },
      period: "from last week",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {isLoading ? (
        // Skeleton loading state
        Array(4)
          .fill(0)
          .map((_, index) => (
            <Card key={index} className="border border-gray-200">
              <CardContent className="p-5">
                <div className="animate-pulse flex items-center">
                  <div className="rounded-full bg-gray-200 h-12 w-12"></div>
                  <div className="ml-4 space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="mt-4 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))
      ) : (
        statCards.map((stat, index) => (
          <Card key={index} className="border border-gray-200">
            <CardContent className="p-5">
              <div className="flex items-center">
                <div
                  className={`flex-shrink-0 rounded-full p-3 ${stat.iconBg}`}
                >
                  <span className={stat.iconColor}>{stat.icon}</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    {stat.title}
                  </p>
                  <h2 className="text-2xl font-semibold text-gray-800">
                    {stat.value}
                  </h2>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm">
                  <span
                    className={`${
                      stat.change.isPositive
                        ? "text-green-500"
                        : "text-red-500"
                    } font-medium flex items-center`}
                  >
                    {stat.change.isPositive ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    {stat.change.value}%
                  </span>
                  <span className="text-gray-500 ml-2">{stat.period}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
