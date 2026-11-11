import { defineResource, head } from "../../core/resource";
import type { Item } from "../items/item.schema";
import { weaponSchema } from "./weapon.schema";

export const weaponResource = defineResource({
  name: "weapons",
  title: "Weapons",
  description:
    "Every weapon with its rarity, type, secondary stat, series, ascension materials and release version.",
  example: "staff-of-homa",
  schema: weaponSchema,
  refs: {
    weaponType: "weapon-types",
    rarity: { resource: "rarities", key: "id" },
    secondaryStat: { resource: "stats", key: "name" },
    releaseVersion: { resource: "versions", key: "name" },
    "materials.ascension": "items",
    "materials.elite": "items",
    "materials.common": "items",
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
    material: {
      description:
        "Item or item group slug used to ascend the weapon, e.g. aerosiderite or slime-concentrate",
      get: (w, lookup) => {
        const slugs = [
          ...w.materials.ascension,
          ...w.materials.elite,
          ...w.materials.common,
        ];
        const groups = lookup
          .all<Item>("items")
          .filter((i) => slugs.includes(i.slug) && i.group)
          .map((i) => i.group as string);
        return [...slugs, ...new Set(groups)];
      },
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
    materials: {
      ascension: ctx.refs("items", w.materials.ascension),
      elite: ctx.refs("items", w.materials.elite),
      common: ctx.refs("items", w.materials.common),
    },
    releaseVersion: ctx.refByName("versions", w.releaseVersion),
    images: ctx.images(w.images),
  }),
});
