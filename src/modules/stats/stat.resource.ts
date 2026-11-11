import { defineResource, head } from "../../core/resource";
import type { ArtifactType } from "../artifact-types/artifact-type.schema";
import { statSchema } from "./stat.schema";

export const statResource = defineResource({
  name: "stats",
  title: "Stats",
  description:
    "Character attributes such as HP, CRIT Rate or Elemental Mastery. Each stat lists the characters that gain it on ascension, the weapons that have it as secondary stat and the artifact types where it can roll.",
  example: "crit-rate",
  schema: statSchema,
  refs: { element: "elements" },
  filters: {
    category: {
      description: "basic | advanced | hidden",
      get: (s) => s.category,
    },
    element: {
      description: "Element slug, for DMG Bonus and RES stats",
      get: (s) => s.element,
    },
  },
  sorts: {},
  summary: (s, ctx) => ({
    ...head("stats", s, ctx),
    category: s.category,
    element: ctx.ref("elements", s.element),
  }),
  detail: (s, ctx) => ({
    ...head("stats", s, ctx),
    category: s.category,
    element: ctx.ref("elements", s.element),
    description: s.description,
    images: ctx.images(s.images),
    characters: ctx.related<{ ascensionStat: string | null }>(
      "characters",
      (c) => c.ascensionStat === s.slug,
    ),
    weapons: ctx.related<{ secondaryStat: string | null }>(
      "weapons",
      (w) => w.secondaryStat === s.slug,
    ),
    artifacts: {
      mainStat: ctx.related<ArtifactType>("artifact-types", (t) =>
        t.mainStats.some((m) => m.stat === s.slug),
      ),
      subStat: ctx.related<ArtifactType>("artifact-types", (t) =>
        t.subStats.some((m) => m.stat === s.slug),
      ),
    },
  }),
});
