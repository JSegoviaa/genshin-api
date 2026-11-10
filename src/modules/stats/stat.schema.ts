import { z } from "zod";
import { base, iconOnly, ref } from "../../core/schema";

export const STAT_CATEGORIES = ["basic", "advanced", "hidden"] as const;

export const statSchema = z
  .object({
    ...base,
    category: z.enum(STAT_CATEGORIES),
    element: ref.nullable(),
    description: z.string().min(1),
    images: iconOnly,
  })
  .strict();

export type Stat = z.infer<typeof statSchema>;
