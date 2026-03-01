"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

interface PartnerSettings {
  companyName: string;
  taxId: string;
  address: string;
  bankIban: string;
  bankBic: string;
  bankName: string;
  defaultCommissionModel: string;
  defaultCommissionRate: number | null;
  defaultFixedFee: number | null;
  boltClientId: string | null;
  boltClientSecret: string | null;
  uberClientId: string | null;
  uberClientSecret: string | null;
  uberOrgId: string | null;
}

type ValidationStatus = "idle" | "loading" | "valid" | "invalid";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [boltStatus, setBoltStatus] = useState<ValidationStatus>("idle");
  const [uberStatus, setUberStatus] = useState<ValidationStatus>("idle");
  const { register, handleSubmit, reset, setValue, watch, getValues } = useForm<PartnerSettings>();

  async function testCredentials(platform: "bolt" | "uber") {
    const setStatus = platform === "bolt" ? setBoltStatus : setUberStatus;
    const clientId = platform === "bolt" ? getValues("boltClientId") : getValues("uberClientId");
    const clientSecret = platform === "bolt" ? getValues("boltClientSecret") : getValues("uberClientSecret");

    if (!clientId || !clientSecret) {
      toast.error(`Bitte ${platform === "bolt" ? "Bolt" : "Uber"} Client ID und Secret eingeben`);
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch("/api/validate-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, clientId, clientSecret }),
      });
      const data = await res.json();
      setStatus(data.valid ? "valid" : "invalid");
      if (data.valid) {
        toast.success(`${platform === "bolt" ? "Bolt" : "Uber"}-Verbindung erfolgreich`);
      } else {
        toast.error(data.error || "Validierung fehlgeschlagen");
      }
    } catch {
      setStatus("invalid");
      toast.error("Verbindung fehlgeschlagen");
    }
  }

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.partner) {
          reset({
            ...data.partner,
            boltClientId: data.partner.boltClientId === "configured" ? "" : data.partner.boltClientId || "",
            boltClientSecret: data.partner.boltClientSecret === "configured" ? "" : data.partner.boltClientSecret || "",
            uberClientId: data.partner.uberClientId === "configured" ? "" : data.partner.uberClientId || "",
            uberClientSecret: data.partner.uberClientSecret === "configured" ? "" : data.partner.uberClientSecret || "",
            defaultCommissionRate: data.partner.defaultCommissionRate ? Number(data.partner.defaultCommissionRate) : null,
            defaultFixedFee: data.partner.defaultFixedFee ? Number(data.partner.defaultFixedFee) : null,
          });
        }
        setLoading(false);
      });
  }, [reset]);

  async function onSubmit(data: PartnerSettings) {
    setSaving(true);
    // Don't send empty credential fields (would clear configured values)
    const payload: Record<string, unknown> = { ...data };
    if (!data.boltClientId) delete payload.boltClientId;
    if (!data.boltClientSecret) delete payload.boltClientSecret;
    if (!data.uberClientId) delete payload.uberClientId;
    if (!data.uberClientSecret) delete payload.uberClientSecret;

    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      toast.success("Einstellungen gespeichert");
    } else {
      toast.error("Einstellungen konnten nicht gespeichert werden");
    }
    setSaving(false);
  }

  if (loading) return <div className="py-8 text-center">Wird geladen...</div>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Einstellungen</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Unternehmensdaten</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Firmenname</Label>
              <Input {...register("companyName")} />
            </div>
            <div className="space-y-2">
              <Label>Steuer-ID</Label>
              <Input {...register("taxId")} />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label>Adresse</Label>
              <Input {...register("address")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bankverbindung</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Bankname</Label>
              <Input {...register("bankName")} />
            </div>
            <div className="space-y-2">
              <Label>IBAN</Label>
              <Input {...register("bankIban")} />
            </div>
            <div className="space-y-2">
              <Label>BIC</Label>
              <Input {...register("bankBic")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Standard-Provision</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Modell</Label>
              <Select
                value={watch("defaultCommissionModel") || "PERCENTAGE"}
                onValueChange={(v) => setValue("defaultCommissionModel", v)}
              >
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
              <Label>Satz (%)</Label>
              <Input type="number" step="0.01" {...register("defaultCommissionRate")} />
            </div>
            <div className="space-y-2">
              <Label>Festgebühr (EUR)</Label>
              <Input type="number" step="0.01" {...register("defaultFixedFee")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plattform-API-Zugangsdaten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">
              Felder leer lassen, um bestehende Werte beizubehalten. Zugangsdaten werden sicher gespeichert.
            </p>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bolt Client ID</Label>
                  <Input {...register("boltClientId")} placeholder="Zum Aktualisieren eingeben" />
                </div>
                <div className="space-y-2">
                  <Label>Bolt Client Secret</Label>
                  <Input type="password" {...register("boltClientSecret")} placeholder="Zum Aktualisieren eingeben" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => testCredentials("bolt")}
                  disabled={boltStatus === "loading"}
                >
                  {boltStatus === "loading" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Bolt testen
                </Button>
                {boltStatus === "valid" && <CheckCircle className="h-5 w-5 text-green-500" />}
                {boltStatus === "invalid" && <XCircle className="h-5 w-5 text-red-500" />}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Uber Client ID</Label>
                  <Input {...register("uberClientId")} placeholder="Zum Aktualisieren eingeben" />
                </div>
                <div className="space-y-2">
                  <Label>Uber Client Secret</Label>
                  <Input type="password" {...register("uberClientSecret")} placeholder="Zum Aktualisieren eingeben" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => testCredentials("uber")}
                  disabled={uberStatus === "loading"}
                >
                  {uberStatus === "loading" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Uber testen
                </Button>
                {uberStatus === "valid" && <CheckCircle className="h-5 w-5 text-green-500" />}
                {uberStatus === "invalid" && <XCircle className="h-5 w-5 text-red-500" />}
              </div>

              <div className="space-y-2">
                <Label>Uber Organisations-ID</Label>
                <Input {...register("uberOrgId")} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={saving}>
          {saving ? "Wird gespeichert..." : "Einstellungen speichern"}
        </Button>
      </form>
    </div>
  );
}
