"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FleetSummaryTable } from "@/components/reports/fleet-summary-table";
import {
  Download,
  FileText,
  Loader2,
  RefreshCw,
  Info,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { DatePicker } from "@/components/ui/date-picker";
import { getWeekBounds, getMonthBounds } from "@/lib/date-utils";

interface SummaryRow {
  settlementId: string;
  driverName: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  totalPlatformNet: number;
  partnerCommission: number;
  vehicleRental: number;
  lineItemsTotal: number;
  driverNetEarnings: number;
  cashCollected: number;
  payoutAmount: number;
}

interface SummaryData {
  rows: SummaryRow[];
  totals: {
    totalPlatformNet: number;
    partnerCommission: number;
    vehicleRental: number;
    lineItemsTotal: number;
    driverNetEarnings: number;
    cashCollected: number;
    payoutAmount: number;
  };
  driverCount: number;
}

function getDaysBetween(start: string, end: string): number {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

type PresetKey =
  | "this-week"
  | "last-week"
  | "this-month"
  | "last-month"
  | null;

function getPresetForDates(start: string, end: string): PresetKey {
  const tw = getWeekBounds(0);
  if (start === tw.start && end === tw.end) return "this-week";
  const lw = getWeekBounds(-1);
  if (start === lw.start && end === lw.end) return "last-week";
  const tm = getMonthBounds(0);
  if (start === tm.start && end === tm.end) return "this-month";
  const lm = getMonthBounds(-1);
  if (start === lm.start && end === lm.end) return "last-month";
  return null;
}

export default function ReportsPage() {
  const lastMonth = getMonthBounds(-1);
  const [periodStart, setPeriodStart] = useState(lastMonth.start);
  const [periodEnd, setPeriodEnd] = useState(lastMonth.end);
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const days = getDaysBetween(periodStart, periodEnd);
  const activePreset = getPresetForDates(periodStart, periodEnd);

  async function syncAndGenerate() {
    setSyncing(true);
    setSyncStatus("Fahrten von Bolt werden synchronisiert...");
    try {
      // Step 1: Sync rides from Bolt for the selected period
      const syncRes = await fetch("/api/platform-sync/bolt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateFrom: new Date(periodStart).toISOString(),
          dateTo: new Date(periodEnd + "T23:59:59").toISOString(),
        }),
      });

      if (!syncRes.ok) {
        const err = await syncRes.json();
        throw new Error(err.error || "Sync failed");
      }

      const syncData = await syncRes.json();
      const ridesImported = syncData.imported || 0;

      // Step 2: Batch-calculate settlements
      setSyncStatus("Abrechnungen werden berechnet...");
      const settleRes = await fetch("/api/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periodStart,
          periodEnd,
          batch: true,
        }),
      });

      if (!settleRes.ok) {
        const err = await settleRes.json();
        throw new Error(err.error || "Settlement calculation failed");
      }

      const settleData = await settleRes.json();
      const settlementsCreated = settleData.results?.length || 0;

      toast.success(
        `${ridesImported} Fahrten synchronisiert, ${settlementsCreated} Abrechnungen berechnet`
      );
    } catch (e) {
      toast.error(String(e instanceof Error ? e.message : e));
    } finally {
      setSyncing(false);
      setSyncStatus(null);
    }

    // Step 3: Fetch the report
    await fetchReport();
  }

  async function fetchReport() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/reports/fleet-summary?periodStart=${periodStart}&periodEnd=${periodEnd}`
      );
      if (res.ok) {
        setData(await res.json());
      } else {
        toast.error("Bericht konnte nicht geladen werden");
      }
    } catch {
      toast.error("Bericht konnte nicht geladen werden");
    }
    setLoading(false);
  }

  function applyPreset(preset: PresetKey) {
    let bounds;
    switch (preset) {
      case "this-week":
        bounds = getWeekBounds(0);
        break;
      case "last-week":
        bounds = getWeekBounds(-1);
        break;
      case "this-month":
        bounds = getMonthBounds(0);
        break;
      case "last-month":
        bounds = getMonthBounds(-1);
        break;
      default:
        return;
    }
    setPeriodStart(bounds.start);
    setPeriodEnd(bounds.end);
    setData(null);
  }

  const isWorking = loading || syncing;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Berichte</h1>

      {/* Period Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Flottenzusammenfassung</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            {/* Presets */}
            <div className="grid grid-cols-2 gap-2 sm:flex">
              {(
                [
                  ["this-week", "Diese Woche"],
                  ["last-week", "Letzte Woche"],
                  ["this-month", "Diesen Monat"],
                  ["last-month", "Letzten Monat"],
                ] as const
              ).map(([key, label]) => (
                <Button
                  key={key}
                  variant={activePreset === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => applyPreset(key)}
                >
                  {label}
                </Button>
              ))}
            </div>

            {/* Date Inputs */}
            <div className="grid grid-cols-2 gap-3 sm:flex sm:items-end sm:gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Von</Label>
                <DatePicker
                  value={periodStart}
                  onChange={(v) => {
                    setPeriodStart(v);
                    setData(null);
                  }}
                  className="w-full sm:w-40"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Bis</Label>
                <DatePicker
                  value={periodEnd}
                  onChange={(v) => {
                    setPeriodEnd(v);
                    setData(null);
                  }}
                  className="w-full sm:w-40"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={fetchReport} disabled={isWorking} variant="outline" className="w-full sm:w-auto">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Bericht erstellen
              </Button>
              <Button onClick={syncAndGenerate} disabled={isWorking} className="w-full sm:w-auto">
                {syncing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                {syncing ? syncStatus : "Sync & Erstellen"}
              </Button>
            </div>
          </div>

          {/* Range info */}
          {days > 31 && (
            <div className="flex items-center gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>
                Gewählter Zeitraum umfasst {days} Tage. Die Bolt API ist auf 31 Tage pro Anfrage begrenzt — der Sync wird automatisch in{" "}
                {Math.ceil(days / 31)} Abschnitte aufgeteilt.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {data && (
        <>
          {data.rows.length === 0 ? (
            <Card>
              <CardContent className="flex items-center gap-3 py-8 text-gray-500">
                <Info className="h-5 w-5 shrink-0" />
                <div>
                  <p className="font-medium">Keine Abrechnungen für diesen Zeitraum gefunden.</p>
                  <p className="text-sm mt-1">
                    Klicke auf <strong>Sync &amp; Erstellen</strong>, um Fahrten von Bolt abzurufen und Abrechnungen zu berechnen.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-600">
                  {data.driverCount} Fahrer,{" "}
                  {data.rows.length} Abrechnung{data.rows.length !== 1 ? "en" : ""}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={`/api/reports/fleet-summary/csv?periodStart=${periodStart}&periodEnd=${periodEnd}`}
                      download
                    >
                      <Download className="mr-1 h-4 w-4" />
                      CSV
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={`/api/reports/fleet-summary/pdf?periodStart=${periodStart}&periodEnd=${periodEnd}`}
                      download
                    >
                      <FileText className="mr-1 h-4 w-4" />
                      PDF
                    </a>
                  </Button>
                </div>
              </div>

              <FleetSummaryTable rows={data.rows} totals={data.totals} />
            </>
          )}
        </>
      )}
    </div>
  );
}
