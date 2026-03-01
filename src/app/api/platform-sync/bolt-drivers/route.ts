import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getFleetDrivers, getFleetVehicles } from "@/lib/integrations/bolt/client";

export async function POST() {
  const session = await auth();
  if (!session?.user?.partnerId || session.user.role === "DRIVER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const partnerId = session.user.partnerId;

  const syncLog = await db.syncLog.create({
    data: {
      partnerId,
      platform: "BOLT",
      syncType: "api",
    },
  });

  try {
    // Fetch drivers and vehicles from Bolt
    const [boltDrivers, boltVehicles] = await Promise.all([
      getFleetDrivers(partnerId),
      getFleetVehicles(partnerId),
    ]);

    let driversImported = 0;
    let vehiclesImported = 0;
    const errors: { message: string; detail?: string }[] = [];

    // Sync vehicles first (drivers may reference them)
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
              status: bv.state === "active" ? "ACTIVE" : "DECOMMISSIONED",
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
              status: bv.state === "active" ? "ACTIVE" : "DECOMMISSIONED",
            },
          });
        }
        vehiclesImported++;
      } catch (e) {
        errors.push({
          message: `Failed to sync vehicle ${bv.reg_number}`,
          detail: String(e),
        });
      }
    }

    // Sync drivers
    for (const bd of boltDrivers) {
      try {
        const driverUuid = bd.driver_uuid;
        if (!driverUuid) {
          errors.push({ message: `Driver ${bd.first_name} ${bd.last_name} has no UUID` });
          continue;
        }

        // Check if driver already exists by Bolt UUID
        const existing = await db.driver.findFirst({
          where: { partnerId, boltDriverId: driverUuid },
        });

        // Try to find the vehicle if the driver has one assigned in Bolt
        let vehicleId: string | undefined;
        if (bd.active_vehicle?.reg_number) {
          const vehicle = await db.vehicle.findFirst({
            where: { partnerId, licensePlate: bd.active_vehicle.reg_number },
          });
          if (vehicle) vehicleId = vehicle.id;
        }

        const statusMap: Record<string, "ACTIVE" | "INACTIVE" | "SUSPENDED"> = {
          active: "ACTIVE",
          suspended: "SUSPENDED",
          deactivated: "INACTIVE",
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
              boltDriverId: driverUuid,
              status: statusMap[bd.state] || "ACTIVE",
              commissionModel: "PERCENTAGE",
              commissionRate: 25,
              vehicleId: vehicleId || undefined,
            },
          });
        }
        driversImported++;
      } catch (e) {
        errors.push({
          message: `Failed to sync driver ${bd.first_name} ${bd.last_name}`,
          detail: String(e),
        });
      }
    }

    await db.syncLog.update({
      where: { id: syncLog.id },
      data: {
        recordsImported: driversImported + vehiclesImported,
        errors: errors.length > 0 ? errors : undefined,
        completedAt: new Date(),
        status: "completed",
      },
    });

    return NextResponse.json({
      driversImported,
      vehiclesImported,
      driversTotal: boltDrivers.length,
      vehiclesTotal: boltVehicles.length,
      errors,
    });
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
      { error: `Bolt driver sync failed: ${e}` },
      { status: 500 }
    );
  }
}
