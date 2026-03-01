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

export function VehicleTable({ vehicles }: { vehicles: Vehicle[] }) {
  if (vehicles.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-gray-500">
        No vehicles found. Add your first vehicle to get started.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>License Plate</TableHead>
            <TableHead>Make / Model</TableHead>
            <TableHead>Year</TableHead>
            <TableHead>Assigned Driver</TableHead>
            <TableHead>Monthly Cost</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
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
                  {vehicle.status}
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
  );
}
