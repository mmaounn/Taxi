import { z } from "zod";

export const driverCreateSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  taxId: z.string().optional(),
  bankIban: z.string().optional(),
  bankBic: z.string().optional(),
  taxiLicenseNumber: z.string().optional(),
  taxiLicenseExpiry: z.string().optional(),
  commissionModel: z.enum(["PERCENTAGE", "FIXED", "HYBRID", "PER_RIDE"]),
  commissionRate: z.coerce.number().min(0).max(100).optional(),
  fixedFee: z.coerce.number().min(0).optional(),
  hybridThreshold: z.coerce.number().min(0).optional(),
  perRideFee: z.coerce.number().min(0).optional(),
  settlementFrequency: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY"]),
  boltDriverId: z.string().optional(),
  uberDriverUuid: z.string().optional(),
  freenowDriverId: z.string().optional(),
  vehicleId: z.string().optional().or(z.literal("")),
});

export const driverUpdateSchema = driverCreateSchema.partial().extend({
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
});

export type DriverCreateInput = z.infer<typeof driverCreateSchema>;
export type DriverUpdateInput = z.infer<typeof driverUpdateSchema>;
