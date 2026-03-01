import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

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
      lineItems: true,
    },
    orderBy: [
      { driver: { lastName: "asc" } },
      { periodStart: "asc" },
    ],
  });

  const rows = settlements.map((s) => ({
    settlementId: s.id,
    driverName: `${s.driver.firstName} ${s.driver.lastName}`,
    periodStart: s.periodStart.toISOString(),
    periodEnd: s.periodEnd.toISOString(),
    status: s.status,
    totalPlatformNet: Number(s.totalPlatformNet || 0),
    partnerCommission: Number(s.partnerCommissionAmount || 0),
    vehicleRental: Number(s.vehicleRentalDeduction || 0),
    insurance: Number(s.insuranceDeduction || 0),
    lineItemsTotal: Number(s.lineItemsTotal || 0),
    driverNetEarnings: Number(s.driverNetEarnings || 0),
    cashCollected: Number(s.cashCollectedByDriver || 0),
    payoutAmount: Number(s.payoutAmount || 0),
  }));

  // Totals
  const totals = rows.reduce(
    (acc, r) => ({
      totalPlatformNet: acc.totalPlatformNet + r.totalPlatformNet,
      partnerCommission: acc.partnerCommission + r.partnerCommission,
      vehicleRental: acc.vehicleRental + r.vehicleRental,
      insurance: acc.insurance + r.insurance,
      lineItemsTotal: acc.lineItemsTotal + r.lineItemsTotal,
      driverNetEarnings: acc.driverNetEarnings + r.driverNetEarnings,
      cashCollected: acc.cashCollected + r.cashCollected,
      payoutAmount: acc.payoutAmount + r.payoutAmount,
    }),
    {
      totalPlatformNet: 0,
      partnerCommission: 0,
      vehicleRental: 0,
      insurance: 0,
      lineItemsTotal: 0,
      driverNetEarnings: 0,
      cashCollected: 0,
      payoutAmount: 0,
    }
  );

  return NextResponse.json({
    periodStart,
    periodEnd,
    rows,
    totals,
    driverCount: new Set(rows.map((r) => r.driverName)).size,
  });
}
