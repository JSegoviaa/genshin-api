import { defineResource, head } from "../../core/resource";
import { artifactSetSchema } from "./artifact-set.schema";

export const artifactSetResource = defineResource({
  name: "artifact-sets",
  title: "Artifact Sets",
  description:
    "Artifact sets with the rarities they drop in, their release version and the name of each of their pieces.",
  example: "crimson-witch-of-flames",
  schema: artifactSetSchema,
  refs: {
    rarities: { resource: "rarities", key: "id" },
    "pieces.type": "artifact-types",
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
      get: (s) => s.pieces.map((p) => p.type),
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
    pieces: s.pieces.length,
    icon: ctx.image(s.images.icon),
  }),
  detail: (s, ctx) => ({
    ...head("artifact-sets", s, ctx),
    rarities: s.rarities.map((r) => ctx.refById("rarities", r)),
    releaseVersion: ctx.refByName("versions", s.releaseVersion),
    pieces: s.pieces.map((p) => ({
      type: ctx.ref("artifact-types", p.type),
      name: p.name,
      icon: ctx.image(p.images.icon),
    })),
    images: ctx.images(s.images),
  }),
});
