import { defineResource, head, type Lookup } from "../../core/resource";
import type { ArtifactSet } from "../artifact-sets/artifact-set.schema";
import { artifactSchema, type Artifact } from "./artifact.schema";

const setOf = (a: Artifact, lookup: Lookup) =>
  lookup.all<ArtifactSet>("artifact-sets").find((s) => s.slug === a.set);

export const artifactResource = defineResource({
  name: "artifacts",
  title: "Artifacts",
  description:
    "Individual artifact pieces with their set, slot, description and lore. Rarities come from their set.",
  example: "witchs-flower-of-blaze",
  schema: artifactSchema,
  refs: { set: "artifact-sets", type: "artifact-types" },
  filters: {
    set: { description: "Artifact set slug", get: (a) => a.set },
    type: {
      description: "Artifact type slug, e.g. circlet-of-logos",
      get: (a) => a.type,
    },
    rarity: {
      description: "Rarity stars (1-5) or rarity slug, e.g. 5 or 5-star",
      get: (a, lookup) =>
        (setOf(a, lookup)?.rarities ?? []).flatMap((r) => [r, `${r}-star`]),
    },
  },
  sorts: {},
  summary: (a, ctx) => ({
    ...head("artifacts", a, ctx),
    set: ctx.ref("artifact-sets", a.set),
    type: ctx.ref("artifact-types", a.type),
    icon: ctx.image(a.images.icon),
  }),
  detail: (a, ctx) => ({
    ...head("artifacts", a, ctx),
    set: ctx.ref("artifact-sets", a.set),
    type: ctx.ref("artifact-types", a.type),
    rarities: (setOf(a, ctx)?.rarities ?? []).map((r) =>
      ctx.refById("rarities", r),
    ),
    description: a.description,
    lore: a.lore,
    images: ctx.images(a.images),
  }),
});
