"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";

interface SyncLog {
  id: string;
  platform: string;
  syncType: string;
  recordsImported: number;
  status: string;
  startedAt: string;
  completedAt: string | null;
}

interface SyncStatusCardProps {
  platform: string;
  label: string;
  color: string;
  apiEnabled: boolean;
  lastSync: SyncLog | null;
  onSync: (dateFrom: string, dateTo: string) => Promise<void>;
}

function SyncStatusCard({
  platform,
  label,
  color,
  apiEnabled,
  lastSync,
  onSync,
}: SyncStatusCardProps) {
  const [syncing, setSyncing] = useState(false);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);

  async function handleSync() {
    setSyncing(true);
    try {
      await onSync(dateFrom, dateTo);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${color}`} />
            {label}
          </CardTitle>
          <Badge variant={apiEnabled ? "default" : "secondary"}>
            {apiEnabled ? "API Connected" : "CSV Only"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {lastSync && (
          <div className="flex items-center gap-2 text-sm">
            {lastSync.status === "completed" ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : lastSync.status === "failed" ? (
              <XCircle className="h-4 w-4 text-red-500" />
            ) : (
              <Clock className="h-4 w-4 text-yellow-500" />
            )}
            <span>
              Last sync: {new Date(lastSync.startedAt).toLocaleString()} —{" "}
              {lastSync.recordsImported} records
            </span>
          </div>
        )}

        {apiEnabled && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">From</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">To</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
            <Button
              onClick={handleSync}
              disabled={syncing}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing..." : `Sync ${platform}`}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function SyncStatusCards({
  syncLogs,
  boltConfigured,
  uberConfigured,
}: {
  syncLogs: SyncLog[];
  boltConfigured: boolean;
  uberConfigured: boolean;
}) {
  const getLastSync = (platform: string) =>
    syncLogs.find((l) => l.platform === platform) || null;

  async function syncPlatform(
    platform: string,
    dateFrom: string,
    dateTo: string
  ) {
    try {
      const res = await fetch(`/api/platform-sync/${platform.toLowerCase()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateFrom, dateTo }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || `${platform} sync failed`);
        return;
      }

      toast.success(`${platform}: Imported ${data.imported} rides`);
    } catch {
      toast.error(`${platform} sync failed`);
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <SyncStatusCard
        platform="BOLT"
        label="Bolt"
        color="bg-green-500"
        apiEnabled={boltConfigured}
        lastSync={getLastSync("BOLT")}
        onSync={(from, to) => syncPlatform("BOLT", from, to)}
      />
      <SyncStatusCard
        platform="UBER"
        label="Uber"
        color="bg-black"
        apiEnabled={uberConfigured}
        lastSync={getLastSync("UBER")}
        onSync={(from, to) => syncPlatform("UBER", from, to)}
      />
      <SyncStatusCard
        platform="FREENOW"
        label="FreeNow"
        color="bg-red-500"
        apiEnabled={false}
        lastSync={getLastSync("FREENOW")}
        onSync={async () => {}}
      />
    </div>
  );
}
