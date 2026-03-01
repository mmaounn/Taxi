"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, Clock, ShieldAlert } from "lucide-react";

interface ExpiryAlert {
  id: string;
  entityType: "driver" | "vehicle";
  entityName: string;
  field: string;
  expiryDate: string;
  severity: "expired" | "critical" | "warning";
  link: string;
}

const severityConfig = {
  expired: {
    color: "text-red-600",
    bg: "bg-red-50 border-red-200",
    icon: ShieldAlert,
    label: "Abgelaufen",
  },
  critical: {
    color: "text-orange-600",
    bg: "bg-orange-50 border-orange-200",
    icon: AlertTriangle,
    label: "< 7 Tage",
  },
  warning: {
    color: "text-yellow-600",
    bg: "bg-yellow-50 border-yellow-200",
    icon: Clock,
    label: "< 30 Tage",
  },
};

export function ExpiryAlerts() {
  const [alerts, setAlerts] = useState<ExpiryAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/expiry-alerts")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setAlerts(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return null;

  if (alerts.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="flex items-center gap-3 py-4">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <p className="text-sm text-green-800">Alle Dokumente sind aktuell</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          Ablaufwarnungen Dokumente ({alerts.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.map((alert) => {
          const config = severityConfig[alert.severity];
          const Icon = config.icon;
          const daysUntil = Math.ceil(
            (new Date(alert.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );

          return (
            <Link
              key={alert.id}
              href={alert.link}
              className={`flex items-center justify-between rounded-md border p-3 transition-colors hover:opacity-80 ${config.bg}`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 ${config.color}`} />
                <div>
                  <p className="text-sm font-medium">{alert.entityName}</p>
                  <p className="text-xs text-gray-600">
                    {alert.field} — {new Date(alert.expiryDate).toLocaleDateString("de-AT")}
                  </p>
                </div>
              </div>
              <span className={`text-xs font-medium ${config.color}`}>
                {daysUntil <= 0
                  ? "Abgelaufen"
                  : daysUntil === 1
                  ? "Noch 1 Tag"
                  : `Noch ${daysUntil} Tage`}
              </span>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
