import { z } from "zod";
import { base, iconOnly, ref } from "../../core/schema";

export const enemyGroupSchema = z
  .object({ ...base, family: ref, images: iconOnly })
  .strict();

export type EnemyGroup = z.infer<typeof enemyGroupSchema>;
