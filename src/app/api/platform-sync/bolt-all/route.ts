import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getFleetDrivers, getFleetVehicles, getFleetOrders } from "@/lib/integrations/bolt/client";
import { mapBoltOrders } from "@/lib/integrations/bolt/mapper";

export async function POST() {
  const session = await auth();
  if (!session?.user?.partnerId || session.user.role === "DRIVER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const partnerId = session.user.partnerId;

  // Check if Bolt credentials are configured
  const partner = await db.partner.findUnique({ where: { id: partnerId } });
  if (!partner?.boltClientId || !partner?.boltClientSecret) {
    return NextResponse.json({ error: "Bolt API not configured" }, { status: 400 });
  }

  const syncLog = await db.syncLog.create({
    data: { partnerId, platform: "BOLT", syncType: "api" },
  });

  const results = {
    driversImported: 0,
    vehiclesImported: 0,
    ridesImported: 0,
    errors: [] as { message: string; detail?: string }[],
  };

  try {
    // 1. Sync drivers and vehicles
    const [boltDrivers, boltVehicles] = await Promise.all([
      getFleetDrivers(partnerId),
      getFleetVehicles(partnerId),
    ]);

    // Sync vehicles first
    for (const bv of boltVehicles) {
      try {
        const existing = await db.vehicle.findFirst({
          where: { partnerId, licensePlate: bv.reg_number },
        });

        if (existing) {
          // Only fill in blanks, never overwrite existing local values
          await db.vehicle.update({
            where: { id: existing.id },
            data: {
              make: existing.make || bv.model.split(" ")[0] || bv.model,
              model: existing.model || bv.model,
              year: existing.year ?? (bv.year || undefined),
              color: existing.color || bv.color || undefined,
              status: bv.state === "active" ? "ACTIVE" as const : "DECOMMISSIONED" as const,
            },
          });
        } else {
          await db.vehicle.create({
            data: {
              partnerId,
              licensePlate: bv.reg_number,
              make: bv.model.split(" ")[0] || bv.model,
              model: bv.model,
              year: bv.year || undefined,
              color: bv.color || undefined,
              status: bv.state === "active" ? "ACTIVE" as const : "DECOMMISSIONED" as const,
            },
          });
        }
        results.vehiclesImported++;
      } catch (e) {
        results.errors.push({ message: `Vehicle ${bv.reg_number}`, detail: String(e) });
      }
    }

    // Sync drivers
    for (const bd of boltDrivers) {
      try {
        if (!bd.driver_uuid) continue;

        const existing = await db.driver.findFirst({
          where: { partnerId, boltDriverId: bd.driver_uuid },
        });

        let vehicleId: string | undefined;
        if (bd.active_vehicle?.reg_number) {
          const v = await db.vehicle.findFirst({
            where: { partnerId, licensePlate: bd.active_vehicle.reg_number },
          });
          if (v) vehicleId = v.id;
        }

        const statusMap: Record<string, "ACTIVE" | "INACTIVE" | "SUSPENDED"> = {
          active: "ACTIVE", suspended: "SUSPENDED", deactivated: "INACTIVE",
        };

        if (existing) {
          // Only update fields that haven't been manually edited locally
          // (i.e. only fill in blanks, never overwrite existing local values)
          await db.driver.update({
            where: { id: existing.id },
            data: {
              firstName: existing.firstName || bd.first_name || existing.firstName,
              lastName: existing.lastName || bd.last_name || existing.lastName,
              email: existing.email || bd.email || existing.email,
              phone: existing.phone || bd.phone || existing.phone,
              status: statusMap[bd.state] || existing.status,
              vehicleId: vehicleId || existing.vehicleId,
            },
          });
        } else {
          await db.driver.create({
            data: {
              partnerId,
              firstName: bd.first_name || "Unknown",
              lastName: bd.last_name || "Driver",
              email: bd.email,
              phone: bd.phone || undefined,
              boltDriverId: bd.driver_uuid,
              status: statusMap[bd.state] || "ACTIVE",
              commissionModel: "PERCENTAGE",
              commissionRate: 25,
              vehicleId: vehicleId || undefined,
            },
          });
        }
        results.driversImported++;
      } catch (e) {
        results.errors.push({ message: `Driver ${bd.first_name} ${bd.last_name}`, detail: String(e) });
      }
    }

    // 2. Sync rides for the current week (Monday to now)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);

    try {
      const orders = await getFleetOrders(partnerId, monday.toISOString(), now.toISOString());
      const mappedRides = mapBoltOrders(orders);

      const drivers = await db.driver.findMany({
        where: { partnerId, boltDriverId: { not: null } },
      });
      const driverMap = new Map(drivers.map((d) => [d.boltDriverId!, d.id]));

      for (const ride of mappedRides) {
        const driverId = driverMap.get(ride.driverExternalId);
        if (!driverId) continue;

        try {
          await db.rideData.upsert({
            where: {
              source_externalOrderId: { source: "BOLT", externalOrderId: ride.externalOrderId },
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
          results.ridesImported++;
        } catch (e) {
          results.errors.push({ message: `Ride ${ride.externalOrderId}`, detail: String(e) });
        }
      }
    } catch (e) {
      results.errors.push({ message: "Ride sync failed", detail: String(e) });
    }

    await db.syncLog.update({
      where: { id: syncLog.id },
      data: {
        recordsImported: results.driversImported + results.vehiclesImported + results.ridesImported,
        errors: results.errors.length > 0 ? results.errors : undefined,
        completedAt: new Date(),
        status: "completed",
      },
    });

    return NextResponse.json(results);
  } catch (e) {
    await db.syncLog.update({
      where: { id: syncLog.id },
      data: {
        errors: [{ message: String(e) }],
        completedAt: new Date(),
        status: "failed",
      },
    });

    return NextResponse.json({ error: `Bolt sync failed: ${e}` }, { status: 500 });
  }
}
