import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateDriverBalance } from "@/lib/settlement/balance";

export async function GET() {
  const session = await auth();
  if (!session?.user?.driverId || session.user.role !== "DRIVER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const driverId = session.user.driverId;

  // Get balance
  const balance = await calculateDriverBalance(driverId);

  // Get 8 weeks of income data by platform
  const eightWeeksAgo = new Date();
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

  const settlements = await db.settlement.findMany({
    where: {
      driverId,
      periodStart: { gte: eightWeeksAgo },
    },
    orderBy: { periodStart: "asc" },
    select: {
      periodStart: true,
      periodEnd: true,
      boltNetAmount: true,
      uberNetAmount: true,
      freenowNetAmount: true,
      driverNetEarnings: true,
      payoutAmount: true,
      status: true,
      id: true,
    },
  });

  // Get stats from rides
  const rides = await db.rideData.findMany({
    where: {
      driverId,
      completedAt: { gte: eightWeeksAgo },
      status: "COMPLETED",
    },
    select: {
      fareAmount: true,
      tipAmount: true,
      paymentMethod: true,
    },
  });

  const totalRides = rides.length;
  const totalFares = rides.reduce((sum, r) => sum + Number(r.fareAmount || 0), 0);
  const totalTips = rides.reduce((sum, r) => sum + Number(r.tipAmount || 0), 0);
  const cashCollected = rides
    .filter((r) => r.paymentMethod === "CASH")
    .reduce((sum, r) => sum + Number(r.fareAmount || 0), 0);
  const avgFare = totalRides > 0 ? totalFares / totalRides : 0;

  // Build weekly income data
  const weeklyIncome = settlements.map((s) => {
    const weekLabel = new Date(s.periodStart).toLocaleDateString("de-AT", {
      month: "short",
      day: "numeric",
    });
    return {
      week: weekLabel,
      bolt: Number(s.boltNetAmount || 0),
      uber: Number(s.uberNetAmount || 0),
      freenow: Number(s.freenowNetAmount || 0),
    };
  });

  // Latest settlement
  const latestSettlement = settlements.length > 0
    ? settlements[settlements.length - 1]
    : null;

  return NextResponse.json({
    balance: balance.currentBalance,
    stats: {
      totalRides,
      avgFare: Math.round(avgFare * 100) / 100,
      cashCollected: Math.round(cashCollected * 100) / 100,
      tips: Math.round(totalTips * 100) / 100,
    },
    weeklyIncome,
    latestSettlement: latestSettlement
      ? {
          id: latestSettlement.id,
          periodStart: latestSettlement.periodStart.toISOString(),
          periodEnd: latestSettlement.periodEnd.toISOString(),
          payoutAmount: Number(latestSettlement.payoutAmount || 0),
          status: latestSettlement.status,
        }
      : null,
  });
}
