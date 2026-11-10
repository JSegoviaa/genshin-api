import { z } from "zod";

const id = z.number().int().positive();
const slug = z
  .string()
  .regex(
    /^[a-z0-9]+(-[a-z0-9]+)*$/,
    "Invalid slug (only a-z, 0-9 and hyphens)",
  );
const name = z.string().min(1);
const ref = slug;
const label = z.string().min(1);
const image = z
  .string()
  .regex(/^[a-z0-9][a-z0-9/_.-]*\.(webp|png|svg|jpg)$/, "Invalid image path");
const rarity = z.number().int().min(1).max(5);
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected format YYYY-MM-DD");
const monthDay = z
  .string()
  .regex(/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, "Expected format MM-DD");

const base = {
  $schema: z.string().optional(),
  id,
  slug,
  name,
};

const iconOnly = z.object({ icon: image.optional() }).strict();

export const elementSchema = z.object({ ...base, images: iconOnly }).strict();
export const regionSchema = z.object({ ...base, images: iconOnly }).strict();
export const weaponTypeSchema = z
  .object({ ...base, images: iconOnly })
  .strict();

export const weaponSchema = z
  .object({
    ...base,
    rarity,
    weaponType: ref,
    secondaryStat: label.nullable(),
    series: z.array(label),
    ascensionMaterial: label.nullable(),
    images: z
      .object({
        icon: image.optional(),
        awakenedIcon: image.optional(),
      })
      .strict(),
  })
  .strict();

const constellationLevelSchema = z
  .object({
    level: z.number().int().min(1).max(6),
    name,
    description: z.string(),
    images: iconOnly,
  })
  .strict();

const constellationSchema = z
  .object({
    slug,
    name,
    meaning: z.string(),
    images: z.object({ image: image.optional() }).strict(),
    levels: z.array(constellationLevelSchema).superRefine((levels, ctx) => {
      const seen = new Set<number>();
      for (const [i, l] of levels.entries()) {
        if (seen.has(l.level)) {
          ctx.addIssue({
            code: "custom",
            path: [i, "level"],
            message: `Duplicated level ${l.level}`,
          });
        }
        seen.add(l.level);
      }
    }),
  })
  .strict();

export const characterSchema = z
  .object({
    ...base,
    rarity: z.number().int().min(4).max(5),
    element: ref.nullable(),
    weaponType: ref,
    region: ref.nullable(),
    gender: z.enum(["male", "female"]),
    bodyType: z.enum(["short", "medium", "tall"]),
    birthday: monthDay.nullable(),
    releaseDate: date,
    releaseVersion: z.string().min(1),
    ascensionStat: label.nullable(),
    localSpecialty: label.nullable(),
    materials: z
      .object({
        boss: label.nullable(),
        weeklyBoss: label.nullable(),
        common: z.array(label),
      })
      .strict(),
    constellations: z.array(constellationSchema),
    images: z
      .object({
        icon: image.optional(),
        card: image.optional(),
        inGame: image.optional(),
        wish: image.optional(),
        multiWish: image.optional(),
        partyIcon: image.optional(),
      })
      .strict(),
  })
  .strict();

export type Element = z.infer<typeof elementSchema>;
export type Region = z.infer<typeof regionSchema>;
export type WeaponType = z.infer<typeof weaponTypeSchema>;
export type Weapon = z.infer<typeof weaponSchema>;
export type Character = z.infer<typeof characterSchema>;
