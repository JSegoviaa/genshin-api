import { z } from "zod";
import { base, iconOnly, label } from "../../core/schema";

export const itemTypeSchema = z
  .object({ ...base, inventoryCategory: label, images: iconOnly })
  .strict();

export type ItemType = z.infer<typeof itemTypeSchema>;
