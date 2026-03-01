"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettlementTable } from "@/components/settlements/settlement-table";
import { SepaExportDialog } from "@/components/settlements/sepa-export-dialog";
import { Calculator, CreditCard, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { WeekPicker } from "@/components/ui/week-picker";
import { getWeekBounds } from "@/lib/date-utils";

interface Driver {
  id: string;
  firstName: string;
  lastName: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Settlement = any;

export default function SettlementsPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  // Filters
  const [driverFilter, setDriverFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Calculation form
  const [calcDriverId, setCalcDriverId] = useState("");
  const [calcWeek, setCalcWeek] = useState(() => getWeekBounds(0));

  // Multi-select for SEPA/batch operations
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sepaDialogOpen, setSepaDialogOpen] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/settlements").then((r) => r.json()),
      fetch("/api/drivers").then((r) => r.json()),
    ]).then(([s, d]) => {
      setSettlements(s);
      setDrivers(d);
      setLoading(false);
    });
  }, []);

  async function fetchSettlements() {
    const params = new URLSearchParams();
    if (driverFilter !== "all") params.set("driverId", driverFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);

    const res = await fetch(`/api/settlements?${params}`);
    if (res.ok) {
      setSettlements(await res.json());
      setSelectedIds(new Set());
    }
  }

  useEffect(() => {
    if (!loading) fetchSettlements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverFilter, statusFilter]);

  async function handleCalculate(batch: boolean) {
    if (!batch && !calcDriverId) {
      toast.error("Bitte einen Fahrer auswählen");
      return;
    }
    setCalculating(true);

    const res = await fetch("/api/settlements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        driverId: batch ? "batch" : calcDriverId,
        periodStart: calcWeek.start,
        periodEnd: calcWeek.end,
        batch,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Berechnung fehlgeschlagen");
    } else if (batch) {
      toast.success(`${data.results?.length || 0} Abrechnungen berechnet`);
    } else {
      toast.success("Abrechnung berechnet");
    }

    await fetchSettlements();
    setCalculating(false);
  }

  async function handleMarkPaid() {
    if (selectedIds.size === 0) return;

    // Check all selected are APPROVED
    const selected = settlements.filter((s: Settlement) => selectedIds.has(s.id));
    const nonApproved = selected.filter((s: Settlement) => s.status !== "APPROVED");
    if (nonApproved.length > 0) {
      toast.error(`${nonApproved.length} Abrechnung(en) nicht genehmigt`);
      return;
    }

    setMarkingPaid(true);
    const res = await fetch("/api/settlements/mark-paid", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settlementIds: Array.from(selectedIds) }),
    });

    if (res.ok) {
      const data = await res.json();
      toast.success(`${data.updated} Abrechnung(en) als bezahlt markiert`);
      await fetchSettlements();
    } else {
      const data = await res.json();
      toast.error(data.error || "Als bezahlt markieren fehlgeschlagen");
    }
    setMarkingPaid(false);
  }

  if (loading) return <div className="py-8 text-center">Wird geladen...</div>;

  const selectedCount = selectedIds.size;
  const hasApprovedSelected = settlements.some(
    (s: Settlement) => selectedIds.has(s.id) && s.status === "APPROVED"
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Abrechnungen</h1>

      {/* Calculate Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Abrechnung berechnen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Fahrer</Label>
              <Select value={calcDriverId} onValueChange={setCalcDriverId}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Fahrer auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.firstName} {d.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <WeekPicker value={calcWeek} onChange={setCalcWeek} />
            <Button onClick={() => handleCalculate(false)} disabled={calculating}>
              <Calculator className="mr-2 h-4 w-4" />
              Berechnen
            </Button>
            <Button
              variant="outline"
              onClick={() => handleCalculate(true)}
              disabled={calculating}
            >
              Alle Fahrer berechnen
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={driverFilter} onValueChange={setDriverFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Alle Fahrer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Fahrer</SelectItem>
            {drivers.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.firstName} {d.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Alle Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Status</SelectItem>
            <SelectItem value="DRAFT">Entwurf</SelectItem>
            <SelectItem value="CALCULATED">Berechnet</SelectItem>
            <SelectItem value="APPROVED">Genehmigt</SelectItem>
            <SelectItem value="PAID">Bezahlt</SelectItem>
            <SelectItem value="DISPUTED">Strittig</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Action Bar (visible when items selected) */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg border bg-gray-50 p-3">
          <span className="text-sm font-medium">
            {selectedCount} ausgewählt
          </span>
          <div className="flex gap-2 ml-auto">
            {hasApprovedSelected && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSepaDialogOpen(true)}
                >
                  <CreditCard className="mr-1 h-4 w-4" />
                  SEPA-Datei erstellen
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkPaid}
                  disabled={markingPaid}
                >
                  <CheckCircle className="mr-1 h-4 w-4" />
                  Als bezahlt markieren
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
            >
              Auswahl aufheben
            </Button>
          </div>
        </div>
      )}

      <SettlementTable
        settlements={settlements}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />

      {/* SEPA Export Dialog */}
      <SepaExportDialog
        open={sepaDialogOpen}
        onOpenChange={setSepaDialogOpen}
        settlementIds={Array.from(selectedIds)}
        onExported={fetchSettlements}
      />
    </div>
  );
}
