import { defineResource, head } from "../../core/resource";
import { groupType } from "../item-groups/item-group.resource";
import type { ItemGroup } from "../item-groups/item-group.schema";
import { itemTypeSchema } from "./item-type.schema";

export const itemTypeResource = defineResource({
  name: "item-types",
  title: "Item Types",
  description:
    "Item types as shown in the in-game inventory, such as Character Ascension Materials or Local Specialties. Each type lists its groups and items.",
  example: "character-level-up-materials",
  schema: itemTypeSchema,
  refs: {},
  filters: {},
  sorts: {},
  summary: (t, ctx) => ({
    ...head("item-types", t, ctx),
    inventoryCategory: t.inventoryCategory,
    icon: ctx.image(t.images.icon),
  }),
  detail: (t, ctx) => ({
    ...head("item-types", t, ctx),
    inventoryCategory: t.inventoryCategory,
    images: ctx.images(t.images),
    groups: ctx.related<ItemGroup>(
      "item-groups",
      (g) => groupType(g, ctx) === t.slug,
    ),
    items: ctx.related<{ type: string }>("items", (i) => i.type === t.slug),
  }),
});
