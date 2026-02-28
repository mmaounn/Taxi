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

  if (loading) return <div className="py-8 text-center">Loading...</div>;

  const statusColors: Record<string, string> = {
    completed: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    running: "bg-yellow-100 text-yellow-800",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Platform Sync</h1>

      <SyncStatusCards
        syncLogs={syncLogs}
        boltConfigured={config.boltConfigured}
        uberConfigured={config.uberConfigured}
      />

      <Separator />

      <CSVUpload />

      <Card>
        <CardHeader>
          <CardTitle>Sync History</CardTitle>
        </CardHeader>
        <CardContent>
          {syncLogs.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-4">
              No sync history yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Platform</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Records</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Completed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {syncLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.platform}</TableCell>
                    <TableCell>{log.syncType === "api" ? "API Sync" : "CSV Upload"}</TableCell>
                    <TableCell>{log.recordsImported}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={statusColors[log.status]}>
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(log.startedAt).toLocaleString()}</TableCell>
                    <TableCell>
                      {log.completedAt
                        ? new Date(log.completedAt).toLocaleString()
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
