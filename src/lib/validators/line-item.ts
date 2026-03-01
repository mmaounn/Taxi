import { z } from "zod";
import { parseDecimalInput } from "@/lib/format";

const decimalAmount = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : parseDecimalInput(v as string)),
  z.number().min(0.01, "Betrag muss positiv sein"),
);

export const lineItemCreateSchema = z.object({
  type: z.enum(["BONUS", "DEDUCTION"]),
  description: z.string().min(1, "Description is required"),
  amount: decimalAmount,
});

export const lineItemTemplateCreateSchema = z.object({
  type: z.enum(["BONUS", "DEDUCTION"]),
  description: z.string().min(1, "Description is required"),
  amount: decimalAmount,
  scope: z.enum(["MANUAL", "ALL_DRIVERS", "SPECIFIC_DRIVER"]).default("MANUAL"),
  driverId: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

export const lineItemTemplateUpdateSchema = lineItemTemplateCreateSchema.partial();

export type LineItemCreateInput = z.infer<typeof lineItemCreateSchema>;
export type LineItemTemplateCreateInput = z.infer<typeof lineItemTemplateCreateSchema>;
export type LineItemTemplateUpdateInput = z.infer<typeof lineItemTemplateUpdateSchema>;
