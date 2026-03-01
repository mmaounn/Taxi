"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, Eye } from "lucide-react";
import { formatEur } from "@/lib/format";

interface Vehicle {
  id: string;
  licensePlate: string;
  make: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  status: string;
  monthlyRentalCost: number | null;
  drivers: { id: string; firstName: string; lastName: string }[];
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  MAINTENANCE: "bg-yellow-100 text-yellow-800",
  DECOMMISSIONED: "bg-gray-100 text-gray-800",
};

const statusLabels: Record<string, string> = {
  ACTIVE: "Aktiv",
  MAINTENANCE: "In Wartung",
  DECOMMISSIONED: "Außer Betrieb",
};

export function VehicleTable({ vehicles }: { vehicles: Vehicle[] }) {
  if (vehicles.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-gray-500">
        Keine Fahrzeuge gefunden.
      </div>
    );
  }

  return (
    <>
      {/* Mobile: Card view */}
      <div className="space-y-3 md:hidden">
        {vehicles.map((vehicle) => (
          <Card key={vehicle.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{vehicle.licensePlate}</p>
                  <p className="text-sm text-gray-500">
                    {vehicle.make || vehicle.model
                      ? `${vehicle.make || ""} ${vehicle.model || ""}`.trim()
                      : "—"}
                    {vehicle.year ? ` (${vehicle.year})` : ""}
                  </p>
                </div>
                <Badge variant="secondary" className={statusColors[vehicle.status]}>
                  {statusLabels[vehicle.status] || vehicle.status}
                </Badge>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
                <div className="space-y-0.5">
                  {vehicle.drivers.length > 0 && (
                    <p>Fahrer: {vehicle.drivers.map((d) => `${d.firstName} ${d.lastName}`).join(", ")}</p>
                  )}
                  {vehicle.monthlyRentalCost != null && (
                    <p>Kosten: {formatEur(Number(vehicle.monthlyRentalCost))}/Monat</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/vehicles/${vehicle.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/vehicles/${vehicle.id}?edit=true`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop: Table view */}
      <div className="hidden rounded-md border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kennzeichen</TableHead>
              <TableHead>Marke / Modell</TableHead>
              <TableHead>Baujahr</TableHead>
              <TableHead>Fahrer</TableHead>
              <TableHead>Monatl. Kosten</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicles.map((vehicle) => (
              <TableRow key={vehicle.id}>
                <TableCell className="font-medium">{vehicle.licensePlate}</TableCell>
                <TableCell>
                  {vehicle.make || vehicle.model
                    ? `${vehicle.make || ""} ${vehicle.model || ""}`.trim()
                    : "—"}
                </TableCell>
                <TableCell>{vehicle.year || "—"}</TableCell>
                <TableCell>
                  {vehicle.drivers.length > 0
                    ? vehicle.drivers.map((d) => `${d.firstName} ${d.lastName}`).join(", ")
                    : "—"}
                </TableCell>
                <TableCell>
                  {vehicle.monthlyRentalCost != null
                    ? formatEur(Number(vehicle.monthlyRentalCost))
                    : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={statusColors[vehicle.status]}>
                    {statusLabels[vehicle.status] || vehicle.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/vehicles/${vehicle.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/vehicles/${vehicle.id}?edit=true`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
