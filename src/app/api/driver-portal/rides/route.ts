import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.driverId || session.user.role !== "DRIVER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "15")));
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const source = searchParams.get("source");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    driverId: session.user.driverId,
    status: "COMPLETED",
  };

  if (from || to) {
    where.completedAt = {};
    if (from) where.completedAt.gte = new Date(from);
    if (to) where.completedAt.lte = new Date(to);
  }

  if (source && ["BOLT", "UBER", "FREENOW"].includes(source)) {
    where.source = source;
  }

  const [rides, total] = await Promise.all([
    db.rideData.findMany({
      where,
      orderBy: { completedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        source: true,
        pickupAddress: true,
        dropoffAddress: true,
        fareAmount: true,
        tipAmount: true,
        paymentMethod: true,
        completedAt: true,
        distanceKm: true,
      },
    }),
    db.rideData.count({ where }),
  ]);

  return NextResponse.json({
    rides: rides.map((r) => ({
      ...r,
      fareAmount: Number(r.fareAmount || 0),
      tipAmount: Number(r.tipAmount || 0),
      distanceKm: r.distanceKm ? Number(r.distanceKm) : null,
      completedAt: r.completedAt?.toISOString() || null,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
