"use client";

import { useEffect, useState } from "react";
import { SyncStatusCards } from "@/components/platform-sync/sync-status";
import { CSVUpload } from "@/components/platform-sync/csv-upload";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface SyncLog {
  id: string;
  platform: string;
  syncType: string;
  recordsImported: number;
  status: string;
  startedAt: string;
  completedAt: string | null;
}

interface PartnerConfig {
  boltConfigured: boolean;
  uberConfigured: boolean;
}

export default function PlatformSyncPage() {
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [config, setConfig] = useState<PartnerConfig>({
    boltConfigured: false,
    uberConfigured: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          setConfig({
            boltConfigured: !!(data.partner?.boltClientId && data.partner?.boltClientSecret),
            uberConfigured: !!(data.partner?.uberClientId && data.partner?.uberClientSecret),
          });
          setSyncLogs(data.syncLogs || []);
        }
      } catch {
        // Settings API may not exist yet
      }
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) return <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Wird geladen...</div>;

  const statusColors: Record<string, string> = {
    completed: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    running: "bg-yellow-100 text-yellow-800",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Plattform-Synchronisierung</h1>

      <SyncStatusCards
        syncLogs={syncLogs}
        boltConfigured={config.boltConfigured}
        uberConfigured={config.uberConfigured}
      />

      <Separator />

      <CSVUpload />

      <Card>
        <CardHeader>
          <CardTitle>Sync-Verlauf</CardTitle>
        </CardHeader>
        <CardContent>
          {syncLogs.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-4">
              Noch kein Sync-Verlauf
            </p>
          ) : (
            <>
              {/* Mobile card view */}
              <div className="space-y-3 md:hidden">
                {syncLogs.map((log) => (
                  <div key={log.id} className="rounded-md border p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{log.platform}</span>
                      <Badge variant="secondary" className={statusColors[log.status]}>
                        {{ completed: "Abgeschlossen", failed: "Fehlgeschlagen", running: "Läuft" }[log.status] || log.status}
                      </Badge>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-1 text-sm text-gray-600">
                      <span>Typ: {log.syncType === "api" ? "API-Sync" : "CSV-Upload"}</span>
                      <span>Datensätze: {log.recordsImported}</span>
                      <span className="col-span-2 text-xs">{new Date(log.startedAt).toLocaleString("de-AT")}</span>
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop table view */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plattform</TableHead>
                      <TableHead>Typ</TableHead>
                      <TableHead>Datensätze</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Gestartet</TableHead>
                      <TableHead>Abgeschlossen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {syncLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">{log.platform}</TableCell>
                        <TableCell>{log.syncType === "api" ? "API-Sync" : "CSV-Upload"}</TableCell>
                        <TableCell>{log.recordsImported}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={statusColors[log.status]}>
                            {{ completed: "Abgeschlossen", failed: "Fehlgeschlagen", running: "Läuft" }[log.status] || log.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(log.startedAt).toLocaleString("de-AT")}</TableCell>
                        <TableCell>
                          {log.completedAt
                            ? new Date(log.completedAt).toLocaleString("de-AT")
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
