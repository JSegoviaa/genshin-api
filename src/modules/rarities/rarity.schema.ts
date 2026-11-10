import { z } from "zod";
import { base, iconOnly, rarity } from "../../core/schema";

export const raritySchema = z
  .object({ ...base, stars: rarity, images: iconOnly })
  .strict()
  .refine((r) => r.id === r.stars, {
    message: "id must be equal to stars",
    path: ["id"],
  });

export type Rarity = z.infer<typeof raritySchema>;
