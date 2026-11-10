import { z } from "zod";
import { base, iconOnly } from "../../core/schema";

export const regionSchema = z.object({ ...base, images: iconOnly }).strict();

export type Region = z.infer<typeof regionSchema>;
