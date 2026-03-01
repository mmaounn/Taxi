"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FleetSummaryTable } from "@/components/reports/fleet-summary-table";
import { Download, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

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

function getWeekBounds(offset: number) {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset + offset * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    start: monday.toISOString().split("T")[0],
    end: sunday.toISOString().split("T")[0],
  };
}

function getMonthBounds() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}

export default function ReportsPage() {
  const thisWeek = getWeekBounds(0);
  const [periodStart, setPeriodStart] = useState(thisWeek.start);
  const [periodEnd, setPeriodEnd] = useState(thisWeek.end);
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchReport() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/reports/fleet-summary?periodStart=${periodStart}&periodEnd=${periodEnd}`
      );
      if (res.ok) {
        setData(await res.json());
      } else {
        toast.error("Failed to load report");
      }
    } catch {
      toast.error("Failed to load report");
    }
    setLoading(false);
  }

  function applyPreset(preset: string) {
    let bounds;
    switch (preset) {
      case "this-week":
        bounds = getWeekBounds(0);
        break;
      case "last-week":
        bounds = getWeekBounds(-1);
        break;
      case "this-month":
        bounds = getMonthBounds();
        break;
      default:
        return;
    }
    setPeriodStart(bounds.start);
    setPeriodEnd(bounds.end);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reports</h1>

      {/* Period Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Fleet Summary Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyPreset("this-week")}
              >
                This Week
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyPreset("last-week")}
              >
                Last Week
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyPreset("this-month")}
              >
                This Month
              </Button>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">From</Label>
              <Input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">To</Label>
              <Input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="w-40"
              />
            </div>
            <Button onClick={fetchReport} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export Buttons + Table */}
      {data && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {data.driverCount} driver{data.driverCount !== 1 ? "s" : ""},{" "}
              {data.rows.length} settlement{data.rows.length !== 1 ? "s" : ""}
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
    </div>
  );
}
