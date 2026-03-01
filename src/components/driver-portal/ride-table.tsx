"use client";

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
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatEur } from "@/lib/format";

interface Ride {
  id: string;
  source: string;
  pickupAddress: string | null;
  dropoffAddress: string | null;
  fareAmount: number;
  tipAmount: number;
  paymentMethod: string | null;
  completedAt: string | null;
  distanceKm: number | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const sourceColors: Record<string, string> = {
  BOLT: "bg-green-100 text-green-800",
  UBER: "bg-gray-100 text-gray-800",
  FREENOW: "bg-red-100 text-red-800",
};

const paymentLabels: Record<string, string> = {
  CASH: "Bargeld",
  CARD: "Karte",
  IN_APP: "In-App",
};

export function RideTable({
  rides,
  pagination,
  onPageChange,
}: {
  rides: Ride[];
  pagination: Pagination;
  onPageChange: (page: number) => void;
}) {
  if (rides.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-gray-500">
        Keine Fahrten für die gewählten Filter gefunden.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Datum</TableHead>
              <TableHead>Plattform</TableHead>
              <TableHead>Abholung</TableHead>
              <TableHead>Ziel</TableHead>
              <TableHead className="text-right">Fahrpreis</TableHead>
              <TableHead className="text-right">Trinkgeld</TableHead>
              <TableHead>Zahlung</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rides.map((ride) => (
              <TableRow key={ride.id}>
                <TableCell className="text-xs whitespace-nowrap">
                  {ride.completedAt
                    ? new Date(ride.completedAt).toLocaleDateString("de-AT", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={sourceColors[ride.source] || ""}
                  >
                    {ride.source}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs max-w-[150px] truncate">
                  {ride.pickupAddress || "—"}
                </TableCell>
                <TableCell className="text-xs max-w-[150px] truncate">
                  {ride.dropoffAddress || "—"}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatEur(ride.fareAmount)}
                </TableCell>
                <TableCell className="text-right text-green-600">
                  {ride.tipAmount > 0 ? formatEur(ride.tipAmount) : "—"}
                </TableCell>
                <TableCell className="text-xs">
                  {ride.paymentMethod
                    ? paymentLabels[ride.paymentMethod] || ride.paymentMethod
                    : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {(pagination.page - 1) * pagination.limit + 1}–
          {Math.min(pagination.page * pagination.limit, pagination.total)} von{" "}
          {pagination.total} Fahrten
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Seite {pagination.page} von {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
