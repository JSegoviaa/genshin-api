import { defineResource, head } from "../../core/resource";
import type { Item } from "../items/item.schema";
import { domainGroups, domainRewards } from "./domain-rewards";
import { domainSchema } from "./domain.schema";

export const domainResource = defineResource({
  name: "domains",
  title: "Domains",
  description:
    "Challenge, trounce, one-time and quest domains with their type, location, recommended elements, difficulty tiers, rewards, bosses and release version. Domains of Forgery and Mastery list the material each level gives and the days it is open.",
  example: "cecilia-garden",
  schema: domainSchema,
  refs: {
    type: "domain-types",
    region: "regions",
    recommendedElements: "elements",
    "rewards.items": "items",
    "rewards.artifactSets": "artifact-sets",
    enemies: "enemies",
    releaseVersion: { resource: "versions", key: "name" },
  },
  filters: {
    type: {
      description: "Domain type slug, e.g. domains-of-blessing",
      get: (d) => d.type,
    },
    region: { description: "Region slug", get: (d) => d.region },
    element: {
      description: "Recommended element slug, e.g. pyro",
      get: (d) => d.recommendedElements,
    },
    reward: {
      description:
        "Item or artifact set slug the domain rewards, e.g. teachings-of-freedom or crimson-witch-of-flames",
      get: (d, lookup) => [
        ...domainRewards(d, lookup),
        ...d.rewards.artifactSets,
      ],
    },
    releaseVersion: {
      description: "Release version, e.g. 1.0 or luna-i",
      get: (d) => d.releaseVersion,
    },
  },
  sorts: {},
  summary: (d, ctx) => ({
    ...head("domains", d, ctx),
    type: ctx.ref("domain-types", d.type),
    region: ctx.ref("regions", d.region),
    icon: ctx.image(d.images.icon),
  }),
  detail: (d, ctx) => {
    const items = ctx.all<Item>("items");
    const levels = domainGroups(d, ctx).map((g) => ({
        name: g.domainLevel,
        days:
          items.find((i) => i.group === g.slug && i.days.length)?.days ?? [],
        group: ctx.ref("item-groups", g.slug),
      }));
    return {
      ...head("domains", d, ctx),
      type: ctx.ref("domain-types", d.type),
      region: ctx.ref("regions", d.region),
      area: d.area,
      description: d.description,
      recommendedElements: ctx.refs("elements", d.recommendedElements),
      tiers: d.tiers,
      levels,
      rewards: {
        items: ctx.refs("items", domainRewards(d, ctx)),
        artifactSets: ctx.refs("artifact-sets", d.rewards.artifactSets),
      },
      enemies: ctx.refs("enemies", d.enemies),
      releaseVersion: ctx.refByName("versions", d.releaseVersion),
      images: ctx.images(d.images),
    };
  },
});
