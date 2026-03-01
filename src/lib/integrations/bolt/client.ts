import { getBoltAccessToken } from "./auth";

const BOLT_API_BASE = "https://node.bolt.eu/fleet-integration-gateway/fleetIntegration/v1";

/**
 * Extract a field from a Bolt API response, handling possible wrapper shapes:
 *  - { field: [...] }             (direct)
 *  - { data: { field: [...] } }   (wrapped)
 *  - { code, message, error_hint } (API error with HTTP 200)
 */
function extractField<T>(response: Record<string, unknown>, field: string, endpoint: string): T {
  // Bolt API wraps all responses with { code, message, ... }
  // code 0 = success, anything else = error
  if (response.code !== undefined && response.code !== 0) {
    const hint = response.error_hint ? ` (${response.error_hint})` : "";
    console.error(`Bolt ${endpoint} API error:`, JSON.stringify(response));
    throw new Error(`Bolt ${endpoint} error ${response.code}: ${response.message}${hint}`);
  }

  const direct = response[field];
  if (direct !== undefined) return direct as T;

  const nested = (response.data as Record<string, unknown> | undefined)?.[field];
  if (nested !== undefined) return nested as T;

  console.error(`Bolt ${endpoint} unexpected response shape:`, JSON.stringify(response).slice(0, 500));
  throw new Error(
    `Bolt ${endpoint}: expected "${field}" in response. Got keys: ${Object.keys(response).join(", ")}`
  );
}

// --- Orders ---

export interface BoltOrder {
  order_reference: string;
  driver_uuid: string;
  driver_name: string;
  pickup_address: string;
  destination_address: string;
  ride_distance: number; // meters
  order_pickup_timestamp: number | null;
  order_drop_off_timestamp: number | null;
  order_finished_timestamp: number | null;
  order_status: string;
  payment_method: string;
  vehicle_license_plate: string;
  order_price: {
    commission: number;
    booking_fee: number;
    cancellation_fee: number;
    cash_discount: number;
    in_app_discount: number;
    tip: number;
    toll_fee: number;
    ride_price: number;
    net_earnings: number;
  };
}

const MAX_BOLT_RANGE_DAYS = 31;

/**
 * Split a date range into chunks of maxDays.
 */
function chunkDateRange(from: Date, to: Date, maxDays: number): { start: Date; end: Date }[] {
  const chunks: { start: Date; end: Date }[] = [];
  let cursor = new Date(from);

  while (cursor < to) {
    const chunkEnd = new Date(cursor);
    chunkEnd.setDate(chunkEnd.getDate() + maxDays);
    chunks.push({
      start: new Date(cursor),
      end: chunkEnd > to ? new Date(to) : chunkEnd,
    });
    cursor = new Date(chunkEnd);
  }

  return chunks;
}

export async function getFleetOrders(
  partnerId: string,
  dateFrom: string,
  dateTo: string
): Promise<BoltOrder[]> {
  const token = await getBoltAccessToken(partnerId);
  const companyIds = await getCompanyIds(partnerId);
  const allOrders: BoltOrder[] = [];

  // Auto-chunk into 31-day windows (Bolt API limit)
  const chunks = chunkDateRange(new Date(dateFrom), new Date(dateTo), MAX_BOLT_RANGE_DAYS);

  for (const chunk of chunks) {
    let offset = 0;
    const limit = 1000;

    do {
      const res = await fetch(`${BOLT_API_BASE}/getFleetOrders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          company_ids: companyIds,
          start_ts: Math.floor(chunk.start.getTime() / 1000),
          end_ts: Math.floor(chunk.end.getTime() / 1000),
          limit,
          offset,
        }),
      });

      if (!res.ok) {
        throw new Error(`Bolt getFleetOrders error: ${res.status} ${await res.text()}`);
      }

      const data = await res.json();
      const orders: BoltOrder[] = extractField(data, "orders", "getFleetOrders");
      allOrders.push(...orders);

      if (orders.length < limit) break;
      offset += limit;
    } while (true);
  }

  return allOrders;
}

// --- Companies ---

async function getCompanyIds(partnerId: string): Promise<number[]> {
  const token = await getBoltAccessToken(partnerId);

  const res = await fetch(`${BOLT_API_BASE}/getCompanies`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Bolt getCompanies error: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const companyIds: number[] = extractField(data, "company_ids", "getCompanies");

  if (!Array.isArray(companyIds)) {
    console.error("Bolt getCompanies: company_ids is not an array:", JSON.stringify(data).slice(0, 500));
    throw new Error(`Bolt getCompanies: company_ids is not an array`);
  }

  return companyIds;
}

// --- Drivers ---

export interface BoltDriver {
  driver_uuid: string | null;
  partner_uuid: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string;
  state: "active" | "suspended" | "deactivated";
  has_cash_payment: boolean;
  driver_score: number | null;
  driver_rating: number | null;
  active_categories: string[];
  inactive_categories: string[];
  active_vehicle: {
    id: number;
    model: string;
    year: number;
    reg_number: string;
    vin: string | null;
    uuid: string | null;
    state: string;
  } | null;
}

export async function getFleetDrivers(partnerId: string): Promise<BoltDriver[]> {
  const token = await getBoltAccessToken(partnerId);
  const companyIds = await getCompanyIds(partnerId);
  const allDrivers: BoltDriver[] = [];

  for (const companyId of companyIds) {
    let offset = 0;
    const limit = 1000;

    do {
      const now = Math.floor(Date.now() / 1000);
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60;

      const res = await fetch(`${BOLT_API_BASE}/getDrivers`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          company_id: companyId,
          start_ts: thirtyDaysAgo,
          end_ts: now,
          portal_status: "active",
          limit,
          offset,
        }),
      });

      if (!res.ok) {
        throw new Error(`Bolt getDrivers error: ${res.status} ${await res.text()}`);
      }

      const data = await res.json();
      const drivers: BoltDriver[] = extractField(data, "drivers", "getDrivers");
      allDrivers.push(...drivers);

      if (drivers.length < limit) break;
      offset += limit;
    } while (true);
  }

  return allDrivers;
}

// --- Vehicles ---

export interface BoltVehicle {
  id: number;
  model: string;
  year: number;
  seats: number;
  color: string | null;
  reg_number: string;
  vin: string | null;
  uuid: string | null;
  state: "active" | "suspended" | "deactivated";
}

export async function getFleetVehicles(partnerId: string): Promise<BoltVehicle[]> {
  const token = await getBoltAccessToken(partnerId);
  const companyIds = await getCompanyIds(partnerId);
  const allVehicles: BoltVehicle[] = [];

  for (const companyId of companyIds) {
    let offset = 0;
    const limit = 100;

    do {
      const now = Math.floor(Date.now() / 1000);
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60;

      const res = await fetch(`${BOLT_API_BASE}/getVehicles`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          company_id: companyId,
          start_ts: thirtyDaysAgo,
          end_ts: now,
          portal_status: "active",
          limit,
          offset,
        }),
      });

      if (!res.ok) {
        throw new Error(`Bolt getVehicles error: ${res.status} ${await res.text()}`);
      }

      const data = await res.json();
      const vehicles: BoltVehicle[] = extractField(data, "vehicles", "getVehicles");
      allVehicles.push(...vehicles);

      if (vehicles.length < limit) break;
      offset += limit;
    } while (true);
  }

  return allVehicles;
}

export { getCompanyIds };
