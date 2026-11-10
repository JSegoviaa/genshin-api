import { z } from "zod";

export const id = z.number().int().positive();
export const slug = z
  .string()
  .regex(
    /^[a-z0-9]+(-[a-z0-9]+)*$/,
    "Invalid slug (only a-z, 0-9 and hyphens)",
  );
export const name = z.string().min(1);
export const ref = slug;
export const label = z.string().min(1);
export const image = z
  .string()
  .regex(/^[a-z0-9][a-z0-9/_.-]*\.(webp|png|svg|jpg)$/, "Invalid image path");
export const rarity = z.number().int().min(1).max(5);
export const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected format YYYY-MM-DD");
export const monthDay = z
  .string()
  .regex(/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, "Expected format MM-DD");

export const base = {
  $schema: z.string().optional(),
  id,
  slug,
  name,
};

export const iconOnly = z.object({ icon: image.optional() }).strict();
