import { z } from "zod";

export const vehicleCreateSchema = z.object({
  licensePlate: z.string().min(1, "License plate is required"),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.coerce.number().int().min(2000).max(2030).optional(),
  color: z.string().optional(),
  monthlyRentalCost: z.coerce.number().min(0).optional(),
  insuranceMonthlyCost: z.coerce.number().min(0).optional(),
  otherMonthlyCosts: z.coerce.number().min(0).optional(),
});

export const vehicleUpdateSchema = vehicleCreateSchema.partial().extend({
  status: z.enum(["ACTIVE", "MAINTENANCE", "DECOMMISSIONED"]).optional(),
});

export type VehicleCreateInput = z.infer<typeof vehicleCreateSchema>;
export type VehicleUpdateInput = z.infer<typeof vehicleUpdateSchema>;
