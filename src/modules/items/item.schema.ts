import { z } from "zod";
import { base, iconOnly, label, rarity, ref } from "../../core/schema";
import { ITEM_SOURCES } from "./item-source";

export const itemSchema = z
  .object({
    ...base,
    type: ref,
    source: z.enum(ITEM_SOURCES),
    group: ref.nullable(),
    rarity,
    description: z.string().min(1),
    releaseVersion: label.nullable(),
    images: iconOnly,
  })
  .strict();

export type Item = z.infer<typeof itemSchema>;
