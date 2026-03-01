import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getFleetDrivers, getFleetVehicles, getFleetOrders } from "@/lib/integrations/bolt/client";
import { mapBoltOrders } from "@/lib/integrations/bolt/mapper";
import { createReport, getReportStatus, downloadReport } from "@/lib/integrations/uber/client";
import { parseUberCSV } from "@/lib/integrations/csv/uber-csv";

interface PlatformResult {
  platform: string;
  driversImported?: number;
  vehiclesImported?: number;
  ridesImported?: number;
  errors: { message: string; detail?: string }[];
}

async function syncBolt(partnerId: string): Promise<PlatformResult> {
  const result: PlatformResult = {
    platform: "BOLT",
    driversImported: 0,
    vehiclesImported: 0,
    ridesImported: 0,
    errors: [],
  };

  const syncLog = await db.syncLog.create({
    data: { partnerId, platform: "BOLT", syncType: "api" },
  });

  try {
    const [boltDrivers, boltVehicles] = await Promise.all([
      getFleetDrivers(partnerId),
      getFleetVehicles(partnerId),
    ]);

    // Sync vehicles
    for (const bv of boltVehicles) {
      try {
        const existing = await db.vehicle.findFirst({
          where: { partnerId, licensePlate: bv.reg_number },
        });

        if (existing) {
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
        result.vehiclesImported!++;
      } catch (e) {
        result.errors.push({ message: `Vehicle ${bv.reg_number}`, detail: String(e) });
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
        result.driversImported!++;
      } catch (e) {
        result.errors.push({ message: `Driver ${bd.first_name} ${bd.last_name}`, detail: String(e) });
      }
    }

    // Sync rides for the current week
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
          result.ridesImported!++;
        } catch (e) {
          result.errors.push({ message: `Ride ${ride.externalOrderId}`, detail: String(e) });
        }
      }
    } catch (e) {
      result.errors.push({ message: "Bolt ride sync failed", detail: String(e) });
    }

    await db.syncLog.update({
      where: { id: syncLog.id },
      data: {
        recordsImported: result.driversImported! + result.vehiclesImported! + result.ridesImported!,
        errors: result.errors.length > 0 ? result.errors : undefined,
        completedAt: new Date(),
        status: "completed",
      },
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
    result.errors.push({ message: `Bolt sync failed: ${e}` });
  }

  return result;
}

async function syncUber(partnerId: string, uberOrgId: string): Promise<PlatformResult> {
  const result: PlatformResult = {
    platform: "UBER",
    ridesImported: 0,
    errors: [],
  };

  const syncLog = await db.syncLog.create({
    data: { partnerId, platform: "UBER", syncType: "api" },
  });

  try {
    // Current week: Monday to now
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);

    const reportId = await createReport(partnerId, uberOrgId, monday.toISOString(), now.toISOString());

    // Poll for completion (max 60 seconds)
    let status = await getReportStatus(partnerId, uberOrgId, reportId);
    let attempts = 0;
    while (status.status !== "completed" && status.status !== "failed" && attempts < 12) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      status = await getReportStatus(partnerId, uberOrgId, reportId);
      attempts++;
    }

    if (status.status !== "completed" || !status.download_url) {
      throw new Error(`Uber report not ready after polling: status=${status.status}`);
    }

    const csvContent = await downloadReport(partnerId, status.download_url);
    const { rides, errors: parseErrors } = parseUberCSV(csvContent);

    result.errors.push(...parseErrors.map((e) => ({ message: e.message, detail: `Row ${e.row}` })));

    const drivers = await db.driver.findMany({
      where: { partnerId, uberDriverUuid: { not: null } },
    });
    const driverMap = new Map(drivers.map((d) => [d.uberDriverUuid!, d.id]));

    for (const ride of rides) {
      const driverId = driverMap.get(ride.driverExternalId);
      if (!driverId) continue;

      try {
        await db.rideData.upsert({
          where: {
            source_externalOrderId: { source: "UBER", externalOrderId: ride.externalOrderId },
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
        result.ridesImported!++;
      } catch (e) {
        result.errors.push({ message: `Trip ${ride.externalOrderId}`, detail: String(e) });
      }
    }

    await db.syncLog.update({
      where: { id: syncLog.id },
      data: {
        recordsImported: result.ridesImported!,
        errors: result.errors.length > 0 ? result.errors : undefined,
        completedAt: new Date(),
        status: "completed",
      },
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
    result.errors.push({ message: `Uber sync failed: ${e}` });
  }

  return result;
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.partnerId || session.user.role === "DRIVER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const partnerId = session.user.partnerId;
  const partner = await db.partner.findUnique({ where: { id: partnerId } });
  if (!partner) {
    return NextResponse.json({ error: "Partner not found" }, { status: 404 });
  }

  const boltConfigured = !!(partner.boltClientId && partner.boltClientSecret);
  const uberConfigured = !!(partner.uberClientId && partner.uberClientSecret && partner.uberOrgId);

  if (!boltConfigured && !uberConfigured) {
    return NextResponse.json({
      platforms: [],
      message: "Keine Plattform-API konfiguriert",
    });
  }

  // Run all configured platform syncs in parallel
  const syncPromises: Promise<PlatformResult>[] = [];
  if (boltConfigured) syncPromises.push(syncBolt(partnerId));
  if (uberConfigured) syncPromises.push(syncUber(partnerId, partner.uberOrgId!));

  const results = await Promise.allSettled(syncPromises);

  const platforms: PlatformResult[] = results.map((r) =>
    r.status === "fulfilled"
      ? r.value
      : { platform: "UNKNOWN", errors: [{ message: String(r.reason) }] }
  );

  return NextResponse.json({ platforms });
}
