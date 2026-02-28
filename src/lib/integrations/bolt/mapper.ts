import { BoltOrder } from "./client";
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
    card: "CARD",
    in_app: "IN_APP",
    card_payment: "CARD",
    app_payment: "IN_APP",
  };
  return map[method?.toLowerCase()] || null;
}

function mapStatus(status: string): RideStatus {
  if (status === "completed") return "COMPLETED";
  if (status === "cancelled") return "CANCELLED";
  if (status === "no_show") return "NO_SHOW";
  return "COMPLETED";
}

export function mapBoltOrderToRide(order: BoltOrder): MappedRide {
  return {
    source: "BOLT",
    externalOrderId: order.id,
    driverExternalId: order.driver_id,
    pickupAddress: order.pickup_address || null,
    dropoffAddress: order.dropoff_address || null,
    distanceKm: order.distance_km ?? null,
    startedAt: order.started_at ? new Date(order.started_at) : null,
    completedAt: order.completed_at ? new Date(order.completed_at) : null,
    fareAmount: order.fare_amount ?? null,
    paymentMethod: mapPaymentMethod(order.payment_method),
    tipAmount: order.tip_amount ?? null,
    platformCommissionAmount: order.platform_commission ?? null,
    status: mapStatus(order.status),
  };
}

export function mapBoltOrders(orders: BoltOrder[]): MappedRide[] {
  return orders.map(mapBoltOrderToRide);
}
