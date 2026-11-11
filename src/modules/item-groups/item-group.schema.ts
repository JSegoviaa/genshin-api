import { z } from "zod";
import { base, iconOnly, label, ref } from "../../core/schema";

export const itemGroupSchema = z
  .object({
    ...base,
    domain: ref.nullable(),
    domainLevel: label.nullable(),
    images: iconOnly,
  })
  .strict();

export type ItemGroup = z.infer<typeof itemGroupSchema>;
