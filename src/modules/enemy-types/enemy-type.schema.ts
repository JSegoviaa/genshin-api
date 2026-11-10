import { z } from "zod";
import { base, iconOnly } from "../../core/schema";

export const enemyTypeSchema = z.object({ ...base, images: iconOnly }).strict();

export type EnemyType = z.infer<typeof enemyTypeSchema>;
