import { z } from "zod";
import {
  base,
  date,
  iconOnly,
  image,
  label,
  monthDay,
  name,
  ref,
  slug,
} from "../../core/schema";

const constellationLevelSchema = z
  .object({
    level: z.number().int().min(1).max(6),
    name,
    description: z.string(),
    images: iconOnly,
  })
  .strict();

const constellationSchema = z
  .object({
    slug,
    name,
    meaning: z.string(),
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

export const characterSchema = z
  .object({
    ...base,
    rarity: z.number().int().min(4).max(5),
    element: ref.nullable(),
    weaponType: ref,
    region: ref.nullable(),
    gender: z.enum(["male", "female"]),
    bodyType: z.enum(["short", "medium", "tall"]),
    birthday: monthDay.nullable(),
    releaseDate: date,
    releaseVersion: z.string().min(1),
    ascensionStat: ref.nullable(),
    materials: z
      .object({
        boss: ref.nullable(),
        weeklyBoss: ref.nullable(),
        localSpecialty: ref.nullable(),
        talent: z.array(ref),
        common: z.array(ref),
      })
      .strict(),
    constellations: z.array(constellationSchema),
    images: z
      .object({
        icon: image.optional(),
        card: image.optional(),
        inGame: image.optional(),
        wish: image.optional(),
        multiWish: image.optional(),
        partyIcon: image.optional(),
      })
      .strict(),
  })
  .strict();

export type Character = z.infer<typeof characterSchema>;
