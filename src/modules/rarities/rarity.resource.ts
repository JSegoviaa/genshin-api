import { defineResource, head } from "../../core/resource";
import { raritySchema } from "./rarity.schema";

export const rarityResource = defineResource({
  name: "rarities",
  title: "Rarities",
  description:
    "Star ratings from 1 to 5. Each rarity lists the characters and weapons that have it.",
  example: "5-star",
  schema: raritySchema,
  refs: {},
  filters: {},
  sorts: {},
  summary: (r, ctx) => ({
    ...head("rarities", r, ctx),
    stars: r.stars,
    icon: ctx.image(r.images.icon),
  }),
  detail: (r, ctx) => ({
    ...head("rarities", r, ctx),
    stars: r.stars,
    images: ctx.images(r.images),
    characters: ctx.related<{ rarity: number }>(
      "characters",
      (c) => c.rarity === r.stars,
    ),
    weapons: ctx.related<{ rarity: number }>(
      "weapons",
      (w) => w.rarity === r.stars,
    ),
  }),
});
