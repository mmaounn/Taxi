"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { VehicleForm } from "@/components/vehicles/vehicle-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Edit } from "lucide-react";
import { formatEur } from "@/lib/format";

interface VehicleData {
  id: string;
  licensePlate: string;
  make: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  status: "ACTIVE" | "MAINTENANCE" | "DECOMMISSIONED";
  monthlyRentalCost: number | null;
  insuranceMonthlyCost: number | null;
  otherMonthlyCosts: number | null;
  insuranceExpiry: string | null;
  registrationExpiry: string | null;
  nextServiceDate: string | null;
  nextInspectionDate: string | null;
  drivers: { id: string; firstName: string; lastName: string; status: string }[];
}

function ExpiryBadge({ date }: { date: string | null }) {
  if (!date) return null;
  const d = new Date(date);
  const now = new Date();
  const daysUntil = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

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

function formatDate(date: string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("de-AT");
}

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const isEditing = searchParams.get("edit") === "true";
  const [vehicle, setVehicle] = useState<VehicleData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/vehicles/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setVehicle(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="py-8 text-center">Wird geladen...</div>;
  if (!vehicle) return <div className="py-8 text-center text-red-600">Fahrzeug nicht gefunden</div>;

  if (isEditing) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-2xl font-bold">Fahrzeug bearbeiten</h1>
        <VehicleForm
          initialData={{
            ...vehicle,
            make: vehicle.make || undefined,
            model: vehicle.model || undefined,
            year: vehicle.year ?? undefined,
            color: vehicle.color || undefined,
            monthlyRentalCost: vehicle.monthlyRentalCost ?? undefined,
            insuranceMonthlyCost: vehicle.insuranceMonthlyCost ?? undefined,
            otherMonthlyCosts: vehicle.otherMonthlyCosts ?? undefined,
            insuranceExpiry: vehicle.insuranceExpiry || undefined,
            registrationExpiry: vehicle.registrationExpiry || undefined,
            nextServiceDate: vehicle.nextServiceDate || undefined,
            nextInspectionDate: vehicle.nextInspectionDate || undefined,
          }}
        />
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800",
    MAINTENANCE: "bg-yellow-100 text-yellow-800",
    DECOMMISSIONED: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{vehicle.licensePlate}</h1>
          <p className="text-gray-600">
            {vehicle.make} {vehicle.model} {vehicle.year ? `(${vehicle.year})` : ""}
          </p>
          <Badge variant="secondary" className={statusColors[vehicle.status]}>
            {{ ACTIVE: "Aktiv", MAINTENANCE: "In Wartung", DECOMMISSIONED: "Außer Betrieb" }[vehicle.status] || vehicle.status}
          </Badge>
        </div>
        <Button asChild>
          <Link href={`/vehicles/${id}?edit=true`}>
            <Edit className="mr-2 h-4 w-4" />
            Bearbeiten
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ablaufdaten Dokumente</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm md:grid-cols-4">
          <div>
            <p className="text-gray-500">Versicherung</p>
            <p className="font-medium">{formatDate(vehicle.insuranceExpiry)} <ExpiryBadge date={vehicle.insuranceExpiry} /></p>
          </div>
          <div>
            <p className="text-gray-500">Zulassung</p>
            <p className="font-medium">{formatDate(vehicle.registrationExpiry)} <ExpiryBadge date={vehicle.registrationExpiry} /></p>
          </div>
          <div>
            <p className="text-gray-500">Nächster Service</p>
            <p className="font-medium">{formatDate(vehicle.nextServiceDate)} <ExpiryBadge date={vehicle.nextServiceDate} /></p>
          </div>
          <div>
            <p className="text-gray-500">§57a (Pickerl)</p>
            <p className="font-medium">{formatDate(vehicle.nextInspectionDate)} <ExpiryBadge date={vehicle.nextInspectionDate} /></p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monatliche Kosten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="font-medium">Mietkosten:</span>{" "}
              {vehicle.monthlyRentalCost != null ? formatEur(Number(vehicle.monthlyRentalCost)) : "—"}
            </p>
            <p>
              <span className="font-medium">Versicherung:</span>{" "}
              {vehicle.insuranceMonthlyCost != null ? formatEur(Number(vehicle.insuranceMonthlyCost)) : "—"}
            </p>
            <p>
              <span className="font-medium">Sonstige:</span>{" "}
              {vehicle.otherMonthlyCosts != null ? formatEur(Number(vehicle.otherMonthlyCosts)) : "—"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Zugewiesene Fahrer</CardTitle>
          </CardHeader>
          <CardContent>
            {vehicle.drivers.length > 0 ? (
              <ul className="space-y-2">
                {vehicle.drivers.map((d) => (
                  <li key={d.id} className="flex items-center justify-between text-sm">
                    <Link href={`/drivers/${d.id}`} className="text-blue-600 hover:underline">
                      {d.firstName} {d.lastName}
                    </Link>
                    <Badge variant="secondary" className="text-xs">
                      {d.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">Keine Fahrer zugewiesen</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
