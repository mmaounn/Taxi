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

interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  status: string;
  commissionModel: string;
  commissionRate: number | null;
  vehicle: { licensePlate: string } | null;
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  INACTIVE: "bg-gray-100 text-gray-800",
  SUSPENDED: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  ACTIVE: "Aktiv",
  INACTIVE: "Inaktiv",
  SUSPENDED: "Gesperrt",
};

export function DriverTable({ drivers }: { drivers: Driver[] }) {
  if (drivers.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-gray-500">
        Keine Fahrer gefunden.
      </div>
    );
  }

  return (
    <>
      {/* Mobile: Card view */}
      <div className="space-y-3 md:hidden">
        {drivers.map((driver) => (
          <Card key={driver.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="font-medium">
                    {driver.firstName} {driver.lastName}
                  </p>
                  {driver.email && (
                    <p className="text-sm text-gray-500">{driver.email}</p>
                  )}
                  {driver.phone && (
                    <p className="text-sm text-gray-500">{driver.phone}</p>
                  )}
                </div>
                <Badge variant="secondary" className={statusColors[driver.status]}>
                  {statusLabels[driver.status] || driver.status}
                </Badge>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
                <div className="space-y-0.5">
                  {driver.vehicle && (
                    <p>Fahrzeug: {driver.vehicle.licensePlate}</p>
                  )}
                  <p>
                    Provision:{" "}
                    {driver.commissionModel === "PERCENTAGE" && driver.commissionRate
                      ? `${driver.commissionRate}%`
                      : driver.commissionModel}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/drivers/${driver.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/drivers/${driver.id}?edit=true`}>
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
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>Fahrzeug</TableHead>
              <TableHead>Provision</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drivers.map((driver) => (
              <TableRow key={driver.id}>
                <TableCell className="font-medium">
                  {driver.firstName} {driver.lastName}
                </TableCell>
                <TableCell>{driver.email || "—"}</TableCell>
                <TableCell>{driver.phone || "—"}</TableCell>
                <TableCell>{driver.vehicle?.licensePlate || "—"}</TableCell>
                <TableCell>
                  {driver.commissionModel === "PERCENTAGE" && driver.commissionRate
                    ? `${driver.commissionRate}%`
                    : driver.commissionModel}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={statusColors[driver.status]}>
                    {statusLabels[driver.status] || driver.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/drivers/${driver.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/drivers/${driver.id}?edit=true`}>
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
