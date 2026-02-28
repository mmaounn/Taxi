"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettlementBreakdown } from "./settlement-breakdown";
import { CheckCircle, Download, RefreshCw, DollarSign } from "lucide-react";
import { toast } from "sonner";

interface SettlementData {
  id: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  notes: string | null;
  cashCollectedByDriver: number | null;
  payoutReference: string | null;
  payoutDate: string | null;
  calculatedAt: string | null;
  approvedAt: string | null;
  paidAt: string | null;
  driver: {
    firstName: string;
    lastName: string;
    commissionModel: string;
    commissionRate: number | null;
    fixedFee: number | null;
    email: string | null;
    bankIban: string | null;
  };
  // All the breakdown fields
  [key: string]: unknown;
}

export function SettlementDetail({
  settlement: initial,
  readOnly = false,
}: {
  settlement: SettlementData;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [settlement, setSettlement] = useState(initial);
  const [notes, setNotes] = useState(initial.notes || "");
  const [cashCollected, setCashCollected] = useState(
    initial.cashCollectedByDriver?.toString() || "0"
  );
  const [saving, setSaving] = useState(false);

  const statusColors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-800",
    CALCULATED: "bg-blue-100 text-blue-800",
    APPROVED: "bg-green-100 text-green-800",
    PAID: "bg-emerald-100 text-emerald-800",
    DISPUTED: "bg-red-100 text-red-800",
  };

  async function updateSettlement(data: Record<string, unknown>) {
    setSaving(true);
    const res = await fetch(`/api/settlements/${settlement.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const updated = await res.json();
      setSettlement({ ...settlement, ...updated });
      toast.success("Settlement updated");
      router.refresh();
    } else {
      toast.error("Update failed");
    }
    setSaving(false);
  }

  async function handleRecalculate() {
    setSaving(true);
    const res = await fetch(`/api/settlements/${settlement.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "recalculate" }),
    });

    if (res.ok) {
      toast.success("Settlement recalculated");
      router.refresh();
      // Reload data
      const detailRes = await fetch(`/api/settlements/${settlement.id}`);
      if (detailRes.ok) setSettlement(await detailRes.json());
    } else {
      toast.error("Recalculation failed");
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {settlement.driver.firstName} {settlement.driver.lastName}
          </h1>
          <p className="text-gray-600">
            {new Date(settlement.periodStart).toLocaleDateString("de-AT")} —{" "}
            {new Date(settlement.periodEnd).toLocaleDateString("de-AT")}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="secondary" className={statusColors[settlement.status]}>
              {settlement.status}
            </Badge>
            <span className="text-xs text-gray-400">
              {settlement.driver.commissionModel}
              {settlement.driver.commissionRate
                ? ` (${Number(settlement.driver.commissionRate)}%)`
                : ""}
            </span>
          </div>
        </div>

        {!readOnly && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRecalculate} disabled={saving}>
              <RefreshCw className="mr-1 h-4 w-4" />
              Recalculate
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <a href={`/api/settlements/${settlement.id}/pdf`} download>
                <Download className="mr-1 h-4 w-4" />
                PDF
              </a>
            </Button>
            {settlement.status === "CALCULATED" && (
              <Button
                size="sm"
                onClick={() => updateSettlement({ status: "APPROVED" })}
                disabled={saving}
              >
                <CheckCircle className="mr-1 h-4 w-4" />
                Approve
              </Button>
            )}
            {settlement.status === "APPROVED" && (
              <Button
                size="sm"
                onClick={() => updateSettlement({ status: "PAID" })}
                disabled={saving}
              >
                <DollarSign className="mr-1 h-4 w-4" />
                Mark Paid
              </Button>
            )}
          </div>
        )}

        {readOnly && (
          <Button variant="outline" size="sm" asChild>
            <a href={`/api/settlements/${settlement.id}/pdf`} download>
              <Download className="mr-1 h-4 w-4" />
              PDF
            </a>
          </Button>
        )}
      </div>

      {/* Breakdown */}
      <SettlementBreakdown settlement={settlement as never} />

      {/* Notes & Cash */}
      {!readOnly && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Notes & Cash Reconciliation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Cash Collected by Driver (EUR)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.01"
                  value={cashCollected}
                  onChange={(e) => setCashCollected(e.target.value)}
                  className="w-40"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    updateSettlement({
                      cashCollectedByDriver: parseFloat(cashCollected) || 0,
                    })
                  }
                  disabled={saving}
                >
                  Update Cash
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateSettlement({ notes })}
                disabled={saving}
              >
                Save Notes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
