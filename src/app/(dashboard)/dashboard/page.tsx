"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { ExpiryAlerts } from "@/components/dashboard/expiry-alerts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatEur } from "@/lib/format";

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

const statusLabels: Record<string, string> = {
  DRAFT: "Entwurf",
  CALCULATED: "Berechnet",
  APPROVED: "Genehmigt",
  PAID: "Bezahlt",
  DISPUTED: "Strittig",
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const loadDashboard = useCallback(() => {
    return fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => setData(d));
  }, []);

  useEffect(() => {
    loadDashboard()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [loadDashboard]);

  // Auto-sync all configured platforms in background on mount
  useEffect(() => {
    let cancelled = false;

    async function autoSync() {
      try {
        setSyncing(true);
        const syncRes = await fetch("/api/platform-sync/auto-sync", { method: "POST" });
        const result = await syncRes.json();

        if (cancelled) return;

        if (syncRes.ok && result.platforms?.length > 0) {
          for (const p of result.platforms) {
            const parts = [];
            if (p.driversImported) parts.push(`${p.driversImported} Fahrer`);
            if (p.vehiclesImported) parts.push(`${p.vehiclesImported} Fahrzeuge`);
            if (p.ridesImported) parts.push(`${p.ridesImported} Fahrten`);

            if (parts.length > 0) {
              toast.success(`${p.platform}-Sync: ${parts.join(", ")}`);
            }

            if (p.errors?.length > 0) {
              toast.error(`${p.platform}: ${p.errors.length} Fehler`);
            }
          }

          const totalImported = result.platforms.reduce(
            (sum: number, p: { driversImported?: number; vehiclesImported?: number; ridesImported?: number }) =>
              sum + (p.driversImported || 0) + (p.vehiclesImported || 0) + (p.ridesImported || 0),
            0
          );

          if (totalImported === 0) {
            toast.info("Plattform-Sync: bereits aktuell");
          }

          // Refresh dashboard data after sync
          await loadDashboard().catch(() => {});
        }
      } catch {
        // Silent fail — auto-sync is best-effort
      } finally {
        if (!cancelled) setSyncing(false);
      }
    }

    autoSync();
    return () => { cancelled = true; };
  }, [loadDashboard]);

  if (loading) return <div className="py-8 text-center">Wird geladen...</div>;
  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-600">Willkommen bei der Flottenabrechnung. Richten Sie Ihre Datenbank ein, um zu beginnen.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        {syncing && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Plattformen werden synchronisiert...
          </div>
        )}
      </div>

      <ExpiryAlerts />

      <StatsCards stats={data.stats} />

      <RevenueChart data={data.weeklyRevenue} />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Aktuelle Abrechnungen</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/settlements">
                Alle anzeigen <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {data.recentSettlements.length === 0 ? (
              <p className="text-sm text-gray-500">Noch keine Abrechnungen</p>
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
                        {statusLabels[s.status] || s.status}
                      </Badge>
                      {s.payoutAmount != null && (
                        <span
                          className={`text-sm font-medium ${
                            Number(s.payoutAmount) >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {formatEur(Number(s.payoutAmount))}
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
            <CardTitle className="text-sm">Schnellaktionen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/settlements">
                <ArrowRight className="mr-2 h-4 w-4" />
                Wöchentliche Abrechnungen berechnen
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/platform-sync">
                <ArrowRight className="mr-2 h-4 w-4" />
                Plattformdaten synchronisieren
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/drivers/new">
                <ArrowRight className="mr-2 h-4 w-4" />
                Neuen Fahrer hinzufügen
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/vehicles/new">
                <ArrowRight className="mr-2 h-4 w-4" />
                Neues Fahrzeug hinzufügen
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
