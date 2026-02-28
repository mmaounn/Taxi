import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createReport, getReportStatus, downloadReport } from "@/lib/integrations/uber/client";
import { parseUberCSV } from "@/lib/integrations/csv/uber-csv";

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

  const partner = await db.partner.findUniqueOrThrow({
    where: { id: session.user.partnerId },
  });

  if (!partner.uberOrgId) {
    return NextResponse.json({ error: "Uber Organization ID not configured" }, { status: 400 });
  }

  const syncLog = await db.syncLog.create({
    data: {
      partnerId: session.user.partnerId,
      platform: "UBER",
      syncType: "api",
    },
  });

  try {
    // Create report
    const reportId = await createReport(
      session.user.partnerId,
      partner.uberOrgId,
      dateFrom,
      dateTo
    );

    // Poll for completion (max 60 seconds)
    let status = await getReportStatus(session.user.partnerId, partner.uberOrgId, reportId);
    let attempts = 0;
    while (status.status !== "completed" && status.status !== "failed" && attempts < 12) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      status = await getReportStatus(session.user.partnerId, partner.uberOrgId, reportId);
      attempts++;
    }

    if (status.status !== "completed" || !status.download_url) {
      throw new Error(`Report not ready after polling: status=${status.status}`);
    }

    // Download and parse
    const csvContent = await downloadReport(session.user.partnerId, status.download_url);
    const { rides, errors: parseErrors } = parseUberCSV(csvContent);

    // Find drivers by Uber UUID
    const drivers = await db.driver.findMany({
      where: {
        partnerId: session.user.partnerId,
        uberDriverUuid: { not: null },
      },
    });
    const driverMap = new Map(drivers.map((d) => [d.uberDriverUuid!, d.id]));

    let imported = 0;
    const errors: { message: string; detail?: string }[] = parseErrors.map((e) => ({
      message: e.message,
      detail: `Row ${e.row}`,
    }));

    for (const ride of rides) {
      const driverId = driverMap.get(ride.driverExternalId);
      if (!driverId) {
        errors.push({
          message: `Unknown Uber driver: ${ride.driverExternalId}`,
          detail: `Trip ${ride.externalOrderId}`,
        });
        continue;
      }

      try {
        await db.rideData.upsert({
          where: {
            source_externalOrderId: {
              source: "UBER",
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
          message: `Failed to import trip ${ride.externalOrderId}`,
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

    return NextResponse.json({ imported, errors, total: rides.length });
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
      { error: `Uber sync failed: ${e}` },
      { status: 500 }
    );
  }
}
