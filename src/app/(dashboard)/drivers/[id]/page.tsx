"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { DriverForm } from "@/components/drivers/driver-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Edit } from "lucide-react";

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

export default function DriverDetailPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const isEditing = searchParams.get("edit") === "true";
  const [driver, setDriver] = useState<DriverData | null>(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/drivers/${id}`).then((r) => r.json()),
      fetch("/api/vehicles?status=ACTIVE").then((r) => r.json()),
    ]).then(([d, v]) => {
      setDriver(d);
      setVehicles(v);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="py-8 text-center">Loading...</div>;
  if (!driver) return <div className="py-8 text-center text-red-600">Driver not found</div>;

  if (isEditing) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-2xl font-bold">Edit Driver</h1>
        <DriverForm
          initialData={{
            ...driver,
            email: driver.email || "",
            phone: driver.phone || undefined,
            taxId: driver.taxId || undefined,
            bankIban: driver.bankIban || undefined,
            bankBic: driver.bankBic || undefined,
            taxiLicenseNumber: driver.taxiLicenseNumber || undefined,
            taxiLicenseExpiry: driver.taxiLicenseExpiry
              ? new Date(driver.taxiLicenseExpiry).toISOString().split("T")[0]
              : undefined,
            commissionModel: driver.commissionModel as "PERCENTAGE" | "FIXED" | "HYBRID" | "PER_RIDE",
            commissionRate: driver.commissionRate ?? undefined,
            fixedFee: driver.fixedFee ?? undefined,
            hybridThreshold: driver.hybridThreshold ?? undefined,
            perRideFee: driver.perRideFee ?? undefined,
            settlementFrequency: driver.settlementFrequency as "WEEKLY" | "BIWEEKLY" | "MONTHLY",
            boltDriverId: driver.boltDriverId || undefined,
            uberDriverUuid: driver.uberDriverUuid || undefined,
            freenowDriverId: driver.freenowDriverId || undefined,
            vehicleId: driver.vehicleId || undefined,
          }}
          vehicles={vehicles}
        />
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800",
    INACTIVE: "bg-gray-100 text-gray-800",
    SUSPENDED: "bg-red-100 text-red-800",
  };

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
        <Button asChild>
          <Link href={`/drivers/${id}?edit=true`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="font-medium">Email:</span> {driver.email || "—"}</p>
            <p><span className="font-medium">Phone:</span> {driver.phone || "—"}</p>
            <p><span className="font-medium">Tax ID:</span> {driver.taxId || "—"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Banking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="font-medium">IBAN:</span> {driver.bankIban || "—"}</p>
            <p><span className="font-medium">BIC:</span> {driver.bankBic || "—"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Commission</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="font-medium">Model:</span> {driver.commissionModel}</p>
            {driver.commissionRate != null && (
              <p><span className="font-medium">Rate:</span> {Number(driver.commissionRate)}%</p>
            )}
            {driver.fixedFee != null && (
              <p><span className="font-medium">Fixed Fee:</span> €{Number(driver.fixedFee).toFixed(2)}</p>
            )}
            <p><span className="font-medium">Frequency:</span> {driver.settlementFrequency}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vehicle & Platform IDs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="font-medium">Vehicle:</span>{" "}
              {driver.vehicle
                ? `${driver.vehicle.licensePlate} (${driver.vehicle.make || ""} ${driver.vehicle.model || ""})`
                : "—"}
            </p>
            <p><span className="font-medium">Bolt ID:</span> {driver.boltDriverId || "—"}</p>
            <p><span className="font-medium">Uber UUID:</span> {driver.uberDriverUuid || "—"}</p>
            <p><span className="font-medium">FreeNow ID:</span> {driver.freenowDriverId || "—"}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
