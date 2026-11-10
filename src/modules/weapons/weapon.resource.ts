import { defineResource, head } from "../../core/resource";
import { weaponSchema } from "./weapon.schema";

export const weaponResource = defineResource({
  name: "weapons",
  schema: weaponSchema,
  refs: { weaponType: "weapon-types" },
  filters: {
    rarity: { description: "Rarity (1-5)", get: (w) => w.rarity },
    weaponType: { description: "Weapon type slug", get: (w) => w.weaponType },
    secondaryStat: {
      description: "Secondary stat, e.g. crit-rate",
      get: (w) => w.secondaryStat,
    },
    series: {
      description: "Weapon series, e.g. favonius-series",
      get: (w) => w.series,
    },
  },
  sorts: { rarity: (w) => w.rarity },
  summary: (w, ctx) => ({
    ...head("weapons", w, ctx),
    rarity: w.rarity,
    weaponType: ctx.ref("weapon-types", w.weaponType),
    icon: ctx.image(w.images.icon),
  }),
  detail: (w, ctx) => ({
    ...head("weapons", w, ctx),
    rarity: w.rarity,
    weaponType: ctx.ref("weapon-types", w.weaponType),
    secondaryStat: w.secondaryStat,
    series: w.series,
    ascensionMaterial: w.ascensionMaterial,
    images: ctx.images(w.images),
  }),
});
