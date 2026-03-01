import { z } from "zod";
import { parseDecimalInput } from "@/lib/format";

export const settlementCreateSchema = z.object({
  driverId: z.string().min(1, "Driver is required"),
  periodStart: z.string().min(1, "Period start is required"),
  periodEnd: z.string().min(1, "Period end is required"),
  batch: z.boolean().optional(),
});

export const settlementUpdateSchema = z.object({
  status: z.enum(["DRAFT", "CALCULATED", "APPROVED", "PAID", "DISPUTED"]).optional(),
  cashCollectedByDriver: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : parseDecimalInput(v as string)),
    z.number().min(0).optional(),
  ),
  notes: z.string().optional(),
  payoutReference: z.string().optional(),
  payoutDate: z.string().optional(),
});

export type SettlementCreateInput = z.infer<typeof settlementCreateSchema>;
export type SettlementUpdateInput = z.infer<typeof settlementUpdateSchema>;
