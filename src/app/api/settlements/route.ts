import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { settlementCreateSchema } from "@/lib/validators/settlement";
import { createOrUpdateSettlement } from "@/lib/settlement/engine";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.partnerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const driverId = searchParams.get("driverId");
  const status = searchParams.get("status");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Record<string, unknown> = {
    partnerId: session.user.partnerId,
  };

  // If driver role, only show own settlements
  if (session.user.role === "DRIVER" && session.user.driverId) {
    where.driverId = session.user.driverId;
  } else if (driverId) {
    where.driverId = driverId;
  }

  if (status) where.status = status;
  if (from) where.periodStart = { gte: new Date(from) };
  if (to) where.periodEnd = { lte: new Date(to) };

  const settlements = await db.settlement.findMany({
    where,
    include: {
      driver: { select: { firstName: true, lastName: true } },
    },
    orderBy: { periodEnd: "desc" },
  });

  return NextResponse.json(settlements);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.partnerId || session.user.role === "DRIVER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = settlementCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { driverId, periodStart, periodEnd, batch } = parsed.data;
  const partnerId = session.user.partnerId;

  try {
    if (batch) {
      // Calculate for all active drivers
      const drivers = await db.driver.findMany({
        where: { partnerId, status: "ACTIVE" },
      });

      const results: { driverId: string; settlementId: string; name: string }[] = [];
      const errors: { driverId: string; name: string; error: string }[] = [];

      for (const driver of drivers) {
        try {
          const settlementId = await createOrUpdateSettlement({
            driverId: driver.id,
            partnerId,
            periodStart: new Date(periodStart),
            periodEnd: new Date(periodEnd),
          });
          results.push({
            driverId: driver.id,
            settlementId,
            name: `${driver.firstName} ${driver.lastName}`,
          });
        } catch (e) {
          errors.push({
            driverId: driver.id,
            name: `${driver.firstName} ${driver.lastName}`,
            error: String(e),
          });
        }
      }

      return NextResponse.json({ results, errors });
    }

    // Single driver calculation
    const settlementId = await createOrUpdateSettlement({
      driverId,
      partnerId,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
    });

    const settlement = await db.settlement.findUnique({
      where: { id: settlementId },
      include: {
        driver: { select: { firstName: true, lastName: true } },
      },
    });

    return NextResponse.json(settlement, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: `Settlement calculation failed: ${e}` },
      { status: 500 }
    );
  }
}
