"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { SettlementDetail } from "@/components/settlements/settlement-detail";

export default function SettlementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [settlement, setSettlement] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/settlements/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setSettlement(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Wird geladen...</div>;
  if (!settlement) return <div className="py-8 text-center text-red-600">Abrechnung nicht gefunden</div>;

  return (
    <div className="mx-auto max-w-4xl">
      <SettlementDetail settlement={settlement} />
    </div>
  );
}
