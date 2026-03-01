"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, Receipt, Banknote } from "lucide-react";
import { formatEur } from "@/lib/format";

interface StatsData {
  totalRevenue: number;
  activeDrivers: number;
  pendingSettlements: number;
  cashOutstanding: number;
}

export function StatsCards({ stats }: { stats: StatsData }) {
  const cards = [
    {
      title: "Total Revenue (This Week)",
      value: formatEur(stats.totalRevenue),
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      title: "Active Drivers",
      value: stats.activeDrivers.toString(),
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Pending Settlements",
      value: stats.pendingSettlements.toString(),
      icon: Receipt,
      color: "text-yellow-600",
    },
    {
      title: "Cash Outstanding",
      value: formatEur(stats.cashOutstanding),
      icon: Banknote,
      color: "text-red-600",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {card.title}
            </CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
