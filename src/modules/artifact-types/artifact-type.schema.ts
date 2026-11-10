import { z } from "zod";
import { base, iconOnly } from "../../core/schema";

export const artifactTypeSchema = z
  .object({ ...base, images: iconOnly })
  .strict();

export type ArtifactType = z.infer<typeof artifactTypeSchema>;
