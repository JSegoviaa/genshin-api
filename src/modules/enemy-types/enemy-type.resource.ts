import { defineResource, head } from "../../core/resource";
import { enemyTypeSchema } from "./enemy-type.schema";

export const enemyTypeResource = defineResource({
  name: "enemy-types",
  title: "Enemy Types",
  description:
    "Enemy classifications: common enemies, elites, normal bosses and weekly bosses. Each type lists its enemies.",
  example: "weekly-bosses",
  schema: enemyTypeSchema,
  refs: {},
  filters: {},
  sorts: {},
  summary: (t, ctx) => ({
    ...head("enemy-types", t, ctx),
    icon: ctx.image(t.images.icon),
  }),
  detail: (t, ctx) => ({
    ...head("enemy-types", t, ctx),
    images: ctx.images(t.images),
    enemies: ctx.related<{ type: string }>("enemies", (e) => e.type === t.slug),
  }),
});
