import { RideSource, RideStatus, PaymentMethod } from "@prisma/client";

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

function mapPaymentMethod(method: string): PaymentMethod | null {
  const map: Record<string, PaymentMethod> = {
    cash: "CASH",
    personal: "CARD",
    business: "CARD",
    card: "CARD",
  };
  return map[method?.toLowerCase()] || "IN_APP";
}

function milesToKm(miles: number): number {
  return Math.round(miles * 1.60934 * 100) / 100;
}

export function mapUberTripToRide(trip: {
  trip_id: string;
  driver_uuid: string;
  pickup_address?: string;
  dropoff_address?: string;
  distance_miles?: number;
  request_time?: string;
  dropoff_time?: string;
  fare?: number;
  payment_method?: string;
  tip?: number;
  service_fee?: number;
  status?: string;
}): MappedRide {
  return {
    source: "UBER",
    externalOrderId: trip.trip_id,
    driverExternalId: trip.driver_uuid,
    pickupAddress: trip.pickup_address || null,
    dropoffAddress: trip.dropoff_address || null,
    distanceKm: trip.distance_miles ? milesToKm(trip.distance_miles) : null,
    startedAt: trip.request_time ? new Date(trip.request_time) : null,
    completedAt: trip.dropoff_time ? new Date(trip.dropoff_time) : null,
    fareAmount: trip.fare ?? null,
    paymentMethod: mapPaymentMethod(trip.payment_method || ""),
    tipAmount: trip.tip ?? null,
    platformCommissionAmount: trip.service_fee ?? null,
    status: trip.status === "completed" ? "COMPLETED" : trip.status === "canceled" ? "CANCELLED" : "COMPLETED",
  };
}
