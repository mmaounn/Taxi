"use client";

import { useEffect, useState } from "react";
import { DriverForm } from "@/components/drivers/driver-form";

export default function NewDriverPage() {
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    fetch("/api/vehicles?status=ACTIVE")
      .then((res) => res.json())
      .then(setVehicles)
      .catch(() => {});
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Add Driver</h1>
      <DriverForm vehicles={vehicles} />
    </div>
  );
}
