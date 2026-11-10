import { defineResource, head } from "../../core/resource";
import { weaponTypeSchema } from "./weapon-type.schema";

export const weaponTypeResource = defineResource({
  name: "weapon-types",
  schema: weaponTypeSchema,
  refs: {},
  filters: {},
  sorts: {},
  summary: (w, ctx) => ({
    ...head("weapon-types", w, ctx),
    icon: ctx.image(w.images.icon),
  }),
  detail: (w, ctx) => ({
    ...head("weapon-types", w, ctx),
    images: ctx.images(w.images),
    characters: ctx.related<{ weaponType: string }>(
      "characters",
      (c) => c.weaponType === w.slug,
    ),
    weapons: ctx.related<{ weaponType: string }>(
      "weapons",
      (x) => x.weaponType === w.slug,
    ),
  }),
});
