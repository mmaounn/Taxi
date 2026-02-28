import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getFleetOrders } from "@/lib/integrations/bolt/client";
import { mapBoltOrders } from "@/lib/integrations/bolt/mapper";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.partnerId || session.user.role === "DRIVER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { dateFrom, dateTo } = body;

  if (!dateFrom || !dateTo) {
    return NextResponse.json({ error: "dateFrom and dateTo are required" }, { status: 400 });
  }

  const syncLog = await db.syncLog.create({
    data: {
      partnerId: session.user.partnerId,
      platform: "BOLT",
      syncType: "api",
    },
  });

  try {
    const orders = await getFleetOrders(session.user.partnerId, dateFrom, dateTo);
    const mappedRides = mapBoltOrders(orders);

    // Find drivers by Bolt driver ID
    const drivers = await db.driver.findMany({
      where: {
        partnerId: session.user.partnerId,
        boltDriverId: { not: null },
      },
    });
    const driverMap = new Map(drivers.map((d) => [d.boltDriverId!, d.id]));

    let imported = 0;
    const errors: { message: string; detail?: string }[] = [];

    for (const ride of mappedRides) {
      const driverId = driverMap.get(ride.driverExternalId);
      if (!driverId) {
        errors.push({
          message: `Unknown Bolt driver: ${ride.driverExternalId}`,
          detail: `Order ${ride.externalOrderId}`,
        });
        continue;
      }

      try {
        await db.rideData.upsert({
          where: {
            source_externalOrderId: {
              source: "BOLT",
              externalOrderId: ride.externalOrderId,
            },
          },
          create: {
            driverId,
            source: ride.source,
            externalOrderId: ride.externalOrderId,
            pickupAddress: ride.pickupAddress,
            dropoffAddress: ride.dropoffAddress,
            distanceKm: ride.distanceKm,
            startedAt: ride.startedAt,
            completedAt: ride.completedAt,
            fareAmount: ride.fareAmount,
            paymentMethod: ride.paymentMethod,
            tipAmount: ride.tipAmount,
            platformCommissionAmount: ride.platformCommissionAmount,
            status: ride.status,
          },
          update: {
            fareAmount: ride.fareAmount,
            tipAmount: ride.tipAmount,
            platformCommissionAmount: ride.platformCommissionAmount,
            status: ride.status,
          },
        });
        imported++;
      } catch (e) {
        errors.push({
          message: `Failed to import ride ${ride.externalOrderId}`,
          detail: String(e),
        });
      }
    }

    await db.syncLog.update({
      where: { id: syncLog.id },
      data: {
        recordsImported: imported,
        errors: errors.length > 0 ? errors : undefined,
        completedAt: new Date(),
        status: "completed",
      },
    });

    return NextResponse.json({ imported, errors, total: mappedRides.length });
  } catch (e) {
    await db.syncLog.update({
      where: { id: syncLog.id },
      data: {
        errors: [{ message: String(e) }],
        completedAt: new Date(),
        status: "failed",
      },
    });

    return NextResponse.json(
      { error: `Bolt sync failed: ${e}` },
      { status: 500 }
    );
  }
}
