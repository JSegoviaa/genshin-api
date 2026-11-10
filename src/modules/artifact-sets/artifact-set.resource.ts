import { defineResource, head, type Lookup } from "../../core/resource";
import type { ArtifactType } from "../artifact-types/artifact-type.schema";
import type { Artifact } from "../artifacts/artifact.schema";
import { artifactSetSchema, type ArtifactSet } from "./artifact-set.schema";

const piecesOf = (s: ArtifactSet, lookup: Lookup) => {
  const order = new Map(
    lookup.all<ArtifactType>("artifact-types").map((t) => [t.slug, t.id]),
  );
  return lookup
    .all<Artifact>("artifacts")
    .filter((a) => a.set === s.slug)
    .sort((a, b) => (order.get(a.type) ?? 0) - (order.get(b.type) ?? 0));
};

export const artifactSetResource = defineResource({
  name: "artifact-sets",
  title: "Artifact Sets",
  description:
    "Artifact sets with the rarities they drop in, their release version and their pieces.",
  example: "crimson-witch-of-flames",
  schema: artifactSetSchema,
  refs: {
    rarities: { resource: "rarities", key: "id" },
    releaseVersion: { resource: "versions", key: "name" },
  },
  filters: {
    rarity: {
      description:
        "Rarity the set is available in, e.g. 5 or 5-star. Matches any of the set rarities",
      get: (s) => s.rarities.flatMap((r) => [r, `${r}-star`]),
    },
    type: {
      description:
        "Artifact type slug the set has a piece for, e.g. circlet-of-logos",
      get: (s, lookup) => piecesOf(s, lookup).map((a) => a.type),
    },
    releaseVersion: {
      description: "Release version, e.g. 5.0 or luna-i",
      get: (s) => s.releaseVersion,
    },
  },
  sorts: { maxRarity: (s) => Math.max(...s.rarities) },
  summary: (s, ctx) => ({
    ...head("artifact-sets", s, ctx),
    rarities: s.rarities.map((r) => ctx.refById("rarities", r)),
    pieces: piecesOf(s, ctx).length,
    icon: ctx.image(s.images.icon),
  }),
  detail: (s, ctx) => ({
    ...head("artifact-sets", s, ctx),
    rarities: s.rarities.map((r) => ctx.refById("rarities", r)),
    releaseVersion: ctx.refByName("versions", s.releaseVersion),
    pieces: piecesOf(s, ctx).map((a) => ({
      ...ctx.ref("artifacts", a.slug),
      type: ctx.ref("artifact-types", a.type),
    })),
    images: ctx.images(s.images),
  }),
});
