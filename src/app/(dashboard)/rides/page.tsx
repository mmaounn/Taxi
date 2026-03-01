"use client";

import { useEffect, useState, useCallback } from "react";
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
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Route, Banknote, HandCoins, Building2 } from "lucide-react";
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
    const params = new URLSearchParams({ page: String(p), limit: "15" });
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
        if (data.totals) {
          setTotals({
            km: data.totals.distanceKm,
            fare: data.totals.fareAmount,
            tip: data.totals.tipAmount,
            commission: data.totals.platformCommission,
          });
        }
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

  const [totals, setTotals] = useState({ km: 0, fare: 0, tip: 0, commission: 0 });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Fahrten</h1>

      {/* Filters */}
      <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center">
        <Select value={driverId} onValueChange={setDriverId}>
          <SelectTrigger className="w-full sm:w-44">
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
          <SelectTrigger className="w-full sm:w-32">
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
          <SelectTrigger className="w-full sm:w-28">
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

      {/* Summary cards */}
      {total > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-2 px-3 py-2">
              <Route className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              <span className="text-xs text-muted-foreground">km</span>
              <span className="ml-auto text-sm font-semibold">{totals.km.toFixed(1)}</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-2 px-3 py-2">
              <Banknote className="h-3.5 w-3.5 text-green-600 shrink-0" />
              <span className="text-xs text-muted-foreground">Fahrpreis</span>
              <span className="ml-auto text-sm font-semibold">{formatEur(totals.fare)}</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-2 px-3 py-2">
              <HandCoins className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span className="text-xs text-muted-foreground">Trinkgeld</span>
              <span className="ml-auto text-sm font-semibold text-green-600">{formatEur(totals.tip)}</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-2 px-3 py-2">
              <Building2 className="h-3.5 w-3.5 text-gray-500 shrink-0" />
              <span className="text-xs text-muted-foreground">Provision</span>
              <span className="ml-auto text-sm font-semibold text-gray-500">{formatEur(totals.commission)}</span>
            </CardContent>
          </Card>
        </div>
      )}

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

      {/* Mobile: Card view */}
      <div className="space-y-3 md:hidden">
        {rides.length === 0 ? (
          <div className="rounded-md border p-8 text-center text-gray-500">
            {loading ? "Fahrten werden geladen..." : "Keine Fahrten gefunden."}
          </div>
        ) : (
          rides.map((ride) => (
            <Card key={ride.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm">{ride.driverName}</p>
                    <p className="text-xs text-gray-500">
                      {ride.completedAt
                        ? new Date(ride.completedAt).toLocaleDateString("de-AT", {
                            day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
                          })
                        : "—"}
                    </p>
                  </div>
                  <Badge variant="secondary" className={platformColors[ride.source] || ""}>
                    {ride.source}
                  </Badge>
                </div>
                {(ride.pickupAddress || ride.dropoffAddress) && (
                  <div className="mt-2 text-xs text-gray-500">
                    {ride.pickupAddress && <p className="truncate">Von: {ride.pickupAddress}</p>}
                    {ride.dropoffAddress && <p className="truncate">Nach: {ride.dropoffAddress}</p>}
                  </div>
                )}
                <div className="mt-3 grid grid-cols-4 gap-2 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">km</p>
                    <p className="font-medium">{ride.distanceKm != null ? ride.distanceKm.toFixed(1) : "—"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Fahrpreis</p>
                    <p className="font-medium">{formatEur(ride.fareAmount)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Trinkgeld</p>
                    <p className="font-medium text-green-600">{ride.tipAmount ? formatEur(ride.tipAmount) : "—"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Zahlung</p>
                    <p className="font-medium">{ride.paymentMethod ? paymentLabels[ride.paymentMethod] || ride.paymentMethod : "—"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Desktop: Table view */}
      <div className="hidden rounded-md border md:block">
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
