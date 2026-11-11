import { defineResource, head, type Lookup } from "../../core/resource";
import type { Enemy } from "../enemies/enemy.schema";
import type { Item } from "../items/item.schema";
import { ITEM_SOURCES } from "../items/item-source";
import { itemGroupSchema, type ItemGroup } from "./item-group.schema";

const members = (g: ItemGroup, lookup: Lookup) =>
  lookup
    .all<Item>("items")
    .filter((i) => i.group === g.slug)
    .sort((a, b) => (a.rarity ?? 0) - (b.rarity ?? 0) || a.id - b.id);

export const groupType = (g: ItemGroup, lookup: Lookup) =>
  members(g, lookup)[0]?.type ?? null;

const groupSource = (g: ItemGroup, lookup: Lookup) =>
  members(g, lookup)[0]?.source ?? null;

export const itemGroupResource = defineResource({
  name: "item-groups",
  title: "Item Groups",
  description:
    "Groups of items that are the same material in different rarities, such as Hilichurl Materials or Agnidus Agate. Each group lists its items, the enemies that drop them and, for domain materials, the domain and level that rewards them.",
  example: "hilichurl-materials",
  schema: itemGroupSchema,
  refs: { domain: "domains" },
  filters: {
    type: {
      description: "Item type slug",
      get: (g, lookup) => groupType(g, lookup),
    },
    source: {
      description: ITEM_SOURCES.join(" | "),
      get: (g, lookup) => groupSource(g, lookup),
    },
    domain: { description: "Domain slug", get: (g) => g.domain },
  },
  sorts: {},
  summary: (g, ctx) => ({
    ...head("item-groups", g, ctx),
    type: ctx.ref("item-types", groupType(g, ctx)),
    source: groupSource(g, ctx),
    icon: ctx.image(g.images.icon),
  }),
  detail: (g, ctx) => {
    const items = members(g, ctx);
    const slugs = new Set(items.map((i) => i.slug));
    return {
      ...head("item-groups", g, ctx),
      type: ctx.ref("item-types", groupType(g, ctx)),
      source: groupSource(g, ctx),
      domain: ctx.ref("domains", g.domain),
      domainLevel: g.domainLevel,
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
