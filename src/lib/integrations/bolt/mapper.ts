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
  if (status === "finished" || status === "completed") return "COMPLETED";
  if (status === "cancelled" || status === "client_cancelled" || status === "driver_cancelled") return "CANCELLED";
  if (status === "no_show") return "NO_SHOW";
  return "COMPLETED";
}

function tsToDate(ts: number | null): Date | null {
  if (!ts) return null;
  return new Date(ts * 1000);
}

export function mapBoltOrderToRide(order: BoltOrder): MappedRide {
  return {
    source: "BOLT",
    externalOrderId: order.order_reference,
    driverExternalId: order.driver_uuid,
    pickupAddress: order.pickup_address || null,
    dropoffAddress: order.destination_address || null,
    distanceKm: order.ride_distance ? order.ride_distance / 1000 : null,
    startedAt: tsToDate(order.order_pickup_timestamp),
    completedAt: tsToDate(order.order_drop_off_timestamp),
    fareAmount: order.order_price?.ride_price ?? null,
    paymentMethod: mapPaymentMethod(order.payment_method),
    tipAmount: order.order_price?.tip ?? null,
    platformCommissionAmount: order.order_price?.commission ?? null,
    status: mapStatus(order.order_status),
  };
}

export function mapBoltOrders(orders: BoltOrder[]): MappedRide[] {
  return orders.map(mapBoltOrderToRide);
}
