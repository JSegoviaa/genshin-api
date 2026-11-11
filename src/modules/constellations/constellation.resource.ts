import { defineResource, head, type Lookup } from "../../core/resource";
import { slugify } from "../../core/slug";
import type { Character } from "../characters/character.schema";
import { constellationSchema, type Constellation } from "./constellation.schema";

const characterOf = (k: Constellation, lookup: Lookup) =>
  lookup.all<Character>("characters").find((c) => c.slug === k.character);

export const constellationElement = (k: Constellation, lookup: Lookup) => {
  const element = k.name.match(/\(([^)]+)\)$/)?.[1];
  return element ? slugify(element) : (characterOf(k, lookup)?.element ?? null);
};

export const constellationResource = defineResource({
  name: "constellations",
  title: "Constellations",
  description:
    "Character constellations with their meaning, release version and six levels. Each constellation links to its character; travelers have one per element.",
  example: "papilio-charontis",
  schema: constellationSchema,
  derive: (data) =>
    (data.characters as unknown as Character[])
      .flatMap((c) =>
        c.constellations.map((k) => ({ ...k, character: c.slug })),
      )
      .sort((a, b) => a.id - b.id),
  refs: {
    character: "characters",
    releaseVersion: { resource: "versions", key: "name" },
  },
  filters: {
    character: {
      description: "Character slug, e.g. hu-tao",
      get: (k) => k.character,
    },
    element: {
      description: "Element slug, e.g. pyro",
      get: (k, lookup) => constellationElement(k, lookup),
    },
    region: {
      description: "Region slug of the character",
      get: (k, lookup) => characterOf(k, lookup)?.region ?? null,
    },
    releaseVersion: {
      description: "Release version, e.g. 1.3 or luna-i",
      get: (k) => k.releaseVersion,
    },
  },
  sorts: {},
  summary: (k, ctx) => ({
    ...head("constellations", k, ctx),
    character: ctx.ref("characters", k.character),
    element: ctx.ref("elements", constellationElement(k, ctx)),
    image: ctx.image(k.images.image),
  }),
  detail: (k, ctx) => ({
    ...head("constellations", k, ctx),
    meaning: k.meaning,
    character: ctx.ref("characters", k.character),
    element: ctx.ref("elements", constellationElement(k, ctx)),
    releaseVersion: ctx.refByName("versions", k.releaseVersion),
    image: ctx.image(k.images.image),
    levels: k.levels.map((l) => ({
      level: l.level,
      name: l.name,
      description: l.description,
      icon: ctx.image(l.images.icon),
    })),
  }),
});
