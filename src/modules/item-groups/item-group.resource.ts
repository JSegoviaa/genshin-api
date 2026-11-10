import { defineResource, head } from "../../core/resource";
import type { Enemy } from "../enemies/enemy.schema";
import type { Item } from "../items/item.schema";
import { ITEM_SOURCES } from "../items/item-source";
import { itemGroupSchema } from "./item-group.schema";

export const itemGroupResource = defineResource({
  name: "item-groups",
  title: "Item Groups",
  description:
    "Groups of items that are the same material in different rarities, such as Hilichurl Materials or Agnidus Agate. Each group lists its items and the enemies that drop them.",
  example: "hilichurl-materials",
  schema: itemGroupSchema,
  refs: { type: "item-types" },
  filters: {
    type: { description: "Item type slug", get: (g) => g.type },
    source: {
      description: ITEM_SOURCES.join(" | "),
      get: (g) => g.source,
    },
  },
  sorts: {},
  summary: (g, ctx) => ({
    ...head("item-groups", g, ctx),
    type: ctx.ref("item-types", g.type),
    source: g.source,
    icon: ctx.image(g.images.icon),
  }),
  detail: (g, ctx) => {
    const items = ctx
      .all<Item>("items")
      .filter((i) => i.group === g.slug)
      .sort((a, b) => a.rarity - b.rarity || a.id - b.id);
    const slugs = new Set(items.map((i) => i.slug));
    return {
      ...head("item-groups", g, ctx),
      type: ctx.ref("item-types", g.type),
      source: g.source,
      images: ctx.images(g.images),
      items: ctx.refs(
        "items",
        items.map((i) => i.slug),
      ),
      droppedBy: ctx.related<Enemy>("enemies", (e) =>
        e.drops.items.some((i) => slugs.has(i)),
      ),
    };
  },
});
