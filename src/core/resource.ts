import type { z } from "zod";
import type { ResourceName } from "./resource-names";

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

export interface RefTarget {
  resource: ResourceName;
  key: "id" | "slug";
}

export interface Ctx {
  ref(resource: ResourceName, slug: string | null): Ref | null;
  refById(resource: ResourceName, id: number | null): Ref | null;
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
  title: string;
  description: string;
  example: string;
  schema: z.ZodType<T>;
  refs: Partial<Record<keyof T & string, ResourceName | RefTarget>>;
  filters: Record<string, FilterDef<T>>;
  sorts: Record<string, (item: T) => string | number>;
  summary(item: T, ctx: Ctx): Record<string, unknown>;
  detail(item: T, ctx: Ctx): Record<string, unknown>;
}

export function defineResource<T extends BaseItem>(
  def: ResourceDef<T>,
): ResourceDef<T> {
  return def;
}

export const head = (resource: ResourceName, item: BaseItem, ctx: Ctx) => ({
  id: item.id,
  slug: item.slug,
  name: item.name,
  url: ctx.url(resource, item.slug),
});
