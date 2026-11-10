import { z } from "zod";
import { base, iconOnly } from "../../core/schema";

export const weaponTypeSchema = z
  .object({ ...base, images: iconOnly })
  .strict();

export type WeaponType = z.infer<typeof weaponTypeSchema>;
