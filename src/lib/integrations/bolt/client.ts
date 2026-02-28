import { getBoltAccessToken } from "./auth";

export interface BoltOrder {
  id: string;
  driver_id: string;
  pickup_address: string;
  dropoff_address: string;
  distance_km: number;
  started_at: string;
  completed_at: string;
  fare_amount: number;
  payment_method: string;
  tip_amount: number;
  platform_commission: number;
  cash_service_fee: number;
  status: string;
  bonus_amount?: number;
  reimbursement_amount?: number;
}

interface BoltOrdersResponse {
  orders: BoltOrder[];
  cursor?: string;
}

export async function getFleetOrders(
  partnerId: string,
  dateFrom: string,
  dateTo: string
): Promise<BoltOrder[]> {
  const token = await getBoltAccessToken(partnerId);
  const allOrders: BoltOrder[] = [];
  let cursor: string | undefined;

  do {
    const params = new URLSearchParams({
      date_from: dateFrom,
      date_to: dateTo,
      limit: "100",
    });
    if (cursor) params.set("cursor", cursor);

    const res = await fetch(
      `https://fleet-owner-api.bolt.eu/v1/fleet/orders?${params}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.ok) {
      throw new Error(`Bolt API error: ${res.status} ${await res.text()}`);
    }

    const data: BoltOrdersResponse = await res.json();
    allOrders.push(...data.orders);
    cursor = data.cursor;
  } while (cursor);

  return allOrders;
}
