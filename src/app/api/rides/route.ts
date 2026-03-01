import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.partnerId || session.user.role === "DRIVER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 15)));
  const source = searchParams.get("source");
  const driverId = searchParams.get("driverId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const payment = searchParams.get("payment");

  const where: Record<string, unknown> = {
    driver: { partnerId: session.user.partnerId },
  };

  if (source) where.source = source;
  if (driverId) where.driverId = driverId;
  if (payment) where.paymentMethod = payment;
  if (from || to) {
    where.completedAt = {};
    if (from) (where.completedAt as Record<string, unknown>).gte = new Date(from);
    if (to) (where.completedAt as Record<string, unknown>).lte = new Date(to + "T23:59:59");
  }

  const [rides, total, aggregates] = await Promise.all([
    db.rideData.findMany({
      where,
      include: {
        driver: { select: { firstName: true, lastName: true } },
      },
      orderBy: { completedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.rideData.count({ where }),
    db.rideData.aggregate({
      where,
      _sum: {
        distanceKm: true,
        fareAmount: true,
        tipAmount: true,
        platformCommissionAmount: true,
      },
    }),
  ]);

  return NextResponse.json({
    rides: rides.map((r) => ({
      id: r.id,
      driverName: `${r.driver.firstName} ${r.driver.lastName}`,
      source: r.source,
      pickupAddress: r.pickupAddress,
      dropoffAddress: r.dropoffAddress,
      distanceKm: r.distanceKm ? Number(r.distanceKm) : null,
      completedAt: r.completedAt?.toISOString() || null,
      fareAmount: r.fareAmount ? Number(r.fareAmount) : null,
      tipAmount: r.tipAmount ? Number(r.tipAmount) : null,
      platformCommission: r.platformCommissionAmount ? Number(r.platformCommissionAmount) : null,
      paymentMethod: r.paymentMethod,
      status: r.status,
    })),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    totals: {
      distanceKm: aggregates._sum.distanceKm ? Number(aggregates._sum.distanceKm) : 0,
      fareAmount: aggregates._sum.fareAmount ? Number(aggregates._sum.fareAmount) : 0,
      tipAmount: aggregates._sum.tipAmount ? Number(aggregates._sum.tipAmount) : 0,
      platformCommission: aggregates._sum.platformCommissionAmount ? Number(aggregates._sum.platformCommissionAmount) : 0,
    },
  });
}
