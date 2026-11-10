import { defineResource, head } from "../../core/resource";
import { enemyGroupSchema } from "./enemy-group.schema";

export const enemyGroupResource = defineResource({
  name: "enemy-groups",
  title: "Enemy Groups",
  description:
    "Enemy groups inside a family, such as Samachurls or Abyss Mages. Each group lists its family and its enemies.",
  example: "samachurls",
  schema: enemyGroupSchema,
  refs: { family: "enemy-families" },
  filters: {
    family: { description: "Enemy family slug", get: (g) => g.family },
  },
  sorts: {},
  summary: (g, ctx) => ({
    ...head("enemy-groups", g, ctx),
    family: ctx.ref("enemy-families", g.family),
    icon: ctx.image(g.images.icon),
  }),
  detail: (g, ctx) => ({
    ...head("enemy-groups", g, ctx),
    family: ctx.ref("enemy-families", g.family),
    images: ctx.images(g.images),
    enemies: ctx.related<{ group: string | null }>(
      "enemies",
      (e) => e.group === g.slug,
    ),
  }),
});
