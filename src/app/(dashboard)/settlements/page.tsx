"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SettlementTable } from "@/components/settlements/settlement-table";
import { SepaExportDialog } from "@/components/settlements/sepa-export-dialog";
import { CreditCard, CheckCircle } from "lucide-react";
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

  // Filters
  const [driverFilter, setDriverFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [week, setWeek] = useState(() => getWeekBounds(0));

  // Multi-select for SEPA/batch operations
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sepaDialogOpen, setSepaDialogOpen] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);

  useEffect(() => {
    fetch("/api/drivers")
      .then((r) => r.json())
      .then((d) => setDrivers(d))
      .catch(() => {});
  }, []);

  const fetchSettlements = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (driverFilter !== "all") params.set("driverId", driverFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);
    params.set("from", week.start);
    params.set("to", week.end);

    const res = await fetch(`/api/settlements?${params}`);
    if (res.ok) {
      setSettlements(await res.json());
      setSelectedIds(new Set());
    }
    setLoading(false);
  }, [driverFilter, statusFilter, week]);

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
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
        <WeekPicker value={week} onChange={setWeek} />
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
