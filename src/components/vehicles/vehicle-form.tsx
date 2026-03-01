"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { vehicleCreateSchema, type VehicleCreateInput } from "@/lib/validators/vehicle";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

function ExpiryBadge({ dateStr }: { dateStr: string | undefined }) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const now = new Date();
  const daysUntil = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntil <= 0) {
    return <Badge variant="secondary" className="ml-2 bg-red-100 text-red-800">Expired</Badge>;
  }
  if (daysUntil <= 7) {
    return <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-800">{daysUntil}d left</Badge>;
  }
  if (daysUntil <= 30) {
    return <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-800">{daysUntil}d left</Badge>;
  }
  return null;
}

interface VehicleFormProps {
  initialData?: VehicleCreateInput & { id?: string; status?: string };
}

export function VehicleForm({ initialData }: VehicleFormProps) {
  const router = useRouter();
  const isEditing = !!initialData?.id;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<VehicleCreateInput>({
    resolver: zodResolver(vehicleCreateSchema) as any,
    defaultValues: initialData ?? {},
  });

  async function onSubmit(data: VehicleCreateInput) {
    const url = isEditing ? `/api/vehicles/${initialData!.id}` : "/api/vehicles";
    const method = isEditing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      toast.error("Failed to save vehicle");
      return;
    }

    toast.success(isEditing ? "Vehicle updated" : "Vehicle created");
    router.push("/vehicles");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="licensePlate">License Plate *</Label>
            <Input id="licensePlate" {...register("licensePlate")} />
            {errors.licensePlate && (
              <p className="text-sm text-red-600">{errors.licensePlate.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="make">Make</Label>
            <Input id="make" placeholder="e.g. Toyota" {...register("make")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Input id="model" placeholder="e.g. Camry" {...register("model")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="year">Year</Label>
            <Input id="year" type="number" {...register("year")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <Input id="color" {...register("color")} />
          </div>

          {isEditing && (
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={watch("status" as keyof VehicleCreateInput) as string || initialData?.status || "ACTIVE"}
                onValueChange={(v) => setValue("status" as keyof VehicleCreateInput, v as never)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  <SelectItem value="DECOMMISSIONED">Decommissioned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Document Expiry Dates</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="insuranceExpiry">
              Insurance Expiry
              <ExpiryBadge dateStr={watch("insuranceExpiry" as keyof VehicleCreateInput) as string | undefined} />
            </Label>
            <Input
              id="insuranceExpiry"
              type="date"
              {...register("insuranceExpiry" as keyof VehicleCreateInput)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="registrationExpiry">
              Registration Expiry
              <ExpiryBadge dateStr={watch("registrationExpiry" as keyof VehicleCreateInput) as string | undefined} />
            </Label>
            <Input
              id="registrationExpiry"
              type="date"
              {...register("registrationExpiry" as keyof VehicleCreateInput)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Costs</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="monthlyRentalCost">Rental Cost (EUR)</Label>
            <Input
              id="monthlyRentalCost"
              type="number"
              step="0.01"
              {...register("monthlyRentalCost")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="insuranceMonthlyCost">Insurance (EUR)</Label>
            <Input
              id="insuranceMonthlyCost"
              type="number"
              step="0.01"
              {...register("insuranceMonthlyCost")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="otherMonthlyCosts">Other Costs (EUR)</Label>
            <Input
              id="otherMonthlyCosts"
              type="number"
              step="0.01"
              {...register("otherMonthlyCosts")}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : isEditing ? "Update Vehicle" : "Create Vehicle"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
