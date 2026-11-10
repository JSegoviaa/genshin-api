import { z } from "zod";
import { base, iconOnly, ref } from "../../core/schema";

const artifactStatSchema = z
  .object({ stat: ref, percent: z.boolean() })
  .strict();

const artifactStatList = z
  .array(artifactStatSchema)
  .min(1)
  .superRefine((stats, ctx) => {
    const seen = new Set<string>();
    for (const [i, s] of stats.entries()) {
      const key = `${s.stat}:${s.percent}`;
      if (seen.has(key)) {
        ctx.addIssue({
          code: "custom",
          path: [i],
          message: `Duplicated stat ${s.stat}${s.percent ? " (%)" : ""}`,
        });
      }
      seen.add(key);
    }
  });

export const artifactTypeSchema = z
  .object({
    ...base,
    mainStats: artifactStatList,
    subStats: artifactStatList,
    images: iconOnly,
  })
  .strict();

export type ArtifactType = z.infer<typeof artifactTypeSchema>;
export type ArtifactStat = z.infer<typeof artifactStatSchema>;
