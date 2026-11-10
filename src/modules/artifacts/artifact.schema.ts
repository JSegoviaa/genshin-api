import { z } from "zod";
import { base, iconOnly, ref } from "../../core/schema";

export const artifactSchema = z
  .object({
    ...base,
    set: ref,
    type: ref,
    description: z.string().min(1),
    lore: z.string().min(1).nullable(),
    images: iconOnly,
  })
  .strict();

export type Artifact = z.infer<typeof artifactSchema>;
