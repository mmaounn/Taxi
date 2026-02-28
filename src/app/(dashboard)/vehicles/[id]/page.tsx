"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { VehicleForm } from "@/components/vehicles/vehicle-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Edit } from "lucide-react";

interface VehicleData {
  id: string;
  licensePlate: string;
  make: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  status: string;
  monthlyRentalCost: number | null;
  insuranceMonthlyCost: number | null;
  otherMonthlyCosts: number | null;
  drivers: { id: string; firstName: string; lastName: string; status: string }[];
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

  if (loading) return <div className="py-8 text-center">Loading...</div>;
  if (!vehicle) return <div className="py-8 text-center text-red-600">Vehicle not found</div>;

  if (isEditing) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-2xl font-bold">Edit Vehicle</h1>
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
            {vehicle.status}
          </Badge>
        </div>
        <Button asChild>
          <Link href={`/vehicles/${id}?edit=true`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Costs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="font-medium">Rental:</span>{" "}
              {vehicle.monthlyRentalCost != null ? `€${Number(vehicle.monthlyRentalCost).toFixed(2)}` : "—"}
            </p>
            <p>
              <span className="font-medium">Insurance:</span>{" "}
              {vehicle.insuranceMonthlyCost != null ? `€${Number(vehicle.insuranceMonthlyCost).toFixed(2)}` : "—"}
            </p>
            <p>
              <span className="font-medium">Other:</span>{" "}
              {vehicle.otherMonthlyCosts != null ? `€${Number(vehicle.otherMonthlyCosts).toFixed(2)}` : "—"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assigned Drivers</CardTitle>
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
              <p className="text-sm text-gray-500">No drivers assigned</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
