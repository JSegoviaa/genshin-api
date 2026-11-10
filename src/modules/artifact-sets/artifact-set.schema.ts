import { z } from "zod";
import { base, iconOnly, label, name, rarity, ref } from "../../core/schema";

const pieceSchema = z
  .object({
    type: ref,
    name,
    images: iconOnly,
  })
  .strict();

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
    pieces: z
      .array(pieceSchema)
      .min(1)
      .max(5)
      .superRefine((pieces, ctx) => {
        const seen = new Set<string>();
        for (const [i, p] of pieces.entries()) {
          if (seen.has(p.type)) {
            ctx.addIssue({
              code: "custom",
              path: [i, "type"],
              message: `Duplicated piece type ${p.type}`,
            });
          }
          seen.add(p.type);
        }
      }),
    images: iconOnly,
  })
  .strict();

export type ArtifactSet = z.infer<typeof artifactSetSchema>;
