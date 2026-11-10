import { defineResource, head } from "../../core/resource";
import { enemyFamilySchema } from "./enemy-family.schema";

export const enemyFamilyResource = defineResource({
  name: "enemy-families",
  title: "Enemy Families",
  description:
    "Top-level enemy families such as Hilichurls, The Abyss or Automatons. Each family lists its groups and all its enemies.",
  example: "hilichurls",
  schema: enemyFamilySchema,
  refs: {},
  filters: {},
  sorts: {},
  summary: (f, ctx) => ({
    ...head("enemy-families", f, ctx),
    icon: ctx.image(f.images.icon),
  }),
  detail: (f, ctx) => ({
    ...head("enemy-families", f, ctx),
    images: ctx.images(f.images),
    groups: ctx.related<{ family: string }>(
      "enemy-groups",
      (g) => g.family === f.slug,
    ),
    enemies: ctx.related<{ family: string }>(
      "enemies",
      (e) => e.family === f.slug,
    ),
  }),
});
