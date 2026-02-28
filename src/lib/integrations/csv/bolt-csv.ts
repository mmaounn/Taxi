import { parseCSV } from "./parser";
import { RideSource, RideStatus, PaymentMethod } from "@prisma/client";

interface BoltCSVRow {
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

function findColumn(row: BoltCSVRow, possibilities: string[]): string {
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

function mapPaymentMethod(val: string): PaymentMethod | null {
  const lower = val.toLowerCase();
  if (lower.includes("cash")) return "CASH";
  if (lower.includes("card")) return "CARD";
  if (lower.includes("app") || lower.includes("online")) return "IN_APP";
  return null;
}

export function parseBoltCSV(csvContent: string) {
  const result = parseCSV<BoltCSVRow>(csvContent);
  const rides: MappedRide[] = [];
  const errors: { row: number; message: string }[] = [...result.errors];

  result.data.forEach((row, index) => {
    try {
      const orderId = findColumn(row, ["OrderID", "Order ID", "order_id", "id", "Ride ID"]);
      if (!orderId) {
        errors.push({ row: index, message: "Missing order ID" });
        return;
      }

      rides.push({
        source: "BOLT",
        externalOrderId: orderId,
        driverExternalId: findColumn(row, ["DriverID", "Driver ID", "driver_id"]),
        pickupAddress: findColumn(row, ["Pickup", "PickupAddress", "pickup_address", "From"]) || null,
        dropoffAddress: findColumn(row, ["Dropoff", "DropoffAddress", "dropoff_address", "To", "Destination"]) || null,
        distanceKm: parseNumber(findColumn(row, ["Distance", "DistanceKm", "distance_km", "Distance (km)"])),
        startedAt: parseDate(findColumn(row, ["StartTime", "Started", "started_at", "Start Time", "Pickup Time"])),
        completedAt: parseDate(findColumn(row, ["EndTime", "Completed", "completed_at", "End Time", "Dropoff Time"])),
        fareAmount: parseNumber(findColumn(row, ["Fare", "FareAmount", "fare_amount", "Total Fare", "Ride Price"])),
        paymentMethod: mapPaymentMethod(findColumn(row, ["Payment", "PaymentMethod", "payment_method", "Payment Method"])),
        tipAmount: parseNumber(findColumn(row, ["Tip", "TipAmount", "tip_amount", "Tips"])),
        platformCommissionAmount: parseNumber(findColumn(row, ["Commission", "PlatformCommission", "platform_commission", "Bolt Commission"])),
        status: "COMPLETED",
      });
    } catch (e) {
      errors.push({ row: index, message: `Parse error: ${e}` });
    }
  });

  return { rides, errors, totalRows: result.totalRows };
}
