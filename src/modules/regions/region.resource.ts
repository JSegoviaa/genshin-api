import { defineResource, head } from "../../core/resource";
import { regionSchema } from "./region.schema";

export const regionResource = defineResource({
  name: "regions",
  title: "Regions",
  description:
    "The nations and lands of Teyvat. Each region lists its characters, local specialties, bosses and domains.",
  example: "liyue",
  schema: regionSchema,
  refs: {},
  filters: {},
  sorts: {},
  summary: (r, ctx) => ({
    ...head("regions", r, ctx),
    icon: ctx.image(r.images.icon),
  }),
  detail: (r, ctx) => ({
    ...head("regions", r, ctx),
    images: ctx.images(r.images),
    characters: ctx.related<{ region: string | null }>(
      "characters",
      (c) => c.region === r.slug,
    ),
    localSpecialties: ctx.related<{ region: string | null }>(
      "local-specialties",
      (l) => l.region === r.slug,
    ),
    enemies: ctx.related<{ region: string | null }>(
      "enemies",
      (e) => e.region === r.slug,
    ),
    domains: ctx.related<{ region: string | null }>(
      "domains",
      (d) => d.region === r.slug,
    ),
  }),
});
