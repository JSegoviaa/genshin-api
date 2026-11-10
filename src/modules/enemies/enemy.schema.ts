import { z } from "zod";
import { base, iconOnly, label, ref } from "../../core/schema";

const resistanceSchema = z
  .object({
    stat: ref,
    value: z.number().nullable(),
    immune: z.boolean(),
  })
  .strict()
  .refine((r) => !(r.immune && r.value !== null), {
    message: "Immune resistances must have a null value",
  });

const uniqueRefs = z.array(ref).refine((v) => new Set(v).size === v.length, {
  message: "Values must be unique",
});

export const enemySchema = z
  .object({
    ...base,
    type: ref,
    family: ref,
    group: ref.nullable(),
    region: ref.nullable(),
    elements: z.array(ref).refine((e) => new Set(e).size === e.length, {
      message: "Elements must be unique",
    }),
    releaseVersion: label.nullable(),
    resistances: z.array(resistanceSchema).max(8),
    drops: z.object({ items: uniqueRefs, artifactSets: uniqueRefs }).strict(),
    description: z.string().min(1).nullable(),
    images: iconOnly,
  })
  .strict();

export type Enemy = z.infer<typeof enemySchema>;
export type EnemyResistance = z.infer<typeof resistanceSchema>;
