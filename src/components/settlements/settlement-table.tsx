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
import { Eye } from "lucide-react";

interface Settlement {
  id: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  totalPlatformNet: number | null;
  partnerCommissionAmount: number | null;
  payoutAmount: number | null;
  driver: { firstName: string; lastName: string };
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  CALCULATED: "bg-blue-100 text-blue-800",
  APPROVED: "bg-green-100 text-green-800",
  PAID: "bg-emerald-100 text-emerald-800",
  DISPUTED: "bg-red-100 text-red-800",
};

function formatEur(val: number | null): string {
  if (val == null) return "—";
  return `€${Number(val).toFixed(2)}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("de-AT");
}

export function SettlementTable({
  settlements,
  basePath = "/settlements",
}: {
  settlements: Settlement[];
  basePath?: string;
}) {
  if (settlements.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-gray-500">
        No settlements found.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Period</TableHead>
            <TableHead>Driver</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Platform Net</TableHead>
            <TableHead className="text-right">Commission</TableHead>
            <TableHead className="text-right">Payout</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {settlements.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="text-sm">
                {formatDate(s.periodStart)} — {formatDate(s.periodEnd)}
              </TableCell>
              <TableCell className="font-medium">
                {s.driver.firstName} {s.driver.lastName}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className={statusColors[s.status]}>
                  {s.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {formatEur(s.totalPlatformNet)}
              </TableCell>
              <TableCell className="text-right">
                {formatEur(s.partnerCommissionAmount)}
              </TableCell>
              <TableCell
                className={`text-right font-medium ${
                  Number(s.payoutAmount || 0) >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {formatEur(s.payoutAmount)}
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`${basePath}/${s.id}`}>
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
