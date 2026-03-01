import { z } from "zod";
import { parseDecimalInput } from "@/lib/format";

// Coerce to number but treat empty/blank strings as undefined
const optionalInt = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
  z.number().int().min(2000).max(2030).optional(),
);

const optionalDecimal = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : parseDecimalInput(v as string)),
  z.number().min(0).optional(),
);

export const vehicleCreateSchema = z.object({
  licensePlate: z.string().min(1, "Kennzeichen ist erforderlich"),
  make: z.preprocess((v) => (v === null ? undefined : v), z.string().optional()),
  model: z.preprocess((v) => (v === null ? undefined : v), z.string().optional()),
  year: optionalInt,
  color: z.preprocess((v) => (v === null ? undefined : v), z.string().optional()),
  monthlyRentalCost: optionalDecimal,
  insuranceMonthlyCost: optionalDecimal,
  otherMonthlyCosts: optionalDecimal,
  insuranceExpiry: z.preprocess((v) => (v === null || v === "" ? undefined : v), z.string().optional()),
  registrationExpiry: z.preprocess((v) => (v === null || v === "" ? undefined : v), z.string().optional()),
  nextServiceDate: z.preprocess((v) => (v === null || v === "" ? undefined : v), z.string().optional()),
  nextInspectionDate: z.preprocess((v) => (v === null || v === "" ? undefined : v), z.string().optional()),
});

export const vehicleUpdateSchema = vehicleCreateSchema.partial().extend({
  status: z.enum(["ACTIVE", "MAINTENANCE", "DECOMMISSIONED"]).optional(),
});

export type VehicleCreateInput = z.infer<typeof vehicleCreateSchema>;
export type VehicleUpdateInput = z.infer<typeof vehicleUpdateSchema>;
