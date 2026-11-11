import { defineResource, head } from "../../core/resource";
import { slugify } from "../../core/slug";
import type { Character } from "../characters/character.schema";
import type { Enemy } from "../enemies/enemy.schema";
import type { Weapon } from "../weapons/weapon.schema";
import { ITEM_SOURCES, WEEKDAYS } from "./item-source";
import { itemSchema } from "./item.schema";

const characterMaterials = (c: Character) =>
  [c.materials.boss, c.materials.weeklyBoss, ...c.materials.common]
    .filter((m): m is string => !!m)
    .map(slugify);

export const itemResource = defineResource({
  name: "items",
  title: "Items",
  description:
    "Character development items such as enemy drops, ascension gems and weapon ascension materials, with their type, source, group, rarity, description, release version and farming days. Each item lists the enemies that drop it and the characters and weapons that use it.",
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
    days: {
      description: `Day of the week the item can be farmed: ${WEEKDAYS.join(" | ")}`,
      get: (i) => i.days,
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
    days: i.days,
    images: ctx.images(i.images),
    droppedBy: ctx.related<Enemy>("enemies", (e) =>
      e.drops.items.includes(i.slug),
    ),
    usedBy: {
      characters: ctx.related<Character>("characters", (c) =>
        characterMaterials(c).includes(i.slug),
      ),
      weapons: ctx.related<Weapon>("weapons", (w) =>
        [
          ...w.materials.ascension,
          ...w.materials.elite,
          ...w.materials.common,
        ].includes(i.slug),
      ),
    },
  }),
});
