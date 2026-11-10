import { z } from "zod";
import { base, iconOnly } from "../../core/schema";

export const enemyFamilySchema = z
  .object({ ...base, images: iconOnly })
  .strict();

export type EnemyFamily = z.infer<typeof enemyFamilySchema>;
