"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

function formatEur(val: number | null | undefined): string {
  if (val == null) return "€0.00";
  return `€${Number(val).toFixed(2)}`;
}

interface BreakdownProps {
  settlement: {
    boltGrossRevenue: number | null;
    boltCommission: number | null;
    boltCashServiceFee: number | null;
    boltTips: number | null;
    boltBonuses: number | null;
    boltReimbursements: number | null;
    boltNetAmount: number | null;
    uberGrossRevenue: number | null;
    uberServiceFee: number | null;
    uberCityFees: number | null;
    uberTips: number | null;
    uberPromotions: number | null;
    uberNetAmount: number | null;
    freenowGrossRevenue: number | null;
    freenowCommission: number | null;
    freenowTips: number | null;
    freenowBonuses: number | null;
    freenowNetAmount: number | null;
    totalPlatformNet: number | null;
    partnerCommissionAmount: number | null;
    vehicleRentalDeduction: number | null;
    fuelCostDeduction: number | null;
    insuranceDeduction: number | null;
    cashCollectedByDriver: number | null;
    driverNetEarnings: number | null;
    payoutAmount: number | null;
  };
}

function Row({ label, value, negative }: { label: string; value: string; negative?: boolean }) {
  return (
    <div className="flex justify-between py-1 text-sm">
      <span className="text-gray-600">{label}</span>
      <span className={negative ? "text-red-600" : ""}>{negative ? `-${value}` : value}</span>
    </div>
  );
}

function TotalRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between border-t py-2 text-sm font-semibold">
      <span>{label}</span>
      <span className={highlight ? (value.startsWith("-") || value.startsWith("−") ? "text-red-600 text-base" : "text-green-600 text-base") : ""}>{value}</span>
    </div>
  );
}

export function SettlementBreakdown({ settlement: s }: BreakdownProps) {
  const hasBolt = Number(s.boltGrossRevenue || 0) > 0;
  const hasUber = Number(s.uberGrossRevenue || 0) > 0;
  const hasFreeNow = Number(s.freenowGrossRevenue || 0) > 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {hasBolt && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                Bolt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Row label="Gross Revenue" value={formatEur(s.boltGrossRevenue)} />
              <Row label="Commission" value={formatEur(s.boltCommission)} negative />
              <Row label="Cash Service Fee" value={formatEur(s.boltCashServiceFee)} negative />
              <Row label="Tips" value={formatEur(s.boltTips)} />
              <Row label="Bonuses" value={formatEur(s.boltBonuses)} />
              <TotalRow label="Net" value={formatEur(s.boltNetAmount)} />
            </CardContent>
          </Card>
        )}

        {hasUber && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <div className="h-3 w-3 rounded-full bg-black" />
                Uber
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Row label="Gross Revenue" value={formatEur(s.uberGrossRevenue)} />
              <Row label="Service Fee" value={formatEur(s.uberServiceFee)} negative />
              <Row label="City Fees" value={formatEur(s.uberCityFees)} negative />
              <Row label="Tips" value={formatEur(s.uberTips)} />
              <Row label="Promotions" value={formatEur(s.uberPromotions)} />
              <TotalRow label="Net" value={formatEur(s.uberNetAmount)} />
            </CardContent>
          </Card>
        )}

        {hasFreeNow && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                FreeNow
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Row label="Gross Revenue" value={formatEur(s.freenowGrossRevenue)} />
              <Row label="Commission" value={formatEur(s.freenowCommission)} negative />
              <Row label="Tips" value={formatEur(s.freenowTips)} />
              <Row label="Bonuses" value={formatEur(s.freenowBonuses)} />
              <TotalRow label="Net" value={formatEur(s.freenowNetAmount)} />
            </CardContent>
          </Card>
        )}

        {!hasBolt && !hasUber && !hasFreeNow && (
          <div className="col-span-3 rounded-md border p-8 text-center text-gray-500">
            No platform data for this period
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Deductions & Payout</CardTitle>
        </CardHeader>
        <CardContent>
          <Row label="Total Platform Net" value={formatEur(s.totalPlatformNet)} />
          <Separator className="my-2" />
          <Row label="Partner Commission" value={formatEur(s.partnerCommissionAmount)} negative />
          <Row label="Vehicle Rental" value={formatEur(s.vehicleRentalDeduction)} negative />
          <Row label="Insurance" value={formatEur(s.insuranceDeduction)} negative />
          <Row label="Fuel Costs" value={formatEur(s.fuelCostDeduction)} negative />
          <TotalRow label="Driver Net Earnings" value={formatEur(s.driverNetEarnings)} />
          <Separator className="my-2" />
          <Row label="Cash Collected by Driver" value={formatEur(s.cashCollectedByDriver)} negative />
          <TotalRow label="Payout Amount" value={formatEur(s.payoutAmount)} highlight />
        </CardContent>
      </Card>
    </div>
  );
}
