"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye } from "lucide-react";
import { formatEurOrDash } from "@/lib/format";

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

const statusLabels: Record<string, string> = {
  DRAFT: "Entwurf",
  CALCULATED: "Berechnet",
  APPROVED: "Genehmigt",
  PAID: "Bezahlt",
  DISPUTED: "Strittig",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("de-AT");
}

export function SettlementTable({
  settlements,
  basePath = "/settlements",
  selectable = false,
  selectedIds,
  onSelectionChange,
}: {
  settlements: Settlement[];
  basePath?: string;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
}) {
  if (settlements.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-gray-500">
        Keine Abrechnungen gefunden.
      </div>
    );
  }

  const allSelected =
    selectable &&
    selectedIds &&
    settlements.length > 0 &&
    settlements.every((s) => selectedIds.has(s.id));

  function toggleAll() {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(settlements.map((s) => s.id)));
    }
  }

  function toggleOne(id: string) {
    if (!onSelectionChange || !selectedIds) return;
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onSelectionChange(next);
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {selectable && (
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
            )}
            <TableHead>Zeitraum</TableHead>
            <TableHead>Fahrer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Plattform netto</TableHead>
            <TableHead className="text-right">Provision</TableHead>
            <TableHead className="text-right">Auszahlung</TableHead>
            <TableHead className="w-[80px]">Aktionen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {settlements.map((s) => (
            <TableRow key={s.id}>
              {selectable && (
                <TableCell>
                  <Checkbox
                    checked={selectedIds?.has(s.id) ?? false}
                    onCheckedChange={() => toggleOne(s.id)}
                  />
                </TableCell>
              )}
              <TableCell className="text-sm">
                {formatDate(s.periodStart)} — {formatDate(s.periodEnd)}
              </TableCell>
              <TableCell className="font-medium">
                {s.driver.firstName} {s.driver.lastName}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className={statusColors[s.status]}>
                  {statusLabels[s.status] || s.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {formatEurOrDash(s.totalPlatformNet)}
              </TableCell>
              <TableCell className="text-right">
                {formatEurOrDash(s.partnerCommissionAmount)}
              </TableCell>
              <TableCell
                className={`text-right font-medium ${
                  Number(s.payoutAmount || 0) >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {formatEurOrDash(s.payoutAmount)}
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
