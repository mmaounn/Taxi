"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClearableInput } from "@/components/ui/clearable-input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Save, Wallet, Plus } from "lucide-react";
import { toast } from "sonner";
import { formatEur, parseDecimalInput } from "@/lib/format";
import { DatePicker } from "@/components/ui/date-picker";

interface DriverData {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  taxId: string | null;
  bankIban: string | null;
  bankBic: string | null;
  taxiLicenseNumber: string | null;
  taxiLicenseExpiry: string | null;
  driversLicenseExpiry: string | null;
  commissionModel: string;
  commissionRate: number | null;
  fixedFee: number | null;
  hybridThreshold: number | null;
  perRideFee: number | null;
  settlementFrequency: string;
  status: string;
  boltDriverId: string | null;
  uberDriverUuid: string | null;
  freenowDriverId: string | null;
  vehicleId: string | null;
  vehicle: { licensePlate: string; make: string | null; model: string | null } | null;
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  INACTIVE: "bg-gray-100 text-gray-800",
  SUSPENDED: "bg-red-100 text-red-800",
};

function ExpiryBadge({ dateStr }: { dateStr: string | null }) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const now = new Date();
  const daysUntil = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntil <= 0) {
    return <Badge variant="secondary" className="ml-2 bg-red-100 text-red-800">Abgelaufen</Badge>;
  }
  if (daysUntil <= 7) {
    return <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-800">Noch {daysUntil}T</Badge>;
  }
  if (daysUntil <= 30) {
    return <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-800">Noch {daysUntil}T</Badge>;
  }
  return null;
}

export default function DriverDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [driver, setDriver] = useState<DriverData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Local-only editable fields
  const [taxId, setTaxId] = useState("");
  const [bankIban, setBankIban] = useState("");
  const [bankBic, setBankBic] = useState("");
  const [taxiLicenseNumber, setTaxiLicenseNumber] = useState("");
  const [taxiLicenseExpiry, setTaxiLicenseExpiry] = useState("");
  const [driversLicenseExpiry, setDriversLicenseExpiry] = useState("");
  const [commissionModel, setCommissionModel] = useState("PERCENTAGE");
  const [commissionRate, setCommissionRate] = useState("");
  const [fixedFee, setFixedFee] = useState("");
  const [hybridThreshold, setHybridThreshold] = useState("");
  const [perRideFee, setPerRideFee] = useState("");
  const [settlementFrequency, setSettlementFrequency] = useState("WEEKLY");

  // Balance state
  const [balanceData, setBalanceData] = useState<{
    currentBalance: number;
    history: {
      id: string;
      periodStart: string;
      periodEnd: string;
      openingBalance: number;
      settlementNet: number;
      adjustments: number;
      closingBalance: number;
      notes: string | null;
    }[];
  } | null>(null);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustNotes, setAdjustNotes] = useState("");

  function loadBalance() {
    fetch(`/api/drivers/${id}/balance`)
      .then((r) => r.json())
      .then((data) => setBalanceData(data))
      .catch(() => {});
  }

  useEffect(() => {
    loadBalance();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    fetch(`/api/drivers/${id}`)
      .then((r) => r.json())
      .then((d: DriverData) => {
        setDriver(d);
        setTaxId(d.taxId || "");
        setBankIban(d.bankIban || "");
        setBankBic(d.bankBic || "");
        setTaxiLicenseNumber(d.taxiLicenseNumber || "");
        setTaxiLicenseExpiry(
          d.taxiLicenseExpiry ? new Date(d.taxiLicenseExpiry).toISOString().split("T")[0] : ""
        );
        setDriversLicenseExpiry(
          d.driversLicenseExpiry ? new Date(d.driversLicenseExpiry).toISOString().split("T")[0] : ""
        );
        setCommissionModel(d.commissionModel);
        setCommissionRate(d.commissionRate != null ? String(d.commissionRate) : "");
        setFixedFee(d.fixedFee != null ? String(d.fixedFee) : "");
        setHybridThreshold(d.hybridThreshold != null ? String(d.hybridThreshold) : "");
        setPerRideFee(d.perRideFee != null ? String(d.perRideFee) : "");
        setSettlementFrequency(d.settlementFrequency);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/drivers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taxId: taxId || undefined,
          bankIban: bankIban || undefined,
          bankBic: bankBic || undefined,
          taxiLicenseNumber: taxiLicenseNumber || undefined,
          taxiLicenseExpiry: taxiLicenseExpiry || undefined,
          driversLicenseExpiry: driversLicenseExpiry || undefined,
          commissionModel,
          commissionRate: commissionRate ? parseDecimalInput(commissionRate) : undefined,
          fixedFee: fixedFee ? parseDecimalInput(fixedFee) : undefined,
          hybridThreshold: hybridThreshold ? parseDecimalInput(hybridThreshold) : undefined,
          perRideFee: perRideFee ? parseDecimalInput(perRideFee) : undefined,
          settlementFrequency,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Speichern fehlgeschlagen");
        return;
      }

      toast.success("Fahrereinstellungen gespeichert");
      router.refresh();
    } catch {
      toast.error("Speichern fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="py-8 text-center">Wird geladen...</div>;
  if (!driver) return <div className="py-8 text-center text-red-600">Fahrer nicht gefunden</div>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {driver.firstName} {driver.lastName}
          </h1>
          <Badge variant="secondary" className={statusColors[driver.status]}>
            {driver.status}
          </Badge>
        </div>
      </div>

      {/* Kontostand (Balance) */}
      {balanceData && (
        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Kontostand
            </CardTitle>
            <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="mr-1 h-4 w-4" />
                  Anpassung
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Manuelle Kontostandsanpassung</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Betrag (EUR) — positiv zum Gutschreiben, negativ zum Belasten</Label>
                    <CurrencyInput
                      value={adjustAmount}
                      onChange={setAdjustAmount}
                      placeholder="z.B. 50,00 oder -25,00"
                      allowNegative
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Notizen</Label>
                    <Textarea
                      value={adjustNotes}
                      onChange={(e) => setAdjustNotes(e.target.value)}
                      placeholder="Grund für die Anpassung"
                      rows={2}
                    />
                  </div>
                  <Button
                    onClick={async () => {
                      const amt = parseDecimalInput(adjustAmount) ?? 0;
                      if (!amt || amt === 0) {
                        toast.error("Bitte einen gültigen Betrag eingeben");
                        return;
                      }
                      const res = await fetch(`/api/drivers/${id}/balance`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ amount: amt, notes: adjustNotes || undefined }),
                      });
                      if (res.ok) {
                        toast.success("Anpassung hinzugefügt");
                        setAdjustDialogOpen(false);
                        setAdjustAmount("");
                        setAdjustNotes("");
                        loadBalance();
                      } else {
                        toast.error("Anpassung konnte nicht hinzugefügt werden");
                      }
                    }}
                  >
                    Anpassung speichern
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold mb-4 ${balanceData.currentBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatEur(balanceData.currentBalance)}
            </div>

            {balanceData.history.length > 0 && (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Zeitraum</TableHead>
                      <TableHead className="text-right">Eröffnung</TableHead>
                      <TableHead className="text-right">Abrechnung</TableHead>
                      <TableHead className="text-right">Anpass.</TableHead>
                      <TableHead className="text-right">Abschluss</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {balanceData.history.slice(0, 5).map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="text-xs">
                          {entry.adjustments !== 0 && entry.settlementNet === 0
                            ? entry.notes || "Anpassung"
                            : `${new Date(entry.periodStart).toLocaleDateString("de-AT")} — ${new Date(entry.periodEnd).toLocaleDateString("de-AT")}`}
                        </TableCell>
                        <TableCell className="text-right text-xs">{formatEur(entry.openingBalance)}</TableCell>
                        <TableCell className="text-right text-xs">{formatEur(entry.settlementNet)}</TableCell>
                        <TableCell className="text-right text-xs">
                          {entry.adjustments !== 0 ? (
                            <span className={entry.adjustments > 0 ? "text-green-600" : "text-red-600"}>
                              {entry.adjustments > 0 ? "+" : ""}{formatEur(entry.adjustments)}
                            </span>
                          ) : "—"}
                        </TableCell>
                        <TableCell className={`text-right text-xs font-medium ${entry.closingBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatEur(entry.closingBalance)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bolt-synced data — read-only */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Fahrerinformationen</CardTitle>
            <Badge variant="outline" className="text-xs">Von Bolt synchronisiert</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-muted-foreground">Name</span>
            <p>{driver.firstName} {driver.lastName}</p>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">E-Mail</span>
            <p>{driver.email || "—"}</p>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Telefon</span>
            <p>{driver.phone || "—"}</p>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Status</span>
            <p>{{ ACTIVE: "Aktiv", INACTIVE: "Inaktiv", SUSPENDED: "Gesperrt" }[driver.status] || driver.status}</p>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Fahrzeug</span>
            <p>
              {driver.vehicle
                ? `${driver.vehicle.licensePlate} (${driver.vehicle.make || ""} ${driver.vehicle.model || ""})`
                : "—"}
            </p>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Bolt-ID</span>
            <p className="font-mono text-xs">{driver.boltDriverId || "—"}</p>
          </div>
          {driver.uberDriverUuid && (
            <div>
              <span className="font-medium text-muted-foreground">Uber-UUID</span>
              <p className="font-mono text-xs">{driver.uberDriverUuid}</p>
            </div>
          )}
          {driver.freenowDriverId && (
            <div>
              <span className="font-medium text-muted-foreground">FreeNow-ID</span>
              <p className="font-mono text-xs">{driver.freenowDriverId}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Local-only data — editable */}
      <Card>
        <CardHeader>
          <CardTitle>Bankdaten</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bankIban">IBAN</Label>
            <ClearableInput id="bankIban" value={bankIban} onChange={(e) => setBankIban(e.target.value)} onClear={() => setBankIban("")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bankBic">BIC</Label>
            <ClearableInput id="bankBic" value={bankBic} onChange={(e) => setBankBic(e.target.value)} onClear={() => setBankBic("")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Steuer & Führerschein</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="taxId">Steuer-ID</Label>
            <ClearableInput id="taxId" value={taxId} onChange={(e) => setTaxId(e.target.value)} onClear={() => setTaxId("")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="taxiLicenseNumber">Lizenznummer</Label>
            <ClearableInput id="taxiLicenseNumber" value={taxiLicenseNumber} onChange={(e) => setTaxiLicenseNumber(e.target.value)} onClear={() => setTaxiLicenseNumber("")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="taxiLicenseExpiry">
              Ablaufdatum Taxilizenz
              <ExpiryBadge dateStr={taxiLicenseExpiry} />
            </Label>
            <DatePicker value={taxiLicenseExpiry} onChange={setTaxiLicenseExpiry} className="w-full" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="driversLicenseExpiry">
              Ablaufdatum Führerschein
              <ExpiryBadge dateStr={driversLicenseExpiry} />
            </Label>
            <DatePicker value={driversLicenseExpiry} onChange={setDriversLicenseExpiry} className="w-full" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Provisionseinstellungen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Provisionsmodell</Label>
              <Select value={commissionModel} onValueChange={setCommissionModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">Prozentsatz</SelectItem>
                  <SelectItem value="FIXED">Festgebühr</SelectItem>
                  <SelectItem value="HYBRID">Hybrid</SelectItem>
                  <SelectItem value="PER_RIDE">Pro Fahrt</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Abrechnungsfrequenz</Label>
              <Select value={settlementFrequency} onValueChange={setSettlementFrequency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEEKLY">Wöchentlich</SelectItem>
                  <SelectItem value="BIWEEKLY">Zweiwöchentlich</SelectItem>
                  <SelectItem value="MONTHLY">Monatlich</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {(commissionModel === "PERCENTAGE" || commissionModel === "HYBRID") && (
            <div className="space-y-2">
              <Label htmlFor="commissionRate">Provisionssatz (%)</Label>
              <CurrencyInput id="commissionRate" placeholder="z.B. 25 oder 12,5" value={commissionRate} onChange={setCommissionRate} />
            </div>
          )}
          {(commissionModel === "FIXED" || commissionModel === "HYBRID") && (
            <div className="space-y-2">
              <Label htmlFor="fixedFee">Festgebühr (EUR)</Label>
              <CurrencyInput id="fixedFee" placeholder="z.B. 500,00" value={fixedFee} onChange={setFixedFee} />
            </div>
          )}
          {commissionModel === "HYBRID" && (
            <div className="space-y-2">
              <Label htmlFor="hybridThreshold">Schwellenwert (EUR)</Label>
              <CurrencyInput id="hybridThreshold" placeholder="z.B. 1.000,00" value={hybridThreshold} onChange={setHybridThreshold} />
            </div>
          )}
          {commissionModel === "PER_RIDE" && (
            <div className="space-y-2">
              <Label htmlFor="perRideFee">Gebühr pro Fahrt (EUR)</Label>
              <CurrencyInput id="perRideFee" placeholder="z.B. 3,50" value={perRideFee} onChange={setPerRideFee} />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Wird gespeichert..." : "Einstellungen speichern"}
        </Button>
        <Button variant="outline" onClick={() => router.back()}>
          Zurück
        </Button>
      </div>
    </div>
  );
}
