import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatEurCsv } from "@/lib/format";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.partnerId || session.user.role === "DRIVER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const periodStart = searchParams.get("periodStart");
  const periodEnd = searchParams.get("periodEnd");

  if (!periodStart || !periodEnd) {
    return NextResponse.json(
      { error: "periodStart and periodEnd are required" },
      { status: 400 }
    );
  }

  const settlements = await db.settlement.findMany({
    where: {
      partnerId: session.user.partnerId,
      periodStart: { gte: new Date(periodStart) },
      periodEnd: { lte: new Date(periodEnd) },
    },
    include: {
      driver: { select: { firstName: true, lastName: true } },
    },
    orderBy: [
      { driver: { lastName: "asc" } },
      { periodStart: "asc" },
    ],
  });

  // CSV header
  const headers = [
    "Driver",
    "Period Start",
    "Period End",
    "Status",
    "Platform Net",
    "Commission",
    "Vehicle Rental",
    "Insurance",
    "Line Items",
    "Driver Net",
    "Cash Collected",
    "Payout",
  ];

  const rows = settlements.map((s) => [
    `${s.driver.firstName} ${s.driver.lastName}`,
    new Date(s.periodStart).toLocaleDateString("de-AT"),
    new Date(s.periodEnd).toLocaleDateString("de-AT"),
    s.status,
    formatEurCsv(Number(s.totalPlatformNet || 0)),
    formatEurCsv(Number(s.partnerCommissionAmount || 0)),
    formatEurCsv(Number(s.vehicleRentalDeduction || 0)),
    formatEurCsv(Number(s.insuranceDeduction || 0)),
    formatEurCsv(Number(s.lineItemsTotal || 0)),
    formatEurCsv(Number(s.driverNetEarnings || 0)),
    formatEurCsv(Number(s.cashCollectedByDriver || 0)),
    formatEurCsv(Number(s.payoutAmount || 0)),
  ]);

  // Totals row
  const totals = settlements.reduce(
    (acc, s) => ({
      platformNet: acc.platformNet + Number(s.totalPlatformNet || 0),
      commission: acc.commission + Number(s.partnerCommissionAmount || 0),
      vehicleRental: acc.vehicleRental + Number(s.vehicleRentalDeduction || 0),
      insurance: acc.insurance + Number(s.insuranceDeduction || 0),
      lineItems: acc.lineItems + Number(s.lineItemsTotal || 0),
      driverNet: acc.driverNet + Number(s.driverNetEarnings || 0),
      cash: acc.cash + Number(s.cashCollectedByDriver || 0),
      payout: acc.payout + Number(s.payoutAmount || 0),
    }),
    { platformNet: 0, commission: 0, vehicleRental: 0, insurance: 0, lineItems: 0, driverNet: 0, cash: 0, payout: 0 }
  );

  rows.push([
    "TOTAL",
    "",
    "",
    "",
    formatEurCsv(totals.platformNet),
    formatEurCsv(totals.commission),
    formatEurCsv(totals.vehicleRental),
    formatEurCsv(totals.insurance),
    formatEurCsv(totals.lineItems),
    formatEurCsv(totals.driverNet),
    formatEurCsv(totals.cash),
    formatEurCsv(totals.payout),
  ]);

  const csvContent = [
    headers.join(";"),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(";")),
  ].join("\n");

  const filename = `fleet_summary_${periodStart}_${periodEnd}.csv`;

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
