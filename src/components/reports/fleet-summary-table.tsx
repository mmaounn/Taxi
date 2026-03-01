"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SummaryRow {
  settlementId: string;
  driverName: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  totalPlatformNet: number;
  partnerCommission: number;
  vehicleRental: number;
  lineItemsTotal: number;
  driverNetEarnings: number;
  cashCollected: number;
  payoutAmount: number;
}

interface Totals {
  totalPlatformNet: number;
  partnerCommission: number;
  vehicleRental: number;
  lineItemsTotal: number;
  driverNetEarnings: number;
  cashCollected: number;
  payoutAmount: number;
}

import { formatEur } from "@/lib/format";

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  CALCULATED: "bg-blue-100 text-blue-800",
  APPROVED: "bg-green-100 text-green-800",
  PAID: "bg-emerald-100 text-emerald-800",
  DISPUTED: "bg-red-100 text-red-800",
};

export function FleetSummaryTable({
  rows,
  totals,
}: {
  rows: SummaryRow[];
  totals: Totals;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-gray-500">
        No settlements found for the selected period.
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Driver</TableHead>
            <TableHead>Period</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Platform Net</TableHead>
            <TableHead className="text-right">Commission</TableHead>
            <TableHead className="text-right">Vehicle</TableHead>
            <TableHead className="text-right">Line Items</TableHead>
            <TableHead className="text-right">Driver Net</TableHead>
            <TableHead className="text-right">Cash</TableHead>
            <TableHead className="text-right">Payout</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.settlementId}>
              <TableCell className="font-medium whitespace-nowrap">
                {row.driverName}
              </TableCell>
              <TableCell className="text-xs whitespace-nowrap">
                {new Date(row.periodStart).toLocaleDateString("de-AT")} —{" "}
                {new Date(row.periodEnd).toLocaleDateString("de-AT")}
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={statusColors[row.status]}
                >
                  {row.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">{formatEur(row.totalPlatformNet)}</TableCell>
              <TableCell className="text-right text-red-600">
                -{formatEur(row.partnerCommission)}
              </TableCell>
              <TableCell className="text-right text-red-600">
                -{formatEur(row.vehicleRental)}
              </TableCell>
              <TableCell className={`text-right ${row.lineItemsTotal >= 0 ? "text-green-600" : "text-red-600"}`}>
                {row.lineItemsTotal >= 0 ? "+" : ""}{formatEur(row.lineItemsTotal)}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatEur(row.driverNetEarnings)}
              </TableCell>
              <TableCell className="text-right">
                {formatEur(row.cashCollected)}
              </TableCell>
              <TableCell
                className={`text-right font-medium ${
                  row.payoutAmount >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatEur(row.payoutAmount)}
              </TableCell>
            </TableRow>
          ))}
          {/* Totals Row */}
          <TableRow className="bg-gray-50 font-bold border-t-2">
            <TableCell>TOTAL</TableCell>
            <TableCell></TableCell>
            <TableCell></TableCell>
            <TableCell className="text-right">{formatEur(totals.totalPlatformNet)}</TableCell>
            <TableCell className="text-right text-red-600">
              -{formatEur(totals.partnerCommission)}
            </TableCell>
            <TableCell className="text-right text-red-600">
              -{formatEur(totals.vehicleRental)}
            </TableCell>
            <TableCell className={`text-right ${totals.lineItemsTotal >= 0 ? "text-green-600" : "text-red-600"}`}>
              {totals.lineItemsTotal >= 0 ? "+" : ""}{formatEur(totals.lineItemsTotal)}
            </TableCell>
            <TableCell className="text-right">{formatEur(totals.driverNetEarnings)}</TableCell>
            <TableCell className="text-right">{formatEur(totals.cashCollected)}</TableCell>
            <TableCell
              className={`text-right ${
                totals.payoutAmount >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {formatEur(totals.payoutAmount)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
