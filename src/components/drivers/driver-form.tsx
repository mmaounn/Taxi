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
import { Separator } from "@/components/ui/separator";
import { driverCreateSchema, type DriverCreateInput } from "@/lib/validators/driver";
import { toast } from "sonner";
import { DatePicker } from "@/components/ui/date-picker";

interface Vehicle {
  id: string;
  licensePlate: string;
  make: string | null;
  model: string | null;
}

interface DriverFormProps {
  initialData?: DriverCreateInput & { id?: string; status?: string };
  vehicles: Vehicle[];
}

export function DriverForm({ initialData, vehicles }: DriverFormProps) {
  const router = useRouter();
  const isEditing = !!initialData?.id;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<DriverCreateInput>({
    resolver: zodResolver(driverCreateSchema) as any,
    defaultValues: initialData ?? {
      commissionModel: "PERCENTAGE",
      settlementFrequency: "WEEKLY",
    },
  });

  const commissionModel = watch("commissionModel");

  async function onSubmit(data: DriverCreateInput) {
    const url = isEditing ? `/api/drivers/${initialData!.id}` : "/api/drivers";
    const method = isEditing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error?.fieldErrors ? "Validierungsfehler" : "Fahrer konnte nicht gespeichert werden");
      return;
    }

    toast.success(isEditing ? "Fahrer aktualisiert" : "Fahrer erstellt");
    router.push("/drivers");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Persönliche Daten</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">Vorname *</Label>
            <Input id="firstName" {...register("firstName")} />
            {errors.firstName && (
              <p className="text-sm text-red-600">{errors.firstName.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Nachname *</Label>
            <Input id="lastName" {...register("lastName")} />
            {errors.lastName && (
              <p className="text-sm text-red-600">{errors.lastName.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-Mail</Label>
            <Input id="email" type="email" {...register("email")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefon</Label>
            <Input id="phone" {...register("phone")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="taxId">Steuer-ID</Label>
            <Input id="taxId" {...register("taxId")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bankdaten</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bankIban">IBAN</Label>
            <Input id="bankIban" {...register("bankIban")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bankBic">BIC</Label>
            <Input id="bankBic" {...register("bankBic")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Taxilizenz</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="taxiLicenseNumber">Lizenznummer</Label>
            <Input id="taxiLicenseNumber" {...register("taxiLicenseNumber")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="taxiLicenseExpiry">Ablaufdatum</Label>
            <DatePicker
              value={watch("taxiLicenseExpiry") || ""}
              onChange={(v) => setValue("taxiLicenseExpiry", v)}
              className="w-full"
            />
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
              <Select
                value={commissionModel}
                onValueChange={(v) => setValue("commissionModel", v as DriverCreateInput["commissionModel"])}
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
              <Label>Abrechnungsfrequenz</Label>
              <Select
                value={watch("settlementFrequency")}
                onValueChange={(v) => setValue("settlementFrequency", v as DriverCreateInput["settlementFrequency"])}
              >
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
              <Input
                id="commissionRate"
                type="number"
                step="0.01"
                {...register("commissionRate")}
              />
            </div>
          )}
          {(commissionModel === "FIXED" || commissionModel === "HYBRID") && (
            <div className="space-y-2">
              <Label htmlFor="fixedFee">Festgebühr (EUR)</Label>
              <Input
                id="fixedFee"
                type="number"
                step="0.01"
                {...register("fixedFee")}
              />
            </div>
          )}
          {commissionModel === "HYBRID" && (
            <div className="space-y-2">
              <Label htmlFor="hybridThreshold">Schwellenwert (EUR)</Label>
              <Input
                id="hybridThreshold"
                type="number"
                step="0.01"
                {...register("hybridThreshold")}
              />
            </div>
          )}
          {commissionModel === "PER_RIDE" && (
            <div className="space-y-2">
              <Label htmlFor="perRideFee">Gebühr pro Fahrt (EUR)</Label>
              <Input
                id="perRideFee"
                type="number"
                step="0.01"
                {...register("perRideFee")}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plattform-IDs & Fahrzeug</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="boltDriverId">Bolt Driver ID</Label>
            <Input id="boltDriverId" {...register("boltDriverId")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="uberDriverUuid">Uber Driver UUID</Label>
            <Input id="uberDriverUuid" {...register("uberDriverUuid")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="freenowDriverId">FreeNow Driver ID</Label>
            <Input id="freenowDriverId" {...register("freenowDriverId")} />
          </div>
          <div className="space-y-2">
            <Label>Fahrzeug</Label>
            <Select
              value={watch("vehicleId") || ""}
              onValueChange={(v) => setValue("vehicleId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Kein Fahrzeug zugewiesen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Kein Fahrzeug</SelectItem>
                {vehicles.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.licensePlate} {v.make && v.model ? `(${v.make} ${v.model})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Wird gespeichert..." : isEditing ? "Fahrer aktualisieren" : "Fahrer erstellen"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Abbrechen
        </Button>
      </div>
    </form>
  );
}
