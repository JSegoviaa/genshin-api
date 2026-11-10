import { z } from "zod";
import { base, image, label, rarity, ref } from "../../core/schema";

export const weaponSchema = z
  .object({
    ...base,
    rarity,
    weaponType: ref,
    secondaryStat: label.nullable(),
    series: z.array(label),
    ascensionMaterial: label.nullable(),
    images: z
      .object({
        icon: image.optional(),
        awakenedIcon: image.optional(),
      })
      .strict(),
  })
  .strict();

export type Weapon = z.infer<typeof weaponSchema>;
