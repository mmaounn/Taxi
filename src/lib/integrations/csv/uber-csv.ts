import { parseCSV } from "./parser";
import { RideSource, RideStatus, PaymentMethod } from "@prisma/client";

interface UberCSVRow {
  [key: string]: string;
}

export interface MappedRide {
  source: RideSource;
  externalOrderId: string;
  driverExternalId: string;
  pickupAddress: string | null;
  dropoffAddress: string | null;
  distanceKm: number | null;
  startedAt: Date | null;
  completedAt: Date | null;
  fareAmount: number | null;
  paymentMethod: PaymentMethod | null;
  tipAmount: number | null;
  platformCommissionAmount: number | null;
  status: RideStatus;
}

function findColumn(row: UberCSVRow, possibilities: string[]): string {
  for (const key of possibilities) {
    const found = Object.keys(row).find(
      (k) => k.toLowerCase().replace(/[^a-z0-9]/g, "") === key.toLowerCase().replace(/[^a-z0-9]/g, "")
    );
    if (found && row[found]) return row[found];
  }
  return "";
}

function parseNumber(val: string): number | null {
  if (!val) return null;
  const cleaned = val.replace(/[^0-9.\-,]/g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function parseDate(val: string): Date | null {
  if (!val) return null;
  const date = new Date(val);
  return isNaN(date.getTime()) ? null : date;
}

function milesToKm(miles: number): number {
  return Math.round(miles * 1.60934 * 100) / 100;
}

export function parseUberCSV(csvContent: string) {
  const result = parseCSV<UberCSVRow>(csvContent);
  const rides: MappedRide[] = [];
  const errors: { row: number; message: string }[] = [...result.errors];

  result.data.forEach((row, index) => {
    try {
      const tripId = findColumn(row, ["Trip ID", "TripID", "trip_id", "Trip/Order #"]);
      if (!tripId) {
        errors.push({ row: index, message: "Missing trip ID" });
        return;
      }

      const distanceMiles = parseNumber(findColumn(row, ["Distance", "Trip Distance", "distance_miles", "Distance (miles)"]));

      rides.push({
        source: "UBER",
        externalOrderId: tripId,
        driverExternalId: findColumn(row, ["Driver UUID", "DriverUUID", "driver_uuid", "Driver ID"]),
        pickupAddress: findColumn(row, ["Pickup", "Pickup Location", "pickup_address", "Pickup Address"]) || null,
        dropoffAddress: findColumn(row, ["Dropoff", "Dropoff Location", "dropoff_address", "Dropoff Address"]) || null,
        distanceKm: distanceMiles ? milesToKm(distanceMiles) : null,
        startedAt: parseDate(findColumn(row, ["Request Time", "RequestTime", "request_time", "Trip Start"])),
        completedAt: parseDate(findColumn(row, ["Dropoff Time", "DropoffTime", "dropoff_time", "Trip End"])),
        fareAmount: parseNumber(findColumn(row, ["Fare", "Trip Fare", "fare", "Gross Fare"])),
        paymentMethod: "IN_APP",
        tipAmount: parseNumber(findColumn(row, ["Tip", "Tips", "tip", "Tip Amount"])),
        platformCommissionAmount: parseNumber(findColumn(row, ["Service Fee", "ServiceFee", "service_fee", "Uber Fee"])),
        status: "COMPLETED",
      });
    } catch (e) {
      errors.push({ row: index, message: `Parse error: ${e}` });
    }
  });

  return { rides, errors, totalRows: result.totalRows };
}
