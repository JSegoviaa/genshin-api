import { z } from "zod";
import { base, image, label, rarity, ref } from "../../core/schema";

export const weaponSchema = z
  .object({
    ...base,
    rarity,
    weaponType: ref,
    secondaryStat: ref.nullable(),
    series: z.array(label),
    materials: z
      .object({
        ascension: z.array(ref),
        elite: z.array(ref),
        common: z.array(ref),
      })
      .strict(),
    releaseVersion: label.nullable(),
    images: z
      .object({
        icon: image.optional(),
        awakenedIcon: image.optional(),
      })
      .strict(),
  })
  .strict();

export type Weapon = z.infer<typeof weaponSchema>;
