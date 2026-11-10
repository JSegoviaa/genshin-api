import type { z } from "zod";
import {
  characterSchema,
  elementSchema,
  regionSchema,
  weaponSchema,
  weaponTypeSchema,
} from "./schemas";

export const RESOURCE_NAMES = [
  "elements",
  "regions",
  "weapon-types",
  "weapons",
  "characters",
] as const;
export type ResourceName = (typeof RESOURCE_NAMES)[number];

export interface BaseItem {
  id: number;
  slug: string;
  name: string;
  images?: Record<string, string | undefined>;
}

export interface Ref {
  id: number;
  slug: string;
  name: string;
  url: string;
  icon?: string | null;
}

export interface Ctx {
  ref(resource: ResourceName, slug: string | null): Ref | null;
  refs(resource: ResourceName, slugs: string[]): Ref[];
  related<T>(resource: ResourceName, predicate: (item: T) => boolean): Ref[];
  url(resource: ResourceName, slug: string): string;
  image(path: string | undefined): string | null;
  images(
    images: Record<string, string | undefined>,
  ): Record<string, string | null>;
}

type Primitive = string | number | null;

export interface FilterDef<T> {
  description: string;
  get: (item: T) => Primitive | Primitive[];
}

export interface ResourceDef<T extends BaseItem = BaseItem> {
  name: ResourceName;
  schema: z.ZodType<T>;
  refs: Partial<Record<keyof T & string, ResourceName>>;
  filters: Record<string, FilterDef<T>>;
  sorts: Record<string, (item: T) => string | number>;
  summary(item: T, ctx: Ctx): Record<string, unknown>;
  detail(item: T, ctx: Ctx): Record<string, unknown>;
}

function define<T extends BaseItem>(def: ResourceDef<T>): ResourceDef<T> {
  return def;
}

const head = (resource: ResourceName, item: BaseItem, ctx: Ctx) => ({
  id: item.id,
  slug: item.slug,
  name: item.name,
  url: ctx.url(resource, item.slug),
});

const elements = define({
  name: "elements",
  schema: elementSchema,
  refs: {},
  filters: {},
  sorts: {},
  summary: (e, ctx) => ({
    ...head("elements", e, ctx),
    icon: ctx.image(e.images.icon),
  }),
  detail: (e, ctx) => ({
    ...head("elements", e, ctx),
    images: ctx.images(e.images),
    characters: ctx.related<{ element: string | null }>(
      "characters",
      (c) => c.element === e.slug,
    ),
  }),
});

const regions = define({
  name: "regions",
  schema: regionSchema,
  refs: {},
  filters: {},
  sorts: {},
  summary: (r, ctx) => ({
    ...head("regions", r, ctx),
    icon: ctx.image(r.images.icon),
  }),
  detail: (r, ctx) => ({
    ...head("regions", r, ctx),
    images: ctx.images(r.images),
    characters: ctx.related<{ region: string | null }>(
      "characters",
      (c) => c.region === r.slug,
    ),
  }),
});

const weaponTypes = define({
  name: "weapon-types",
  schema: weaponTypeSchema,
  refs: {},
  filters: {},
  sorts: {},
  summary: (w, ctx) => ({
    ...head("weapon-types", w, ctx),
    icon: ctx.image(w.images.icon),
  }),
  detail: (w, ctx) => ({
    ...head("weapon-types", w, ctx),
    images: ctx.images(w.images),
    characters: ctx.related<{ weaponType: string }>(
      "characters",
      (c) => c.weaponType === w.slug,
    ),
    weapons: ctx.related<{ weaponType: string }>(
      "weapons",
      (x) => x.weaponType === w.slug,
    ),
  }),
});

const weapons = define({
  name: "weapons",
  schema: weaponSchema,
  refs: { weaponType: "weapon-types" },
  filters: {
    rarity: { description: "Rarity (1-5)", get: (w) => w.rarity },
    weaponType: { description: "Weapon type slug", get: (w) => w.weaponType },
    secondaryStat: {
      description: "Secondary stat, e.g. crit-rate",
      get: (w) => w.secondaryStat,
    },
    series: {
      description: "Weapon series, e.g. favonius-series",
      get: (w) => w.series,
    },
  },
  sorts: { rarity: (w) => w.rarity },
  summary: (w, ctx) => ({
    ...head("weapons", w, ctx),
    rarity: w.rarity,
    weaponType: ctx.ref("weapon-types", w.weaponType),
    icon: ctx.image(w.images.icon),
  }),
  detail: (w, ctx) => ({
    ...head("weapons", w, ctx),
    rarity: w.rarity,
    weaponType: ctx.ref("weapon-types", w.weaponType),
    secondaryStat: w.secondaryStat,
    series: w.series,
    ascensionMaterial: w.ascensionMaterial,
    images: ctx.images(w.images),
  }),
});

const characters = define({
  name: "characters",
  schema: characterSchema,
  refs: { element: "elements", weaponType: "weapon-types", region: "regions" },
  filters: {
    rarity: { description: "Rarity (4-5)", get: (c) => c.rarity },
    element: { description: "Element slug", get: (c) => c.element },
    weaponType: { description: "Weapon type slug", get: (c) => c.weaponType },
    region: { description: "Region slug", get: (c) => c.region },
    gender: { description: "male | female", get: (c) => c.gender },
    bodyType: { description: "short | medium | tall", get: (c) => c.bodyType },
    releaseVersion: {
      description: "Release version, e.g. 4.2",
      get: (c) => c.releaseVersion,
    },
  },
  sorts: {
    rarity: (c) => c.rarity,
    releaseDate: (c) => c.releaseDate,
  },
  summary: (c, ctx) => ({
    ...head("characters", c, ctx),
    rarity: c.rarity,
    element: ctx.ref("elements", c.element),
    weaponType: ctx.ref("weapon-types", c.weaponType),
    region: ctx.ref("regions", c.region),
    gender: c.gender,
    icon: ctx.image(c.images.icon),
  }),
  detail: (c, ctx) => ({
    ...head("characters", c, ctx),
    rarity: c.rarity,
    element: ctx.ref("elements", c.element),
    weaponType: ctx.ref("weapon-types", c.weaponType),
    region: ctx.ref("regions", c.region),
    gender: c.gender,
    bodyType: c.bodyType,
    birthday: c.birthday,
    releaseDate: c.releaseDate,
    releaseVersion: c.releaseVersion,
    ascensionStat: c.ascensionStat,
    localSpecialty: c.localSpecialty,
    materials: c.materials,
    constellations: c.constellations.map((k) => ({
      slug: k.slug,
      name: k.name,
      meaning: k.meaning,
      image: ctx.image(k.images.image),
      levels: k.levels.map((l) => ({
        level: l.level,
        name: l.name,
        description: l.description,
        icon: ctx.image(l.images.icon),
      })),
    })),
    images: ctx.images(c.images),
  }),
});

export const resources: Record<ResourceName, ResourceDef<any>> = {
  elements,
  regions,
  "weapon-types": weaponTypes,
  weapons,
  characters,
};
