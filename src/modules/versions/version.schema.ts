import { z } from "zod";
import { base, date } from "../../core/schema";

export const versionSchema = z
  .object({
    ...base,
    title: z.string().min(1),
    releaseDate: date,
  })
  .strict();

export type Version = z.infer<typeof versionSchema>;
