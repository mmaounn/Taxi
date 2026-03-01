import { z } from "zod";

export const lineItemCreateSchema = z.object({
  type: z.enum(["BONUS", "DEDUCTION"]),
  description: z.string().min(1, "Description is required"),
  amount: z.coerce.number().min(0.01, "Amount must be positive"),
});

export const lineItemTemplateCreateSchema = z.object({
  type: z.enum(["BONUS", "DEDUCTION"]),
  description: z.string().min(1, "Description is required"),
  amount: z.coerce.number().min(0.01, "Amount must be positive"),
  scope: z.enum(["MANUAL", "ALL_DRIVERS", "SPECIFIC_DRIVER"]).default("MANUAL"),
  driverId: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

export const lineItemTemplateUpdateSchema = lineItemTemplateCreateSchema.partial();

export type LineItemCreateInput = z.infer<typeof lineItemCreateSchema>;
export type LineItemTemplateCreateInput = z.infer<typeof lineItemTemplateCreateSchema>;
export type LineItemTemplateUpdateInput = z.infer<typeof lineItemTemplateUpdateSchema>;
