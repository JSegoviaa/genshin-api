import { defineResource, head, type Ctx } from "../../core/resource";
import { artifactTypeSchema, type ArtifactStat } from "./artifact-type.schema";

const stats = (list: ArtifactStat[], ctx: Ctx) =>
  list.map((s) => ({ stat: ctx.ref("stats", s.stat), percent: s.percent }));

export const artifactTypeResource = defineResource({
  name: "artifact-types",
  title: "Artifact Types",
  description:
    "The five artifact slots with their possible main stats and sub stats. Each type lists the artifact sets that have a piece for it.",
  example: "flower-of-life",
  schema: artifactTypeSchema,
  refs: { "mainStats.stat": "stats", "subStats.stat": "stats" },
  filters: {
    mainStat: {
      description: "Possible main stat slug, e.g. crit-rate",
      get: (t) => t.mainStats.map((s) => s.stat),
    },
  },
  sorts: {},
  summary: (t, ctx) => ({
    ...head("artifact-types", t, ctx),
    icon: ctx.image(t.images.icon),
  }),
  detail: (t, ctx) => ({
    ...head("artifact-types", t, ctx),
    mainStats: stats(t.mainStats, ctx),
    subStats: stats(t.subStats, ctx),
    images: ctx.images(t.images),
    artifactSets: ctx.related<{ pieces: { type: string }[] }>(
      "artifact-sets",
      (s) => s.pieces.some((p) => p.type === t.slug),
    ),
  }),
});
