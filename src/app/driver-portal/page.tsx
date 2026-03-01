"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BalanceWidget } from "@/components/driver-portal/balance-widget";
import { IncomeChart } from "@/components/driver-portal/income-chart";
import { Car, Receipt, Banknote, TrendingUp } from "lucide-react";
import { formatEur } from "@/lib/format";

interface PortalDashboardData {
  balance: number;
  stats: {
    totalRides: number;
    avgFare: number;
    cashCollected: number;
    tips: number;
  };
  weeklyIncome: { week: string; bolt: number; uber: number; freenow: number }[];
  latestSettlement: {
    id: string;
    periodStart: string;
    periodEnd: string;
    payoutAmount: number;
    status: string;
  } | null;
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  CALCULATED: "bg-blue-100 text-blue-800",
  APPROVED: "bg-green-100 text-green-800",
  PAID: "bg-emerald-100 text-emerald-800",
  DISPUTED: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  DRAFT: "Entwurf",
  CALCULATED: "Berechnet",
  APPROVED: "Genehmigt",
  PAID: "Bezahlt",
  DISPUTED: "Strittig",
};

export default function DriverPortalPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<PortalDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/driver-portal/dashboard")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-8 text-center">Wird geladen...</div>;
  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Willkommen</h1>
        <p className="text-gray-600">Noch keine Daten vorhanden.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        Willkommen{session?.user?.name ? `, ${session.user.name}` : ""}
      </h1>

      {/* Balance + Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-1">
          <BalanceWidget balance={data.balance} />
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Fahrten gesamt
            </CardTitle>
            <Car className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalRides}</div>
            <p className="text-xs text-muted-foreground">Letzte 8 Wochen</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Ø Fahrpreis
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatEur(data.stats.avgFare)}</div>
            <p className="text-xs text-muted-foreground">Pro Fahrt</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Trinkgeld
            </CardTitle>
            <Banknote className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatEur(data.stats.tips)}</div>
            <p className="text-xs text-muted-foreground">Letzte 8 Wochen</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Eingenommenes Bargeld
            </CardTitle>
            <Receipt className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatEur(data.stats.cashCollected)}
            </div>
            <p className="text-xs text-muted-foreground">Letzte 8 Wochen</p>
          </CardContent>
        </Card>
      </div>

      {/* Income Chart */}
      <IncomeChart data={data.weeklyIncome} />

      {/* Latest Settlement */}
      {data.latestSettlement && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Letzte Abrechnung</CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href={`/driver-portal/settlements/${data.latestSettlement.id}`}
              className="flex items-center justify-between rounded-md border p-4 transition-colors hover:bg-gray-50"
            >
              <div>
                <p className="font-medium">
                  {new Date(data.latestSettlement.periodStart).toLocaleDateString("de-AT")}{" "}
                  — {new Date(data.latestSettlement.periodEnd).toLocaleDateString("de-AT")}
                </p>
                <Badge
                  variant="secondary"
                  className={statusColors[data.latestSettlement.status]}
                >
                  {statusLabels[data.latestSettlement.status] || data.latestSettlement.status}
                </Badge>
              </div>
              <span
                className={`text-lg font-bold ${
                  data.latestSettlement.payoutAmount >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {formatEur(data.latestSettlement.payoutAmount)}
              </span>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
