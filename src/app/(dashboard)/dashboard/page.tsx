"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface DashboardData {
  stats: {
    totalRevenue: number;
    activeDrivers: number;
    pendingSettlements: number;
    cashOutstanding: number;
  };
  weeklyRevenue: { week: string; bolt: number; uber: number; freenow: number }[];
  recentSettlements: {
    id: string;
    status: string;
    periodStart: string;
    periodEnd: string;
    payoutAmount: number | null;
    driver: { firstName: string; lastName: string };
  }[];
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  CALCULATED: "bg-blue-100 text-blue-800",
  APPROVED: "bg-green-100 text-green-800",
  PAID: "bg-emerald-100 text-emerald-800",
  DISPUTED: "bg-red-100 text-red-800",
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-8 text-center">Loading...</div>;
  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-600">Welcome to Fleet Settlement. Set up your database to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <StatsCards stats={data.stats} />

      <RevenueChart data={data.weeklyRevenue} />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Recent Settlements</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/settlements">
                View All <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {data.recentSettlements.length === 0 ? (
              <p className="text-sm text-gray-500">No settlements yet</p>
            ) : (
              <div className="space-y-3">
                {data.recentSettlements.map((s) => (
                  <Link
                    key={s.id}
                    href={`/settlements/${s.id}`}
                    className="flex items-center justify-between rounded-md border p-3 transition-colors hover:bg-gray-50"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {s.driver.firstName} {s.driver.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(s.periodStart).toLocaleDateString("de-AT")} —{" "}
                        {new Date(s.periodEnd).toLocaleDateString("de-AT")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={statusColors[s.status]}>
                        {s.status}
                      </Badge>
                      {s.payoutAmount != null && (
                        <span
                          className={`text-sm font-medium ${
                            Number(s.payoutAmount) >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          €{Number(s.payoutAmount).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/settlements">
                <ArrowRight className="mr-2 h-4 w-4" />
                Calculate Weekly Settlements
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/platform-sync">
                <ArrowRight className="mr-2 h-4 w-4" />
                Sync Platform Data
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/drivers/new">
                <ArrowRight className="mr-2 h-4 w-4" />
                Add New Driver
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/vehicles/new">
                <ArrowRight className="mr-2 h-4 w-4" />
                Add New Vehicle
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
