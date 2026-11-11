import { z } from "zod";
import { characterConstellationSchema } from "../constellations/constellation.schema";
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
    constellations: z.array(characterConstellationSchema),
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
