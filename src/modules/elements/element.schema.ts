import { z } from "zod";
import { base, iconOnly } from "../../core/schema";

export const elementSchema = z.object({ ...base, images: iconOnly }).strict();

export type Element = z.infer<typeof elementSchema>;
