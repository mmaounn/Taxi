import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseBoltCSV } from "@/lib/integrations/csv/bolt-csv";
import { parseUberCSV } from "@/lib/integrations/csv/uber-csv";
import { parseFreeNowCSV } from "@/lib/integrations/csv/freenow-csv";
import type { RideSource } from "@prisma/client";

interface MappedRide {
  source: RideSource;
  externalOrderId: string;
  driverExternalId: string;
  pickupAddress: string | null;
  dropoffAddress: string | null;
  distanceKm: number | null;
  startedAt: Date | null;
  completedAt: Date | null;
  fareAmount: number | null;
  paymentMethod: "CASH" | "CARD" | "IN_APP" | null;
  tipAmount: number | null;
  platformCommissionAmount: number | null;
  status: "COMPLETED" | "CANCELLED" | "NO_SHOW";
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.partnerId || session.user.role === "DRIVER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const platform = formData.get("platform") as string | null;

  if (!file || !platform) {
    return NextResponse.json(
      { error: "file and platform are required" },
      { status: 400 }
    );
  }

  if (!["BOLT", "UBER", "FREENOW"].includes(platform)) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  }

  const csvContent = await file.text();

  const syncLog = await db.syncLog.create({
    data: {
      partnerId: session.user.partnerId,
      platform: platform as RideSource,
      syncType: "csv_upload",
    },
  });

  try {
    let rides: MappedRide[];
    let parseErrors: { row: number; message: string }[];

    switch (platform) {
      case "BOLT": {
        const result = parseBoltCSV(csvContent);
        rides = result.rides;
        parseErrors = result.errors;
        break;
      }
      case "UBER": {
        const result = parseUberCSV(csvContent);
        rides = result.rides;
        parseErrors = result.errors;
        break;
      }
      case "FREENOW": {
        const result = parseFreeNowCSV(csvContent);
        rides = result.rides;
        parseErrors = result.errors;
        break;
      }
      default:
        throw new Error("Invalid platform");
    }

    // Build driver ID map based on platform
    const drivers = await db.driver.findMany({
      where: { partnerId: session.user.partnerId },
    });

    const driverMap = new Map<string, string>();
    for (const d of drivers) {
      if (platform === "BOLT" && d.boltDriverId) driverMap.set(d.boltDriverId, d.id);
      if (platform === "UBER" && d.uberDriverUuid) driverMap.set(d.uberDriverUuid, d.id);
      if (platform === "FREENOW" && d.freenowDriverId) driverMap.set(d.freenowDriverId, d.id);
    }

    let imported = 0;
    const errors: { message: string; detail?: string }[] = parseErrors.map((e) => ({
      message: e.message,
      detail: `Row ${e.row}`,
    }));

    for (const ride of rides) {
      const driverId = driverMap.get(ride.driverExternalId);
      if (!driverId) {
        errors.push({
          message: `Unknown ${platform} driver: ${ride.driverExternalId}`,
          detail: `Order ${ride.externalOrderId}`,
        });
        continue;
      }

      if (!ride.externalOrderId) {
        errors.push({ message: "Missing order ID for ride" });
        continue;
      }

      try {
        await db.rideData.upsert({
          where: {
            source_externalOrderId: {
              source: platform as RideSource,
              externalOrderId: ride.externalOrderId,
            },
          },
          create: {
            driverId,
            source: platform as RideSource,
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
          message: `Failed to import ${ride.externalOrderId}`,
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

    return NextResponse.json({
      imported,
      errors,
      total: rides.length,
      parseErrors: parseErrors.length,
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
      { error: `CSV import failed: ${e}` },
      { status: 500 }
    );
  }
}
