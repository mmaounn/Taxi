"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Receipt, TrendingUp } from "lucide-react";

interface DriverDashboardData {
  currentPeriodEarnings: number;
  lastSettlement: {
    id: string;
    status: string;
    periodStart: string;
    periodEnd: string;
    payoutAmount: number | null;
    driverNetEarnings: number | null;
  } | null;
  totalSettlements: number;
}

function formatEur(val: number | null): string {
  if (val == null) return "€0.00";
  return `€${Number(val).toFixed(2)}`;
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  CALCULATED: "bg-blue-100 text-blue-800",
  APPROVED: "bg-green-100 text-green-800",
  PAID: "bg-emerald-100 text-emerald-800",
  DISPUTED: "bg-red-100 text-red-800",
};

export default function DriverPortalPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DriverDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch driver's own settlements
    fetch("/api/settlements?limit=1")
      .then((r) => r.json())
      .then((settlements) => {
        const lastSettlement = settlements[0] || null;
        setData({
          currentPeriodEarnings: lastSettlement
            ? Number(lastSettlement.driverNetEarnings || 0)
            : 0,
          lastSettlement,
          totalSettlements: settlements.length,
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-8 text-center">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        Welcome{session?.user?.name ? `, ${session.user.name}` : ""}
      </h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Current Period Earnings
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatEur(data?.currentPeriodEarnings ?? 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Last Settlement
            </CardTitle>
            <Receipt className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            {data?.lastSettlement ? (
              <div>
                <div className="text-2xl font-bold">
                  {formatEur(data.lastSettlement.payoutAmount)}
                </div>
                <Badge
                  variant="secondary"
                  className={statusColors[data.lastSettlement.status]}
                >
                  {data.lastSettlement.status}
                </Badge>
              </div>
            ) : (
              <p className="text-gray-500">No settlements yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Settlements
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalSettlements ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      {data?.lastSettlement && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Latest Settlement</CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href={`/driver-portal/settlements/${data.lastSettlement.id}`}
              className="flex items-center justify-between rounded-md border p-4 transition-colors hover:bg-gray-50"
            >
              <div>
                <p className="font-medium">
                  {new Date(data.lastSettlement.periodStart).toLocaleDateString("de-AT")}{" "}
                  — {new Date(data.lastSettlement.periodEnd).toLocaleDateString("de-AT")}
                </p>
                <Badge
                  variant="secondary"
                  className={statusColors[data.lastSettlement.status]}
                >
                  {data.lastSettlement.status}
                </Badge>
              </div>
              <span className="text-lg font-bold text-green-600">
                {formatEur(data.lastSettlement.payoutAmount)}
              </span>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
