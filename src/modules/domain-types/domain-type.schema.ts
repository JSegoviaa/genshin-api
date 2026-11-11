import { z } from "zod";
import { base, iconOnly, label } from "../../core/schema";

export const domainTypeSchema = z
  .object({
    ...base,
    category: label,
    description: z.string().min(1),
    images: iconOnly,
  })
  .strict();

export type DomainType = z.infer<typeof domainTypeSchema>;
