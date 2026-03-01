import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

interface ExpiryAlert {
  id: string;
  entityType: "driver" | "vehicle";
  entityName: string;
  field: string;
  expiryDate: string;
  severity: "expired" | "critical" | "warning";
  link: string;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.partnerId || session.user.role === "DRIVER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const drivers = await db.driver.findMany({
    where: {
      partnerId: session.user.partnerId,
      status: "ACTIVE",
      OR: [
        { taxiLicenseExpiry: { lte: thirtyDaysFromNow } },
        { driversLicenseExpiry: { lte: thirtyDaysFromNow } },
      ],
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      taxiLicenseExpiry: true,
      driversLicenseExpiry: true,
    },
  });

  const vehicles = await db.vehicle.findMany({
    where: {
      partnerId: session.user.partnerId,
      status: "ACTIVE",
      OR: [
        { insuranceExpiry: { lte: thirtyDaysFromNow } },
        { registrationExpiry: { lte: thirtyDaysFromNow } },
      ],
    },
    select: {
      id: true,
      licensePlate: true,
      make: true,
      model: true,
      insuranceExpiry: true,
      registrationExpiry: true,
    },
  });

  const alerts: ExpiryAlert[] = [];

  function getSeverity(date: Date): "expired" | "critical" | "warning" {
    const daysUntil = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil <= 0) return "expired";
    if (daysUntil <= 7) return "critical";
    return "warning";
  }

  for (const driver of drivers) {
    if (driver.taxiLicenseExpiry && driver.taxiLicenseExpiry <= thirtyDaysFromNow) {
      alerts.push({
        id: `driver-taxi-${driver.id}`,
        entityType: "driver",
        entityName: `${driver.firstName} ${driver.lastName}`,
        field: "Taxi License",
        expiryDate: driver.taxiLicenseExpiry.toISOString(),
        severity: getSeverity(driver.taxiLicenseExpiry),
        link: `/drivers/${driver.id}`,
      });
    }
    if (driver.driversLicenseExpiry && driver.driversLicenseExpiry <= thirtyDaysFromNow) {
      alerts.push({
        id: `driver-license-${driver.id}`,
        entityType: "driver",
        entityName: `${driver.firstName} ${driver.lastName}`,
        field: "Driver's License",
        expiryDate: driver.driversLicenseExpiry.toISOString(),
        severity: getSeverity(driver.driversLicenseExpiry),
        link: `/drivers/${driver.id}`,
      });
    }
  }

  for (const vehicle of vehicles) {
    const vehicleName = `${vehicle.licensePlate} ${vehicle.make || ""} ${vehicle.model || ""}`.trim();
    if (vehicle.insuranceExpiry && vehicle.insuranceExpiry <= thirtyDaysFromNow) {
      alerts.push({
        id: `vehicle-insurance-${vehicle.id}`,
        entityType: "vehicle",
        entityName: vehicleName,
        field: "Insurance",
        expiryDate: vehicle.insuranceExpiry.toISOString(),
        severity: getSeverity(vehicle.insuranceExpiry),
        link: `/vehicles/${vehicle.id}`,
      });
    }
    if (vehicle.registrationExpiry && vehicle.registrationExpiry <= thirtyDaysFromNow) {
      alerts.push({
        id: `vehicle-registration-${vehicle.id}`,
        entityType: "vehicle",
        entityName: vehicleName,
        field: "Registration",
        expiryDate: vehicle.registrationExpiry.toISOString(),
        severity: getSeverity(vehicle.registrationExpiry),
        link: `/vehicles/${vehicle.id}`,
      });
    }
  }

  // Sort by severity: expired first, then critical, then warning
  const severityOrder = { expired: 0, critical: 1, warning: 2 };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return NextResponse.json(alerts);
}
