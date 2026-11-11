import { defineResource, head } from "../../core/resource";
import { enemySchema } from "./enemy.schema";

export const enemyResource = defineResource({
  name: "enemies",
  title: "Enemies",
  description:
    "Common enemies, elites and bosses with their type, family, group, region, damage elements, resistances, drops, release version and archive description.",
  example: "ruin-guard",
  schema: enemySchema,
  refs: {
    type: "enemy-types",
    family: "enemy-families",
    group: "enemy-groups",
    region: "regions",
    "resistances.stat": "stats",
    "drops.items": "items",
    "drops.artifactSets": "artifact-sets",
    elements: "elements",
    releaseVersion: { resource: "versions", key: "name" },
  },
  filters: {
    type: {
      description: "Enemy type slug, e.g. elite-enemies",
      get: (e) => e.type,
    },
    family: {
      description: "Enemy family slug, e.g. hilichurls",
      get: (e) => e.family,
    },
    group: {
      description: "Enemy group slug, e.g. samachurls",
      get: (e) => e.group,
    },
    region: {
      description: "Region slug (only bosses have a region)",
      get: (e) => e.region,
    },
    element: {
      description: "Damage element slug, e.g. cryo",
      get: (e) => e.elements,
    },
    drop: {
      description:
        "Item or artifact set slug the enemy drops, e.g. damaged-mask",
      get: (e) => [...e.drops.items, ...e.drops.artifactSets],
    },
    releaseVersion: {
      description: "Release version, e.g. 5.0 or luna-i",
      get: (e) => e.releaseVersion,
    },
  },
  sorts: {},
  summary: (e, ctx) => ({
    ...head("enemies", e, ctx),
    type: ctx.ref("enemy-types", e.type),
    family: ctx.ref("enemy-families", e.family),
    group: ctx.ref("enemy-groups", e.group),
    icon: ctx.image(e.images.icon),
  }),
  detail: (e, ctx) => ({
    ...head("enemies", e, ctx),
    type: ctx.ref("enemy-types", e.type),
    family: ctx.ref("enemy-families", e.family),
    group: ctx.ref("enemy-groups", e.group),
    region: ctx.ref("regions", e.region),
    elements: ctx.refs("elements", e.elements),
    releaseVersion: ctx.refByName("versions", e.releaseVersion),
    resistances: e.resistances.map((r) => ({
      stat: ctx.ref("stats", r.stat),
      value: r.value,
      immune: r.immune,
    })),
    drops: {
      items: ctx.refs("items", e.drops.items),
      artifactSets: ctx.refs("artifact-sets", e.drops.artifactSets),
    },
    domains: ctx.related<{ enemies: string[] }>("domains", (d) =>
      d.enemies.includes(e.slug),
    ),
    description: e.description,
    images: ctx.images(e.images),
  }),
});
