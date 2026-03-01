"use client";

import { useEffect, useState } from "react";
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
        <div className="py-8 text-center">Wird geladen...</div>
      ) : (
        <SettlementTable
          settlements={settlements}
          basePath="/driver-portal/settlements"
        />
      )}
    </div>
  );
}
