import { defineResource, head } from "../../core/resource";
import { slugify } from "../../core/slug";
import type { Character } from "../characters/character.schema";
import type { Enemy } from "../enemies/enemy.schema";
import { ITEM_SOURCES } from "./item-source";
import { itemSchema } from "./item.schema";

const characterMaterials = (c: Character) =>
  [c.materials.boss, c.materials.weeklyBoss, ...c.materials.common]
    .filter((m): m is string => !!m)
    .map(slugify);

export const itemResource = defineResource({
  name: "items",
  title: "Items",
  description:
    "Character development items dropped by enemies and bosses, with their type, source, group, rarity, description and release version. Each item lists the enemies that drop it and the characters that use it.",
  example: "damaged-mask",
  schema: itemSchema,
  refs: {
    type: "item-types",
    group: "item-groups",
    rarity: { resource: "rarities", key: "id" },
    releaseVersion: { resource: "versions", key: "name" },
  },
  filters: {
    type: { description: "Item type slug", get: (i) => i.type },
    source: {
      description: ITEM_SOURCES.join(" | "),
      get: (i) => i.source,
    },
    group: {
      description: "Item group slug, e.g. hilichurl-materials",
      get: (i) => i.group,
    },
    rarity: {
      description: "Rarity stars (1-5) or rarity slug, e.g. 4 or 4-star",
      get: (i) => [i.rarity, `${i.rarity}-star`],
    },
    releaseVersion: {
      description: "Release version, e.g. 5.0 or luna-i",
      get: (i) => i.releaseVersion,
    },
  },
  sorts: { rarity: (i) => i.rarity },
  summary: (i, ctx) => ({
    ...head("items", i, ctx),
    type: ctx.ref("item-types", i.type),
    source: i.source,
    rarity: ctx.refById("rarities", i.rarity),
    icon: ctx.image(i.images.icon),
  }),
  detail: (i, ctx) => ({
    ...head("items", i, ctx),
    type: ctx.ref("item-types", i.type),
    source: i.source,
    group: ctx.ref("item-groups", i.group),
    rarity: ctx.refById("rarities", i.rarity),
    description: i.description,
    releaseVersion: ctx.refByName("versions", i.releaseVersion),
    images: ctx.images(i.images),
    droppedBy: ctx.related<Enemy>("enemies", (e) =>
      e.drops.items.includes(i.slug),
    ),
    usedBy: ctx.related<Character>("characters", (c) =>
      characterMaterials(c).includes(i.slug),
    ),
  }),
});
