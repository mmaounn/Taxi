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

export function DriverTable({ drivers }: { drivers: Driver[] }) {
  if (drivers.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-gray-500">
        No drivers found. Add your first driver to get started.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead>Commission</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
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
                  {driver.status}
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
  );
}
