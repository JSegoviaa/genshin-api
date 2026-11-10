import { defineResource, head } from "../../core/resource";
import { regionSchema } from "./region.schema";

export const regionResource = defineResource({
  name: "regions",
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
  }),
});
