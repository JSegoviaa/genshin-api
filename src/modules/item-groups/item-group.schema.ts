import { z } from "zod";
import { base, iconOnly, label, ref } from "../../core/schema";
import { ITEM_SOURCES } from "../items/item-source";

export const itemGroupSchema = z
  .object({
    ...base,
    type: ref,
    source: z.enum(ITEM_SOURCES),
    domain: ref.nullable(),
    domainLevel: label.nullable(),
    images: iconOnly,
  })
  .strict();

export type ItemGroup = z.infer<typeof itemGroupSchema>;
