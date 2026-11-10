import { defineResource, head } from "../../core/resource";
import { artifactTypeSchema } from "./artifact-type.schema";

export const artifactTypeResource = defineResource({
  name: "artifact-types",
  title: "Artifact Types",
  description:
    "The five artifact slots. Each type lists the artifact sets that have a piece for it.",
  example: "flower-of-life",
  schema: artifactTypeSchema,
  refs: {},
  filters: {},
  sorts: {},
  summary: (t, ctx) => ({
    ...head("artifact-types", t, ctx),
    icon: ctx.image(t.images.icon),
  }),
  detail: (t, ctx) => ({
    ...head("artifact-types", t, ctx),
    images: ctx.images(t.images),
    artifactSets: ctx.related<{ pieces: { type: string }[] }>(
      "artifact-sets",
      (s) => s.pieces.some((p) => p.type === t.slug),
    ),
  }),
});
