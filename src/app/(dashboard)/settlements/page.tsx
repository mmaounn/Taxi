"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettlementTable } from "@/components/settlements/settlement-table";
import { Calculator } from "lucide-react";
import { toast } from "sonner";

interface Driver {
  id: string;
  firstName: string;
  lastName: string;
}

export default function SettlementsPage() {
  const [settlements, setSettlements] = useState([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  // Filters
  const [driverFilter, setDriverFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Calculation form
  const [calcDriverId, setCalcDriverId] = useState("");
  const [calcStart, setCalcStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + 1); // Monday
    return d.toISOString().split("T")[0];
  });
  const [calcEnd, setCalcEnd] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + 7); // Sunday
    return d.toISOString().split("T")[0];
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/settlements").then((r) => r.json()),
      fetch("/api/drivers").then((r) => r.json()),
    ]).then(([s, d]) => {
      setSettlements(s);
      setDrivers(d);
      setLoading(false);
    });
  }, []);

  async function fetchSettlements() {
    const params = new URLSearchParams();
    if (driverFilter !== "all") params.set("driverId", driverFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);

    const res = await fetch(`/api/settlements?${params}`);
    if (res.ok) setSettlements(await res.json());
  }

  useEffect(() => {
    if (!loading) fetchSettlements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverFilter, statusFilter]);

  async function handleCalculate(batch: boolean) {
    if (!batch && !calcDriverId) {
      toast.error("Select a driver");
      return;
    }
    setCalculating(true);

    const res = await fetch("/api/settlements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        driverId: batch ? "batch" : calcDriverId,
        periodStart: calcStart,
        periodEnd: calcEnd,
        batch,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Calculation failed");
    } else if (batch) {
      toast.success(`Calculated ${data.results?.length || 0} settlements`);
    } else {
      toast.success("Settlement calculated");
    }

    await fetchSettlements();
    setCalculating(false);
  }

  if (loading) return <div className="py-8 text-center">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settlements</h1>

      {/* Calculate Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Calculate Settlement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Driver</Label>
              <Select value={calcDriverId} onValueChange={setCalcDriverId}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select driver" />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.firstName} {d.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Period Start</Label>
              <Input
                type="date"
                value={calcStart}
                onChange={(e) => setCalcStart(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Period End</Label>
              <Input
                type="date"
                value={calcEnd}
                onChange={(e) => setCalcEnd(e.target.value)}
                className="w-40"
              />
            </div>
            <Button onClick={() => handleCalculate(false)} disabled={calculating}>
              <Calculator className="mr-2 h-4 w-4" />
              Calculate
            </Button>
            <Button
              variant="outline"
              onClick={() => handleCalculate(true)}
              disabled={calculating}
            >
              Calculate All Drivers
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={driverFilter} onValueChange={setDriverFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Drivers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Drivers</SelectItem>
            {drivers.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.firstName} {d.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="CALCULATED">Calculated</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="DISPUTED">Disputed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <SettlementTable settlements={settlements} />
    </div>
  );
}
