import { defineResource, head } from "../../core/resource";
import { weaponSchema } from "./weapon.schema";

export const weaponResource = defineResource({
  name: "weapons",
  title: "Weapons",
  description:
    "Every weapon with its rarity, type, secondary stat, series, ascension material and release version.",
  example: "staff-of-homa",
  schema: weaponSchema,
  refs: {
    weaponType: "weapon-types",
    rarity: { resource: "rarities", key: "id" },
    secondaryStat: { resource: "stats", key: "name" },
    releaseVersion: { resource: "versions", key: "name" },
  },
  filters: {
    rarity: {
      description: "Rarity stars (1-5) or rarity slug, e.g. 5 or 5-star",
      get: (w) => [w.rarity, `${w.rarity}-star`],
    },
    weaponType: { description: "Weapon type slug", get: (w) => w.weaponType },
    secondaryStat: {
      description: "Secondary stat slug, e.g. crit-rate",
      get: (w) => w.secondaryStat,
    },
    series: {
      description: "Weapon series, e.g. favonius-series",
      get: (w) => w.series,
    },
    releaseVersion: {
      description: "Release version, e.g. 1.3 or luna-i",
      get: (w) => w.releaseVersion,
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
    secondaryStat: ctx.refByName("stats", w.secondaryStat),
    series: w.series,
    ascensionMaterial: w.ascensionMaterial,
    releaseVersion: ctx.refByName("versions", w.releaseVersion),
    images: ctx.images(w.images),
  }),
});
