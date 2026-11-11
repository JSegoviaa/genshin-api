import { z } from "zod";
import { base, iconOnly, label, ref } from "../../core/schema";

const uniqueRefs = z.array(ref).refine((v) => new Set(v).size === v.length, {
  message: "Values must be unique",
});

const tierSchema = z
  .object({
    requiredAdventureRank: z.number().int().positive().nullable(),
    recommendedLevel: z.number().int().positive().nullable(),
  })
  .strict();

export const domainSchema = z
  .object({
    ...base,
    type: ref,
    region: ref.nullable(),
    area: label.nullable(),
    description: z.string().min(1).nullable(),
    recommendedElements: uniqueRefs,
    tiers: z.array(tierSchema),
    rewards: z.object({ items: uniqueRefs, artifactSets: uniqueRefs }).strict(),
    enemies: uniqueRefs,
    releaseVersion: label.nullable(),
    images: iconOnly,
  })
  .strict();

export type Domain = z.infer<typeof domainSchema>;
