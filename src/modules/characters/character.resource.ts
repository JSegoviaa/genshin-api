import { defineResource, head } from "../../core/resource";
import { slugify } from "../../core/slug";
import type { Item } from "../items/item.schema";
import { characterSchema } from "./character.schema";

export const characterResource = defineResource({
  name: "characters",
  title: "Characters",
  description:
    "Playable characters with their element, weapon, region, birthday, materials and constellations.",
  example: "hu-tao",
  schema: characterSchema,
  refs: {
    element: "elements",
    weaponType: "weapon-types",
    region: "regions",
    rarity: { resource: "rarities", key: "id" },
    releaseVersion: { resource: "versions", key: "name" },
    localSpecialty: { resource: "local-specialties", key: "name" },
    ascensionStat: { resource: "stats", key: "name" },
    "materials.boss": { resource: "items", key: "name" },
    "materials.weeklyBoss": { resource: "items", key: "name" },
    "materials.talent": { resource: "items", key: "name" },
    "materials.common": { resource: "items", key: "name" },
  },
  filters: {
    rarity: {
      description: "Rarity stars (4-5) or rarity slug, e.g. 5 or 5-star",
      get: (c) => [c.rarity, `${c.rarity}-star`],
    },
    element: { description: "Element slug", get: (c) => c.element },
    weaponType: { description: "Weapon type slug", get: (c) => c.weaponType },
    region: { description: "Region slug", get: (c) => c.region },
    gender: { description: "male | female", get: (c) => c.gender },
    bodyType: { description: "short | medium | tall", get: (c) => c.bodyType },
    releaseVersion: {
      description: "Release version, e.g. 4.2 or luna-i",
      get: (c) => c.releaseVersion,
    },
    localSpecialty: {
      description: "Local specialty slug, e.g. silk-flower",
      get: (c) => c.localSpecialty,
    },
    ascensionStat: {
      description: "Ascension stat slug, e.g. crit-dmg",
      get: (c) => c.ascensionStat,
    },
    material: {
      description:
        "Item or item group slug used to ascend the character or level up talents, e.g. juvenile-jade or diligence-books",
      get: (c, lookup) => {
        const slugs = [
          c.materials.boss,
          c.materials.weeklyBoss,
          ...c.materials.talent,
          ...c.materials.common,
        ]
          .filter((m): m is string => !!m)
          .map(slugify);
        const groups = lookup
          .all<Item>("items")
          .filter((i) => slugs.includes(i.slug) && i.group)
          .map((i) => i.group as string);
        return [...slugs, ...new Set(groups)];
      },
    },
  },
  sorts: {
    rarity: (c) => c.rarity,
    releaseDate: (c) => c.releaseDate,
  },
  summary: (c, ctx) => ({
    ...head("characters", c, ctx),
    rarity: ctx.refById("rarities", c.rarity),
    element: ctx.ref("elements", c.element),
    weaponType: ctx.ref("weapon-types", c.weaponType),
    region: ctx.ref("regions", c.region),
    gender: c.gender,
    icon: ctx.image(c.images.icon),
  }),
  detail: (c, ctx) => ({
    ...head("characters", c, ctx),
    rarity: ctx.refById("rarities", c.rarity),
    element: ctx.ref("elements", c.element),
    weaponType: ctx.ref("weapon-types", c.weaponType),
    region: ctx.ref("regions", c.region),
    gender: c.gender,
    bodyType: c.bodyType,
    birthday: c.birthday,
    releaseDate: c.releaseDate,
    releaseVersion: ctx.refByName("versions", c.releaseVersion),
    ascensionStat: ctx.refByName("stats", c.ascensionStat),
    localSpecialty: ctx.refByName("local-specialties", c.localSpecialty),
    materials: {
      boss: ctx.refByName("items", c.materials.boss),
      weeklyBoss: ctx.refByName("items", c.materials.weeklyBoss),
      talent: c.materials.talent.map((m) => ctx.refByName("items", m)),
      common: c.materials.common.map((m) => ctx.refByName("items", m)),
    },
    constellations: c.constellations.map((k) => ({
      slug: k.slug,
      name: k.name,
      meaning: k.meaning,
      image: ctx.image(k.images.image),
      levels: k.levels.map((l) => ({
        level: l.level,
        name: l.name,
        description: l.description,
        icon: ctx.image(l.images.icon),
      })),
    })),
    images: ctx.images(c.images),
  }),
});
