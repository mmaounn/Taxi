"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { VehicleTable } from "@/components/vehicles/vehicle-table";
import { Plus } from "lucide-react";

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vehicles")
      .then((res) => res.json())
      .then((data) => {
        setVehicles(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Vehicles</h1>
        <Button asChild>
          <Link href="/vehicles/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Vehicle
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-gray-500">Loading...</div>
      ) : (
        <VehicleTable vehicles={vehicles} />
      )}
    </div>
  );
}
