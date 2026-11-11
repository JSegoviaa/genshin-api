import { z } from "zod";
import { base, iconOnly, label, rarity, ref } from "../../core/schema";
import { ITEM_SOURCES, WEEKDAYS } from "./item-source";

export const itemSchema = z
  .object({
    ...base,
    type: ref,
    source: z.enum(ITEM_SOURCES),
    group: ref.nullable(),
    rarity,
    description: z.string().min(1),
    releaseVersion: label.nullable(),
    days: z
      .array(z.enum(WEEKDAYS))
      .refine(
        (d) =>
          d.every(
            (v, i) =>
              i === 0 || WEEKDAYS.indexOf(v) > WEEKDAYS.indexOf(d[i - 1]),
          ),
        { message: "Days must be unique and in week order" },
      ),
    images: iconOnly,
  })
  .strict();

export type Item = z.infer<typeof itemSchema>;
