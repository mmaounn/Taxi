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

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, setValue, watch } = useForm<PartnerSettings>();

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
      toast.success("Settings saved");
    } else {
      toast.error("Failed to save settings");
    }
    setSaving(false);
  }

  if (loading) return <div className="py-8 text-center">Loading...</div>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input {...register("companyName")} />
            </div>
            <div className="space-y-2">
              <Label>Tax ID</Label>
              <Input {...register("taxId")} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Address</Label>
              <Input {...register("address")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Banking</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Bank Name</Label>
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
            <CardTitle>Default Commission</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Model</Label>
              <Select
                value={watch("defaultCommissionModel") || "PERCENTAGE"}
                onValueChange={(v) => setValue("defaultCommissionModel", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                  <SelectItem value="FIXED">Fixed</SelectItem>
                  <SelectItem value="HYBRID">Hybrid</SelectItem>
                  <SelectItem value="PER_RIDE">Per Ride</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Rate (%)</Label>
              <Input type="number" step="0.01" {...register("defaultCommissionRate")} />
            </div>
            <div className="space-y-2">
              <Label>Fixed Fee (EUR)</Label>
              <Input type="number" step="0.01" {...register("defaultFixedFee")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform API Credentials</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">
              Leave fields empty to keep existing values. Credentials are stored securely.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bolt Client ID</Label>
                <Input {...register("boltClientId")} placeholder="Enter to update" />
              </div>
              <div className="space-y-2">
                <Label>Bolt Client Secret</Label>
                <Input type="password" {...register("boltClientSecret")} placeholder="Enter to update" />
              </div>
              <div className="space-y-2">
                <Label>Uber Client ID</Label>
                <Input {...register("uberClientId")} placeholder="Enter to update" />
              </div>
              <div className="space-y-2">
                <Label>Uber Client Secret</Label>
                <Input type="password" {...register("uberClientSecret")} placeholder="Enter to update" />
              </div>
              <div className="space-y-2">
                <Label>Uber Organization ID</Label>
                <Input {...register("uberOrgId")} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </form>
    </div>
  );
}
