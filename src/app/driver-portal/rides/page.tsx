"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RideTable } from "@/components/driver-portal/ride-table";
import { WeekPicker } from "@/components/ui/week-picker";
import { getWeekBounds } from "@/lib/date-utils";

interface Ride {
  id: string;
  source: string;
  pickupAddress: string | null;
  dropoffAddress: string | null;
  fareAmount: number;
  tipAmount: number;
  paymentMethod: string | null;
  completedAt: string | null;
  distanceKm: number | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function DriverRidesPage() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [source, setSource] = useState("all");
  const [week, setWeek] = useState(() => getWeekBounds(0));
  const [page, setPage] = useState(1);

  const fetchRides = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "20");
    if (source !== "all") params.set("source", source);
    if (week.start) params.set("from", week.start);
    if (week.end) params.set("to", week.end);

    try {
      const res = await fetch(`/api/driver-portal/rides?${params}`);
      const data = await res.json();
      setRides(data.rides || []);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
    } catch {
      // silent
    }
    setLoading(false);
  }, [page, source, week]);

  useEffect(() => {
    fetchRides();
  }, [fetchRides]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [source, week]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Fahrten</h1>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:items-end sm:gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Plattform</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="Alle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Plattformen</SelectItem>
                  <SelectItem value="BOLT">Bolt</SelectItem>
                  <SelectItem value="UBER">Uber</SelectItem>
                  <SelectItem value="FREENOW">FreeNow</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <WeekPicker value={week} onChange={setWeek} />
          </div>
        </CardContent>
      </Card>

      {/* Rides Table */}
      {loading ? (
        <div className="py-8 text-center text-gray-500">Fahrten werden geladen...</div>
      ) : (
        <RideTable
          rides={rides}
          pagination={pagination}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
