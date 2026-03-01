"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatEur } from "@/lib/format";
import { WeekPicker } from "@/components/ui/week-picker";
import { getWeekBounds } from "@/lib/date-utils";

interface Ride {
  id: string;
  driverName: string;
  source: string;
  pickupAddress: string | null;
  dropoffAddress: string | null;
  distanceKm: number | null;
  completedAt: string | null;
  fareAmount: number | null;
  tipAmount: number | null;
  platformCommission: number | null;
  paymentMethod: string | null;
  status: string;
}

interface Driver {
  id: string;
  firstName: string;
  lastName: string;
}

const platformColors: Record<string, string> = {
  BOLT: "bg-green-100 text-green-800",
  UBER: "bg-gray-100 text-gray-800",
  FREENOW: "bg-red-100 text-red-800",
};

const paymentLabels: Record<string, string> = {
  CASH: "Bargeld",
  CARD: "Karte",
  IN_APP: "In-App",
};

export default function RidesPage() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [source, setSource] = useState("");
  const [driverId, setDriverId] = useState("");
  const [payment, setPayment] = useState("");
  const [week, setWeek] = useState(() => getWeekBounds(0));

  const fetchRides = useCallback(async (p: number) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: "30" });
    if (source && source !== "all") params.set("source", source);
    if (driverId && driverId !== "all") params.set("driverId", driverId);
    if (payment && payment !== "all") params.set("payment", payment);
    if (week.start) params.set("from", week.start);
    if (week.end) params.set("to", week.end);

    try {
      const res = await fetch(`/api/rides?${params}`);
      if (res.ok) {
        const data = await res.json();
        setRides(data.rides);
        setPage(data.page);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      }
    } catch {
      // silent
    }
    setLoading(false);
  }, [source, driverId, payment, week]);

  useEffect(() => {
    fetch("/api/drivers")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setDrivers(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchRides(1);
  }, [fetchRides]);

  const totals = useMemo(() => {
    let km = 0;
    let fare = 0;
    let tip = 0;
    let commission = 0;
    for (const r of rides) {
      km += r.distanceKm ?? 0;
      fare += r.fareAmount ?? 0;
      tip += r.tipAmount ?? 0;
      commission += r.platformCommission ?? 0;
    }
    return { km, fare, tip, commission };
  }, [rides]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Fahrten</h1>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={driverId} onValueChange={setDriverId}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Alle Fahrer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Fahrer</SelectItem>
            {drivers.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.firstName} {d.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={source} onValueChange={setSource}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Alle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle</SelectItem>
            <SelectItem value="BOLT">Bolt</SelectItem>
            <SelectItem value="UBER">Uber</SelectItem>
            <SelectItem value="FREENOW">FreeNow</SelectItem>
          </SelectContent>
        </Select>
        <Select value={payment} onValueChange={setPayment}>
          <SelectTrigger className="w-28">
            <SelectValue placeholder="Alle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle</SelectItem>
            <SelectItem value="CASH">Bargeld</SelectItem>
            <SelectItem value="CARD">Karte</SelectItem>
            <SelectItem value="IN_APP">In-App</SelectItem>
          </SelectContent>
        </Select>
        <WeekPicker value={week} onChange={setWeek} />
      </div>

      {/* Results */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {total} Fahrt{total !== 1 ? "en" : ""} gefunden
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchRides(page - 1)}
              disabled={page <= 1 || loading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Seite {page} von {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchRides(page + 1)}
              disabled={page >= totalPages || loading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Datum</TableHead>
              <TableHead>Fahrer</TableHead>
              <TableHead>Plattform</TableHead>
              <TableHead>Abholung</TableHead>
              <TableHead>Ziel</TableHead>
              <TableHead className="text-right">km</TableHead>
              <TableHead className="text-right">Fahrpreis</TableHead>
              <TableHead className="text-right">Trinkgeld</TableHead>
              <TableHead className="text-right">Provision</TableHead>
              <TableHead>Zahlung</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rides.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center text-gray-500">
                  {loading ? "Fahrten werden geladen..." : "Keine Fahrten gefunden."}
                </TableCell>
              </TableRow>
            ) : (
              rides.map((ride) => (
                <TableRow key={ride.id}>
                  <TableCell className="whitespace-nowrap text-sm">
                    {ride.completedAt
                      ? new Date(ride.completedAt).toLocaleDateString("de-AT", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {ride.driverName}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={platformColors[ride.source] || ""}
                    >
                      {ride.source}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate text-sm" title={ride.pickupAddress || ""}>
                    {ride.pickupAddress || "—"}
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate text-sm" title={ride.dropoffAddress || ""}>
                    {ride.dropoffAddress || "—"}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {ride.distanceKm != null
                      ? ride.distanceKm.toFixed(1)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {formatEur(ride.fareAmount)}
                  </TableCell>
                  <TableCell className="text-right text-sm text-green-600">
                    {ride.tipAmount ? formatEur(ride.tipAmount) : "—"}
                  </TableCell>
                  <TableCell className="text-right text-sm text-gray-500">
                    {ride.platformCommission
                      ? formatEur(ride.platformCommission)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {ride.paymentMethod
                      ? paymentLabels[ride.paymentMethod] || ride.paymentMethod
                      : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          {rides.length > 0 && (
            <TableFooter>
              <TableRow className="font-semibold">
                <TableCell colSpan={5} className="text-sm">
                  Summe
                </TableCell>
                <TableCell className="text-right text-sm">
                  {totals.km.toFixed(1)}
                </TableCell>
                <TableCell className="text-right text-sm">
                  {formatEur(totals.fare)}
                </TableCell>
                <TableCell className="text-right text-sm text-green-600">
                  {formatEur(totals.tip)}
                </TableCell>
                <TableCell className="text-right text-sm text-gray-500">
                  {formatEur(totals.commission)}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>

      {/* Bottom pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchRides(page - 1)}
            disabled={page <= 1 || loading}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Zurück
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchRides(page + 1)}
            disabled={page >= totalPages || loading}
          >
            Weiter
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
