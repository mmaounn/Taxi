"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ChevronLeft, ChevronRight, Loader2, Search } from "lucide-react";
import { formatEur } from "@/lib/format";
import { DatePicker } from "@/components/ui/date-picker";

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
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);

  const fetchRides = useCallback(async (p: number) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: "30" });
    if (source && source !== "all") params.set("source", source);
    if (driverId && driverId !== "all") params.set("driverId", driverId);
    if (payment && payment !== "all") params.set("payment", payment);
    if (dateFrom) params.set("from", dateFrom);
    if (dateTo) params.set("to", dateTo);

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
  }, [source, driverId, payment, dateFrom, dateTo]);

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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Fahrten</h1>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Fahrer</Label>
              <Select value={driverId} onValueChange={setDriverId}>
                <SelectTrigger className="w-48">
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
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Plattform</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Alle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="BOLT">Bolt</SelectItem>
                  <SelectItem value="UBER">Uber</SelectItem>
                  <SelectItem value="FREENOW">FreeNow</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Zahlung</Label>
              <Select value={payment} onValueChange={setPayment}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Alle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="CASH">Bargeld</SelectItem>
                  <SelectItem value="CARD">Karte</SelectItem>
                  <SelectItem value="IN_APP">In-App</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Von</Label>
              <DatePicker
                value={dateFrom}
                onChange={setDateFrom}
                className="w-40"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Bis</Label>
              <DatePicker
                value={dateTo}
                onChange={setDateTo}
                className="w-40"
              />
            </div>

            <Button
              variant="outline"
              onClick={() => fetchRides(1)}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Suchen
            </Button>
          </div>
        </CardContent>
      </Card>

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
