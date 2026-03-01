"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { z } from "zod";
import { vehicleCreateSchema, type VehicleCreateInput } from "@/lib/validators/vehicle";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { DatePicker } from "@/components/ui/date-picker";
import { CurrencyInput } from "@/components/ui/currency-input";

function ExpiryBadge({ dateStr }: { dateStr: string | undefined }) {
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

// Extend create schema with status for editing (avoid .partial() which breaks z.preprocess in zodResolver)
const vehicleEditSchema = vehicleCreateSchema.extend({
  status: z.enum(["ACTIVE", "MAINTENANCE", "DECOMMISSIONED"]).optional(),
});
type VehicleEditInput = z.infer<typeof vehicleEditSchema>;

interface VehicleFormProps {
  initialData?: VehicleEditInput & { id?: string };
}

export function VehicleForm({ initialData }: VehicleFormProps) {
  const router = useRouter();
  const isEditing = !!initialData?.id;

  const schema = isEditing ? vehicleEditSchema : vehicleCreateSchema;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<VehicleEditInput>({
    resolver: zodResolver(schema) as any,
    defaultValues: initialData ?? {},
  });

  async function onSubmit(data: VehicleEditInput) {
    const url = isEditing ? `/api/vehicles/${initialData!.id}` : "/api/vehicles";
    const method = isEditing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      toast.error("Fahrzeug konnte nicht gespeichert werden");
      return;
    }

    toast.success(isEditing ? "Fahrzeug aktualisiert" : "Fahrzeug erstellt");
    router.push("/vehicles");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, (errs) => {
      console.error("Form validation errors:", errs);
      const messages = Object.entries(errs).map(([k, v]) => `${k}: ${v?.message}`).join(", ");
      toast.error(`Validierungsfehler: ${messages}`);
    })} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Fahrzeugdetails</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="licensePlate">Kennzeichen *</Label>
            <Input id="licensePlate" {...register("licensePlate")} />
            {errors.licensePlate && (
              <p className="text-sm text-red-600">{errors.licensePlate.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="make">Marke</Label>
            <Input id="make" placeholder="z.B. Toyota" {...register("make")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="model">Modell</Label>
            <Input id="model" placeholder="z.B. Camry" {...register("model")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="year">Baujahr</Label>
            <Input id="year" type="number" {...register("year")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="color">Farbe</Label>
            <Input id="color" {...register("color")} />
          </div>

          {isEditing && (
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={watch("status") as string || initialData?.status || "ACTIVE"}
                onValueChange={(v) => setValue("status", v as "ACTIVE" | "MAINTENANCE" | "DECOMMISSIONED")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Aktiv</SelectItem>
                  <SelectItem value="MAINTENANCE">In Wartung</SelectItem>
                  <SelectItem value="DECOMMISSIONED">Außer Betrieb</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ablaufdaten Dokumente</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="insuranceExpiry">
              Ablaufdatum Versicherung
              <ExpiryBadge dateStr={watch("insuranceExpiry") as string | undefined} />
            </Label>
            <DatePicker
              value={watch("insuranceExpiry") as string || ""}
              onChange={(v) => setValue("insuranceExpiry", v)}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="registrationExpiry">
              Ablaufdatum Zulassung
              <ExpiryBadge dateStr={watch("registrationExpiry") as string | undefined} />
            </Label>
            <DatePicker
              value={watch("registrationExpiry") as string || ""}
              onChange={(v) => setValue("registrationExpiry", v)}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nextServiceDate">
              Nächster Service
              <ExpiryBadge dateStr={watch("nextServiceDate") as string | undefined} />
            </Label>
            <DatePicker
              value={watch("nextServiceDate") as string || ""}
              onChange={(v) => setValue("nextServiceDate", v)}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nextInspectionDate">
              Nächste §57a (Pickerl)
              <ExpiryBadge dateStr={watch("nextInspectionDate") as string | undefined} />
            </Label>
            <DatePicker
              value={watch("nextInspectionDate") as string || ""}
              onChange={(v) => setValue("nextInspectionDate", v)}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monatliche Kosten</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="monthlyRentalCost">Mietkosten (EUR)</Label>
            <CurrencyInput
              id="monthlyRentalCost"
              placeholder="z.B. 450,00"
              value={watch("monthlyRentalCost")?.toString() || ""}
              onChange={(v) => setValue("monthlyRentalCost", v as unknown as number)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="insuranceMonthlyCost">Versicherung (EUR)</Label>
            <CurrencyInput
              id="insuranceMonthlyCost"
              placeholder="z.B. 200,00"
              value={watch("insuranceMonthlyCost")?.toString() || ""}
              onChange={(v) => setValue("insuranceMonthlyCost", v as unknown as number)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="otherMonthlyCosts">Sonstige Kosten (EUR)</Label>
            <CurrencyInput
              id="otherMonthlyCosts"
              placeholder="z.B. 50,00"
              value={watch("otherMonthlyCosts")?.toString() || ""}
              onChange={(v) => setValue("otherMonthlyCosts", v as unknown as number)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Wird gespeichert..." : isEditing ? "Fahrzeug aktualisieren" : "Fahrzeug erstellen"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Abbrechen
        </Button>
      </div>
    </form>
  );
}
