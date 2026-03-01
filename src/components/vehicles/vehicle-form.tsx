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
import { vehicleCreateSchema, type VehicleCreateInput } from "@/lib/validators/vehicle";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

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

interface VehicleFormProps {
  initialData?: VehicleCreateInput & { id?: string; status?: string };
}

export function VehicleForm({ initialData }: VehicleFormProps) {
  const router = useRouter();
  const isEditing = !!initialData?.id;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<VehicleCreateInput>({
    resolver: zodResolver(vehicleCreateSchema) as any,
    defaultValues: initialData ?? {},
  });

  async function onSubmit(data: VehicleCreateInput) {
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Fahrzeugdetails</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
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
                value={watch("status" as keyof VehicleCreateInput) as string || initialData?.status || "ACTIVE"}
                onValueChange={(v) => setValue("status" as keyof VehicleCreateInput, v as never)}
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
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="insuranceExpiry">
              Ablaufdatum Versicherung
              <ExpiryBadge dateStr={watch("insuranceExpiry" as keyof VehicleCreateInput) as string | undefined} />
            </Label>
            <Input
              id="insuranceExpiry"
              type="date"
              {...register("insuranceExpiry" as keyof VehicleCreateInput)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="registrationExpiry">
              Ablaufdatum Zulassung
              <ExpiryBadge dateStr={watch("registrationExpiry" as keyof VehicleCreateInput) as string | undefined} />
            </Label>
            <Input
              id="registrationExpiry"
              type="date"
              {...register("registrationExpiry" as keyof VehicleCreateInput)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monatliche Kosten</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="monthlyRentalCost">Mietkosten (EUR)</Label>
            <Input
              id="monthlyRentalCost"
              type="number"
              step="0.01"
              {...register("monthlyRentalCost")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="insuranceMonthlyCost">Versicherung (EUR)</Label>
            <Input
              id="insuranceMonthlyCost"
              type="number"
              step="0.01"
              {...register("insuranceMonthlyCost")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="otherMonthlyCosts">Sonstige Kosten (EUR)</Label>
            <Input
              id="otherMonthlyCosts"
              type="number"
              step="0.01"
              {...register("otherMonthlyCosts")}
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
