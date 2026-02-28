"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface UploadResult {
  imported: number;
  total: number;
  errors: { message: string; detail?: string }[];
}

export function CSVUpload() {
  const [platform, setPlatform] = useState("BOLT");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith(".csv")) {
      setFile(droppedFile);
      setResult(null);
    } else {
      toast.error("Please upload a CSV file");
    }
  }, []);

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("platform", platform);

    try {
      const res = await fetch("/api/platform-sync/csv-upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Upload failed");
        return;
      }

      setResult(data);
      toast.success(`Imported ${data.imported} rides`);
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>CSV Upload</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BOLT">Bolt</SelectItem>
              <SelectItem value="UBER">Uber</SelectItem>
              <SelectItem value="FREENOW">FreeNow</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div
          className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
            dragOver ? "border-blue-400 bg-blue-50" : "border-gray-300"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {file ? (
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-5 w-5 text-blue-500" />
              <span className="font-medium">{file.name}</span>
              <span className="text-gray-500">
                ({(file.size / 1024).toFixed(1)} KB)
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFile(null);
                  setResult(null);
                }}
              >
                Remove
              </Button>
            </div>
          ) : (
            <>
              <Upload className="mb-2 h-8 w-8 text-gray-400" />
              <p className="text-sm text-gray-600">
                Drag & drop a CSV file here, or{" "}
                <label className="cursor-pointer text-blue-600 hover:underline">
                  browse
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setFile(f);
                        setResult(null);
                      }
                    }}
                  />
                </label>
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Supports Bolt, Uber, and FreeNow CSV formats
              </p>
            </>
          )}
        </div>

        {file && (
          <Button onClick={handleUpload} disabled={uploading} className="w-full">
            {uploading ? "Uploading..." : `Upload ${platform} CSV`}
          </Button>
        )}

        {result && (
          <div className="rounded-md border p-4 space-y-2">
            <div className="flex items-center gap-2">
              {result.errors.length === 0 ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              )}
              <span className="font-medium">
                Imported {result.imported} of {result.total} rides
              </span>
            </div>
            {result.errors.length > 0 && (
              <div className="max-h-40 overflow-y-auto text-sm text-red-600">
                {result.errors.slice(0, 20).map((err, i) => (
                  <p key={i}>
                    {err.message}
                    {err.detail && ` (${err.detail})`}
                  </p>
                ))}
                {result.errors.length > 20 && (
                  <p className="text-gray-500">
                    ...and {result.errors.length - 20} more errors
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
