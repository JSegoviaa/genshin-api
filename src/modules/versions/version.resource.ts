import { defineResource, head } from "../../core/resource";
import { slugify } from "../../core/slug";
import { versionSchema } from "./version.schema";

export const versionResource = defineResource({
  name: "versions",
  title: "Versions",
  description:
    "Game versions with their update title and release date. Each version lists the characters, weapons, artifact sets, enemies, items and local specialties released in it.",
  example: "1-3",
  schema: versionSchema,
  refs: {},
  filters: {},
  sorts: { releaseDate: (v) => v.releaseDate },
  summary: (v, ctx) => ({
    ...head("versions", v, ctx),
    title: v.title,
    releaseDate: v.releaseDate,
  }),
  detail: (v, ctx) => ({
    ...head("versions", v, ctx),
    title: v.title,
    releaseDate: v.releaseDate,
    characters: ctx.related<{ releaseVersion: string }>(
      "characters",
      (c) => slugify(c.releaseVersion) === v.slug,
    ),
    weapons: ctx.related<{ releaseVersion: string | null }>(
      "weapons",
      (w) => !!w.releaseVersion && slugify(w.releaseVersion) === v.slug,
    ),
    artifactSets: ctx.related<{ releaseVersion: string }>(
      "artifact-sets",
      (s) => slugify(s.releaseVersion) === v.slug,
    ),
    enemies: ctx.related<{ releaseVersion: string | null }>(
      "enemies",
      (e) => !!e.releaseVersion && slugify(e.releaseVersion) === v.slug,
    ),
    items: ctx.related<{ releaseVersion: string | null }>(
      "items",
      (i) => !!i.releaseVersion && slugify(i.releaseVersion) === v.slug,
    ),
    localSpecialties: ctx.related<{ releaseVersion: string | null }>(
      "local-specialties",
      (l) => !!l.releaseVersion && slugify(l.releaseVersion) === v.slug,
    ),
  }),
});
