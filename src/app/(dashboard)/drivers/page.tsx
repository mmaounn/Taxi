"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DriverTable } from "@/components/drivers/driver-table";
import { Plus, Search, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function DriversPage() {
  const [drivers, setDrivers] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  async function fetchDrivers() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter !== "all") params.set("status", statusFilter);

    const res = await fetch(`/api/drivers?${params}`);
    if (res.ok) {
      setDrivers(await res.json());
    }
  }

  async function syncFromBolt() {
    setSyncing(true);
    try {
      const res = await fetch("/api/platform-sync/bolt-drivers", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to sync drivers from Bolt");
        return;
      }
      toast.success(
        `Imported ${data.driversImported} drivers and ${data.vehiclesImported} vehicles from Bolt`
      );
      await fetchDrivers();
    } catch {
      toast.error("Failed to sync drivers from Bolt");
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    fetchDrivers().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading) {
      const timeout = setTimeout(fetchDrivers, 300);
      return () => clearTimeout(timeout);
    }
  }, [search, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Drivers</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={syncFromBolt} disabled={syncing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing..." : "Sync from Bolt"}
          </Button>
          <Button asChild>
            <Link href="/drivers/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Driver
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search drivers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="py-8 text-center text-gray-500">Loading...</div>
      ) : (
        <DriverTable drivers={drivers} />
      )}
    </div>
  );
}
