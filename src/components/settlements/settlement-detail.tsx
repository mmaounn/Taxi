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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, Download, RefreshCw, Euro, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatEur, parseDecimalInput } from "@/lib/format";
import { CurrencyInput } from "@/components/ui/currency-input";

interface LineItemData {
  id: string;
  type: string;
  description: string;
  amount: number;
  isAutoApplied: boolean;
}

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
  lineItems?: LineItemData[];
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
  const [lineItemDialogOpen, setLineItemDialogOpen] = useState(false);
  const [newLineItemType, setNewLineItemType] = useState<string>("BONUS");
  const [newLineItemDesc, setNewLineItemDesc] = useState("");
  const [newLineItemAmount, setNewLineItemAmount] = useState("");

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
      toast.success("Abrechnung aktualisiert");
      router.refresh();
    } else {
      toast.error("Aktualisierung fehlgeschlagen");
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
      toast.success("Abrechnung neu berechnet");
      router.refresh();
      // Reload data
      const detailRes = await fetch(`/api/settlements/${settlement.id}`);
      if (detailRes.ok) setSettlement(await detailRes.json());
    } else {
      toast.error("Neuberechnung fehlgeschlagen");
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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
              {statusLabels[settlement.status] || settlement.status}
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
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleRecalculate} disabled={saving}>
              <RefreshCw className="mr-1 h-4 w-4" />
              Neu berechnen
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
                Genehmigen
              </Button>
            )}
            {settlement.status === "APPROVED" && (
              <Button
                size="sm"
                onClick={() => updateSettlement({ status: "PAID" })}
                disabled={saving}
              >
                <Euro className="mr-1 h-4 w-4" />
                Als bezahlt markieren
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

      {/* Bonuses & Deductions */}
      {!readOnly && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Boni & Abzüge</CardTitle>
            <Dialog open={lineItemDialogOpen} onOpenChange={setLineItemDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="mr-1 h-4 w-4" />
                  Hinzufügen
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Bonus / Abzug hinzufügen</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Typ</Label>
                    <Select value={newLineItemType} onValueChange={setNewLineItemType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BONUS">Bonus</SelectItem>
                        <SelectItem value="DEDUCTION">Abzug</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Beschreibung</Label>
                    <Input
                      value={newLineItemDesc}
                      onChange={(e) => setNewLineItemDesc(e.target.value)}
                      placeholder="z.B. Wochenendbonus, Kraftstoffvorschuss"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Betrag (EUR)</Label>
                    <CurrencyInput
                      placeholder="z.B. 50,00"
                      value={newLineItemAmount}
                      onChange={setNewLineItemAmount}
                    />
                  </div>
                  <Button
                    onClick={async () => {
                      if (!newLineItemDesc || !newLineItemAmount) {
                        toast.error("Bitte alle Felder ausfüllen");
                        return;
                      }
                      const res = await fetch(`/api/settlements/${settlement.id}/line-items`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          type: newLineItemType,
                          description: newLineItemDesc,
                          amount: parseDecimalInput(newLineItemAmount) ?? 0,
                        }),
                      });
                      if (res.ok) {
                        toast.success("Position hinzugefügt");
                        setLineItemDialogOpen(false);
                        setNewLineItemDesc("");
                        setNewLineItemAmount("");
                        // Reload settlement
                        const detailRes = await fetch(`/api/settlements/${settlement.id}`);
                        if (detailRes.ok) setSettlement(await detailRes.json());
                      } else {
                        toast.error("Position konnte nicht hinzugefügt werden");
                      }
                    }}
                    disabled={saving}
                  >
                    Position hinzufügen
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {(!settlement.lineItems || settlement.lineItems.length === 0) ? (
              <p className="text-sm text-gray-500">Keine Boni oder Abzüge</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Typ</TableHead>
                    <TableHead>Beschreibung</TableHead>
                    <TableHead className="text-right">Betrag</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settlement.lineItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Badge variant="secondary" className={item.type === "BONUS" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                          {item.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.description}
                        {item.isAutoApplied && (
                          <span className="ml-2 text-xs text-gray-400">(auto)</span>
                        )}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${item.type === "BONUS" ? "text-green-600" : "text-red-600"}`}>
                        {item.type === "DEDUCTION" ? "-" : "+"}{formatEur(Number(item.amount))}
                      </TableCell>
                      <TableCell>
                        {!item.isAutoApplied && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={async () => {
                              const res = await fetch(
                                `/api/settlements/${settlement.id}/line-items?lineItemId=${item.id}`,
                                { method: "DELETE" }
                              );
                              if (res.ok) {
                                toast.success("Position entfernt");
                                const detailRes = await fetch(`/api/settlements/${settlement.id}`);
                                if (detailRes.ok) setSettlement(await detailRes.json());
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Notes & Cash */}
      {!readOnly && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Notizen & Barbestandsabgleich</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Vom Fahrer eingezahltes Bargeld (EUR)</Label>
              <div className="flex gap-2">
                <CurrencyInput
                  placeholder="z.B. 150,00"
                  value={cashCollected}
                  onChange={setCashCollected}
                  className="w-40"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    updateSettlement({
                      cashCollectedByDriver: parseDecimalInput(cashCollected) ?? 0,
                    })
                  }
                  disabled={saving}
                >
                  Bargeld aktualisieren
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notizen</Label>
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
                Notizen speichern
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
