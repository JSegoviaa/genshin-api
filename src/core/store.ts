import type { BaseItem } from "./resource";
import { RESOURCE_NAMES, type ResourceName } from "./resource-names";

export type Dataset = Record<ResourceName, BaseItem[]>;

interface Index {
  items: BaseItem[];
  byId: Map<number, BaseItem>;
  bySlug: Map<string, BaseItem>;
}

export class Store {
  private readonly indexes = new Map<ResourceName, Index>();

  constructor(data: Dataset) {
    for (const name of RESOURCE_NAMES) {
      const items = data[name] ?? [];
      this.indexes.set(name, {
        items,
        byId: new Map(items.map((i) => [i.id, i])),
        bySlug: new Map(items.map((i) => [i.slug, i])),
      });
    }
  }

  all(name: ResourceName): BaseItem[] {
    return this.indexes.get(name)!.items;
  }

  byId(name: ResourceName, id: number): BaseItem | undefined {
    return this.indexes.get(name)!.byId.get(id);
  }

  bySlug(name: ResourceName, slug: string): BaseItem | undefined {
    return this.indexes.get(name)!.bySlug.get(slug);
  }
}
