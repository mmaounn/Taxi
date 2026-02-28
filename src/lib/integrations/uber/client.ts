import { getUberAccessToken } from "./auth";

export interface UberTrip {
  trip_id: string;
  driver_uuid: string;
  pickup_address: string;
  dropoff_address: string;
  distance_miles: number;
  request_time: string;
  dropoff_time: string;
  fare: number;
  payment_method: string;
  tip: number;
  service_fee: number;
  city_fee: number;
  promotion: number;
  status: string;
}

export interface UberReportStatus {
  report_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  download_url?: string;
}

export async function getOrganizations(partnerId: string) {
  const token = await getUberAccessToken(partnerId);
  const res = await fetch("https://api.uber.com/v1/organizations", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Uber Organizations API error: ${res.status}`);
  }

  return res.json();
}

export async function createReport(
  partnerId: string,
  orgId: string,
  startDate: string,
  endDate: string
): Promise<string> {
  const token = await getUberAccessToken(partnerId);
  const res = await fetch(
    `https://api.uber.com/v1/organizations/${orgId}/reports`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        report_type: "trips",
        start_date: startDate,
        end_date: endDate,
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Uber Report creation failed: ${res.status}`);
  }

  const data = await res.json();
  return data.report_id;
}

export async function getReportStatus(
  partnerId: string,
  orgId: string,
  reportId: string
): Promise<UberReportStatus> {
  const token = await getUberAccessToken(partnerId);
  const res = await fetch(
    `https://api.uber.com/v1/organizations/${orgId}/reports/${reportId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    throw new Error(`Uber Report status check failed: ${res.status}`);
  }

  return res.json();
}

export async function downloadReport(
  partnerId: string,
  downloadUrl: string
): Promise<string> {
  const token = await getUberAccessToken(partnerId);
  const res = await fetch(downloadUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Uber Report download failed: ${res.status}`);
  }

  return res.text();
}
