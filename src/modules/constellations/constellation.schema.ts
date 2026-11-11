import { z } from "zod";
import { iconOnly, id, image, label, name, ref, slug } from "../../core/schema";

const constellationLevelSchema = z
  .object({
    level: z.number().int().min(1).max(6),
    name,
    description: z.string(),
    images: iconOnly,
  })
  .strict();

export const characterConstellationSchema = z
  .object({
    id,
    slug,
    name,
    meaning: z.string(),
    releaseVersion: label,
    images: z.object({ image: image.optional() }).strict(),
    levels: z.array(constellationLevelSchema).superRefine((levels, ctx) => {
      const seen = new Set<number>();
      for (const [i, l] of levels.entries()) {
        if (seen.has(l.level)) {
          ctx.addIssue({
            code: "custom",
            path: [i, "level"],
            message: `Duplicated level ${l.level}`,
          });
        }
        seen.add(l.level);
      }
    }),
  })
  .strict();

export const constellationSchema = characterConstellationSchema
  .extend({ character: ref })
  .strict();

export type CharacterConstellation = z.infer<typeof characterConstellationSchema>;
export type Constellation = z.infer<typeof constellationSchema>;
