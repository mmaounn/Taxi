import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.partnerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const partnerId = session.user.partnerId;

  // Active drivers count
  const activeDrivers = await db.driver.count({
    where: { partnerId, status: "ACTIVE" },
  });

  // Current week boundaries (Monday to Sunday)
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  // This week's revenue from settlements
  const weekSettlements = await db.settlement.findMany({
    where: {
      partnerId,
      periodStart: { gte: monday },
      periodEnd: { lte: sunday },
    },
  });

  const totalRevenue = weekSettlements.reduce(
    (sum, s) => sum + Number(s.totalPlatformNet || 0),
    0
  );

  // Pending settlements (CALCULATED but not APPROVED/PAID)
  const pendingSettlements = await db.settlement.count({
    where: {
      partnerId,
      status: { in: ["DRAFT", "CALCULATED"] },
    },
  });

  // Cash outstanding
  const cashOutstanding = weekSettlements.reduce(
    (sum, s) => sum + Number(s.cashCollectedByDriver || 0),
    0
  );

  // Weekly revenue for chart (last 8 weeks)
  const weeklyRevenue = [];
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(monday);
    weekStart.setDate(weekStart.getDate() - i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const settlements = await db.settlement.findMany({
      where: {
        partnerId,
        periodStart: { gte: weekStart },
        periodEnd: { lte: weekEnd },
      },
    });

    const bolt = settlements.reduce((s, st) => s + Number(st.boltNetAmount || 0), 0);
    const uber = settlements.reduce((s, st) => s + Number(st.uberNetAmount || 0), 0);
    const freenow = settlements.reduce((s, st) => s + Number(st.freenowNetAmount || 0), 0);

    weeklyRevenue.push({
      week: weekStart.toLocaleDateString("de-AT", { month: "short", day: "numeric" }),
      bolt: Math.round(bolt * 100) / 100,
      uber: Math.round(uber * 100) / 100,
      freenow: Math.round(freenow * 100) / 100,
    });
  }

  // Recent settlements
  const recentSettlements = await db.settlement.findMany({
    where: { partnerId },
    include: { driver: { select: { firstName: true, lastName: true } } },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });

  return NextResponse.json({
    stats: {
      totalRevenue,
      activeDrivers,
      pendingSettlements,
      cashOutstanding,
    },
    weeklyRevenue,
    recentSettlements,
  });
}
