import { z } from "zod";
import { parseDecimalInput } from "@/lib/format";

// Coerce to number, return null for empty (so API can clear the field)
const optionalInt = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
  z.number().int().min(2000).max(2030).nullable().optional(),
);

const optionalDecimal = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? null : parseDecimalInput(v as string)),
  z.number().min(0).nullable().optional(),
);

export const vehicleCreateSchema = z.object({
  licensePlate: z.string().min(1, "Kennzeichen ist erforderlich"),
  make: z.preprocess((v) => (v === "" || v === null || v === undefined ? null : v), z.string().nullable().optional()),
  model: z.preprocess((v) => (v === "" || v === null || v === undefined ? null : v), z.string().nullable().optional()),
  year: optionalInt,
  color: z.preprocess((v) => (v === "" || v === null || v === undefined ? null : v), z.string().nullable().optional()),
  monthlyRentalCost: optionalDecimal,
  insuranceMonthlyCost: optionalDecimal,
  otherMonthlyCosts: optionalDecimal,
  insuranceExpiry: z.preprocess((v) => (v === "" || v === null || v === undefined ? null : v), z.string().nullable().optional()),
  registrationExpiry: z.preprocess((v) => (v === "" || v === null || v === undefined ? null : v), z.string().nullable().optional()),
  nextServiceDate: z.preprocess((v) => (v === "" || v === null || v === undefined ? null : v), z.string().nullable().optional()),
  nextInspectionDate: z.preprocess((v) => (v === "" || v === null || v === undefined ? null : v), z.string().nullable().optional()),
});

export const vehicleUpdateSchema = vehicleCreateSchema.partial().extend({
  status: z.enum(["ACTIVE", "MAINTENANCE", "DECOMMISSIONED"]).optional(),
});

export type VehicleCreateInput = z.infer<typeof vehicleCreateSchema>;
export type VehicleUpdateInput = z.infer<typeof vehicleUpdateSchema>;
