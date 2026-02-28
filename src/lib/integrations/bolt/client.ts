import { getBoltAccessToken } from "./auth";

const BOLT_API_BASE = "https://node.bolt.eu/fleet-integration-gateway/fleetIntegration/v1";

// --- Orders ---

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
  total: number;
}

export async function getFleetOrders(
  partnerId: string,
  dateFrom: string,
  dateTo: string
): Promise<BoltOrder[]> {
  const token = await getBoltAccessToken(partnerId);
  const companyIds = await getCompanyIds(partnerId);
  const allOrders: BoltOrder[] = [];

  for (const companyId of companyIds) {
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
          company_id: companyId,
          start_ts: Math.floor(new Date(dateFrom).getTime() / 1000),
          end_ts: Math.floor(new Date(dateTo).getTime() / 1000),
          limit,
          offset,
        }),
      });

      if (!res.ok) {
        throw new Error(`Bolt getFleetOrders error: ${res.status} ${await res.text()}`);
      }

      const data: BoltOrdersResponse = await res.json();
      allOrders.push(...data.orders);

      if (data.orders.length < limit) break;
      offset += limit;
    } while (true);
  }

  return allOrders;
}

// --- Companies ---

interface BoltCompaniesResponse {
  company_ids: number[];
}

async function getCompanyIds(partnerId: string): Promise<number[]> {
  const token = await getBoltAccessToken(partnerId);

  const res = await fetch(`${BOLT_API_BASE}/getCompanies`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Bolt getCompanies error: ${res.status} ${await res.text()}`);
  }

  const data: BoltCompaniesResponse = await res.json();
  return data.company_ids;
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

interface BoltDriversResponse {
  drivers: BoltDriver[];
  total: number;
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
      const oneYearAgo = now - 365 * 24 * 60 * 60;

      const res = await fetch(`${BOLT_API_BASE}/getDrivers`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          company_id: companyId,
          start_ts: oneYearAgo,
          end_ts: now,
          portal_status: "active",
          limit,
          offset,
        }),
      });

      if (!res.ok) {
        throw new Error(`Bolt getDrivers error: ${res.status} ${await res.text()}`);
      }

      const data: BoltDriversResponse = await res.json();
      allDrivers.push(...data.drivers);

      if (data.drivers.length < limit) break;
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

interface BoltVehiclesResponse {
  vehicles: BoltVehicle[];
  total: number;
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
      const oneYearAgo = now - 365 * 24 * 60 * 60;

      const res = await fetch(`${BOLT_API_BASE}/getVehicles`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          company_id: companyId,
          start_ts: oneYearAgo,
          end_ts: now,
          portal_status: "active",
          limit,
          offset,
        }),
      });

      if (!res.ok) {
        throw new Error(`Bolt getVehicles error: ${res.status} ${await res.text()}`);
      }

      const data: BoltVehiclesResponse = await res.json();
      allVehicles.push(...data.vehicles);

      if (data.vehicles.length < limit) break;
      offset += limit;
    } while (true);
  }

  return allVehicles;
}

export { getCompanyIds };
