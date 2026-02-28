import { parseCSV } from "./parser";
import { RideSource, RideStatus, PaymentMethod } from "@prisma/client";

interface FreeNowCSVRow {
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

function findColumn(row: FreeNowCSVRow, possibilities: string[]): string {
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
  if (lower.includes("cash") || lower.includes("bar")) return "CASH";
  if (lower.includes("card") || lower.includes("karte")) return "CARD";
  if (lower.includes("app") || lower.includes("online")) return "IN_APP";
  return null;
}

export function parseFreeNowCSV(csvContent: string) {
  const result = parseCSV<FreeNowCSVRow>(csvContent, { delimiter: ";" });
  const rides: MappedRide[] = [];
  const errors: { row: number; message: string }[] = [...result.errors];

  result.data.forEach((row, index) => {
    try {
      const rideId = findColumn(row, [
        "Booking ID", "BookingID", "booking_id", "Ride ID", "RideID",
        "Buchungs-ID", "Fahrt-ID", "Order ID",
      ]);
      if (!rideId) {
        errors.push({ row: index, message: "Missing ride/booking ID" });
        return;
      }

      rides.push({
        source: "FREENOW",
        externalOrderId: rideId,
        driverExternalId: findColumn(row, [
          "Driver ID", "DriverID", "driver_id", "Fahrer-ID", "Fahrer ID",
        ]),
        pickupAddress: findColumn(row, ["Pickup", "Start", "Von", "Abholung", "Pickup Address"]) || null,
        dropoffAddress: findColumn(row, ["Dropoff", "End", "Nach", "Ziel", "Destination", "Dropoff Address"]) || null,
        distanceKm: parseNumber(findColumn(row, ["Distance", "Distanz", "Entfernung", "Distance (km)", "Strecke"])),
        startedAt: parseDate(findColumn(row, ["Start Time", "StartTime", "Startzeit", "Pickup Time", "Abholzeit"])),
        completedAt: parseDate(findColumn(row, ["End Time", "EndTime", "Endzeit", "Dropoff Time", "Ankunftzeit"])),
        fareAmount: parseNumber(findColumn(row, [
          "Fare", "Total", "Fahrpreis", "Gesamtpreis", "Price", "Preis",
          "Net Fare", "Gross Fare",
        ])),
        paymentMethod: mapPaymentMethod(findColumn(row, [
          "Payment", "Payment Method", "Zahlungsmethode", "Zahlungsart", "Bezahlart",
        ])),
        tipAmount: parseNumber(findColumn(row, ["Tip", "Trinkgeld", "Tips", "Tip Amount"])),
        platformCommissionAmount: parseNumber(findColumn(row, [
          "Commission", "Provision", "FreeNow Commission", "Kommission", "Fee",
        ])),
        status: "COMPLETED",
      });
    } catch (e) {
      errors.push({ row: index, message: `Parse error: ${e}` });
    }
  });

  return { rides, errors, totalRows: result.totalRows };
}
