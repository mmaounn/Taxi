"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { SettlementTable } from "@/components/settlements/settlement-table";

export default function DriverSettlementsPage() {
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settlements")
      .then((r) => r.json())
      .then((data) => {
        setSettlements(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Meine Abrechnungen</h1>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Wird geladen...</div>
      ) : (
        <SettlementTable
          settlements={settlements}
          basePath="/driver-portal/settlements"
        />
      )}
    </div>
  );
}
