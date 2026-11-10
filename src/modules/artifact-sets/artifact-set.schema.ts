import { z } from "zod";
import { base, iconOnly, label, rarity } from "../../core/schema";

export const artifactSetSchema = z
  .object({
    ...base,
    rarities: z
      .array(rarity)
      .min(1)
      .refine((r) => r.every((v, i) => i === 0 || v > r[i - 1]), {
        message: "Rarities must be unique and sorted ascending",
      }),
    releaseVersion: label,
    images: iconOnly,
  })
  .strict();

export type ArtifactSet = z.infer<typeof artifactSetSchema>;
