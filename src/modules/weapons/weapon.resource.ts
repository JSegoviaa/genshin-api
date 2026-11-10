import { defineResource, head } from "../../core/resource";
import { weaponSchema } from "./weapon.schema";

export const weaponResource = defineResource({
  name: "weapons",
  title: "Weapons",
  description:
    "Every weapon with its rarity, type, secondary stat, series and ascension material.",
  example: "staff-of-homa",
  schema: weaponSchema,
  refs: {
    weaponType: "weapon-types",
    rarity: { resource: "rarities", key: "id" },
  },
  filters: {
    rarity: {
      description: "Rarity stars (1-5) or rarity slug, e.g. 5 or 5-star",
      get: (w) => [w.rarity, `${w.rarity}-star`],
    },
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
    rarity: ctx.refById("rarities", w.rarity),
    weaponType: ctx.ref("weapon-types", w.weaponType),
    icon: ctx.image(w.images.icon),
  }),
  detail: (w, ctx) => ({
    ...head("weapons", w, ctx),
    rarity: ctx.refById("rarities", w.rarity),
    weaponType: ctx.ref("weapon-types", w.weaponType),
    secondaryStat: w.secondaryStat,
    series: w.series,
    ascensionMaterial: w.ascensionMaterial,
    images: ctx.images(w.images),
  }),
});
