"use client";

import { VehicleForm } from "@/components/vehicles/vehicle-form";

export default function NewVehiclePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Fahrzeug hinzufügen</h1>
      <VehicleForm />
    </div>
  );
}
