"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, CheckCircle, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SepaExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settlementIds: string[];
  onExported?: () => void;
}

interface ValidationResult {
  errors: string[];
  warnings: string[];
}

export function SepaExportDialog({
  open,
  onOpenChange,
  settlementIds,
  onExported,
}: SepaExportDialogProps) {
  const [executionDate, setExecutionDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);

  async function handleExport() {
    setLoading(true);
    setValidation(null);

    try {
      const res = await fetch("/api/settlements/sepa-export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settlementIds,
          executionDate,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.errors) {
          setValidation({ errors: data.errors, warnings: data.warnings || [] });
        } else {
          toast.error(data.error || "Export fehlgeschlagen");
        }
        setLoading(false);
        return;
      }

      // Download the XML file
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] ||
        "sepa_export.xml";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("SEPA XML heruntergeladen");
      onExported?.();
      onOpenChange(false);
    } catch {
      toast.error("Export fehlgeschlagen");
    }

    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>SEPA-Auszahlungsdatei generieren</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {settlementIds.length} Abrechnung{settlementIds.length !== 1 ? "en" : ""} für Auszahlungsexport ausgewählt.
          </p>

          <div className="space-y-2">
            <Label>Ausführungsdatum</Label>
            <Input
              type="date"
              value={executionDate}
              onChange={(e) => setExecutionDate(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Das Datum, an dem die Bank die Zahlungen verarbeiten soll
            </p>
          </div>

          {/* Validation Results */}
          {validation && (
            <div className="space-y-2">
              {validation.errors.length > 0 && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <p className="text-sm font-medium text-red-800">
                      {validation.errors.length} Fehler
                    </p>
                  </div>
                  <ul className="space-y-1">
                    {validation.errors.map((err, i) => (
                      <li key={i} className="text-xs text-red-700">
                        {err}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {validation.warnings.length > 0 && (
                <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <p className="text-sm font-medium text-yellow-800">
                      {validation.warnings.length} Warnung{validation.warnings.length !== 1 ? "en" : ""}
                    </p>
                  </div>
                  <ul className="space-y-1">
                    {validation.warnings.map((warn, i) => (
                      <li key={i} className="text-xs text-yellow-700">
                        {warn}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {!validation && (
            <div className="rounded-md border border-green-200 bg-green-50 p-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <p className="text-sm text-green-800">
                  Bereit zur Generierung der SEPA pain.001.001.03 XML
                </p>
              </div>
            </div>
          )}

          <Button
            onClick={handleExport}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            SEPA XML herunterladen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
