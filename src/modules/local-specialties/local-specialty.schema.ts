import { z } from "zod";
import { base, iconOnly, ref } from "../../core/schema";

export const localSpecialtySchema = z
  .object({
    ...base,
    region: ref.nullable(),
    images: iconOnly,
  })
  .strict();

export type LocalSpecialty = z.infer<typeof localSpecialtySchema>;
