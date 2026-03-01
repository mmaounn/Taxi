"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle, XCircle, Clock, Users } from "lucide-react";
import { toast } from "sonner";
import { WeekPicker } from "@/components/ui/week-picker";
import { getWeekBounds } from "@/lib/date-utils";

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
  const [week, setWeek] = useState(() => getWeekBounds(0));

  async function handleSync() {
    setSyncing(true);
    try {
      await onSync(week.start, week.end);
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
            {apiEnabled ? "API verbunden" : "Nur CSV"}
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
              Letzter Sync: {new Date(lastSync.startedAt).toLocaleString("de-AT")} —{" "}
              {lastSync.recordsImported} Datensätze
            </span>
          </div>
        )}

        {apiEnabled && (
          <>
            <WeekPicker value={week} onChange={setWeek} />
            <Button
              onClick={handleSync}
              disabled={syncing}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Wird synchronisiert..." : `Sync ${platform}`}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function BoltDriverSyncCard({ boltConfigured }: { boltConfigured: boolean }) {
  const [syncing, setSyncing] = useState(false);

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/platform-sync/bolt-drivers", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Bolt-Fahrer-Sync fehlgeschlagen");
        return;
      }
      toast.success(
        `${data.driversImported} Fahrer und ${data.vehiclesImported} Fahrzeuge von Bolt importiert`
      );
    } catch {
      toast.error("Bolt-Fahrer-Sync fehlgeschlagen");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-green-600" />
          Fahrer & Fahrzeuge von Bolt synchronisieren
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-gray-600">
          Aktive Fahrer und Fahrzeuge aus Ihrem Bolt-Fleet-Konto importieren. Bestehende
          Fahrer werden aktualisiert, neue automatisch angelegt.
        </p>
        <Button
          onClick={handleSync}
          disabled={!boltConfigured || syncing}
          className="w-full"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
          {syncing
            ? "Fahrer werden synchronisiert..."
            : !boltConfigured
            ? "Bolt-API zuerst konfigurieren"
            : "Fahrer & Fahrzeuge synchronisieren"}
        </Button>
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
    <div className="space-y-4">
      <BoltDriverSyncCard boltConfigured={boltConfigured} />
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
    </div>
  );
}
