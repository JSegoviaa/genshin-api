import type { Lookup } from "../../core/resource";
import type { ItemGroup } from "../item-groups/item-group.schema";
import type { Item } from "../items/item.schema";
import type { Domain } from "./domain.schema";

export const domainGroups = (d: Domain, lookup: Lookup) =>
  lookup.all<ItemGroup>("item-groups").filter((g) => g.domain === d.slug);

export const domainRewards = (d: Domain, lookup: Lookup) => {
  const groups = new Set(domainGroups(d, lookup).map((g) => g.slug));
  const items = lookup.all<Item>("items");
  const ids = new Map(items.map((i) => [i.slug, i.id]));
  const fromGroups = items
    .filter((i) => i.group && groups.has(i.group))
    .map((i) => i.slug);
  return [...new Set([...fromGroups, ...d.rewards.items])].sort(
    (a, b) => (ids.get(a) ?? 0) - (ids.get(b) ?? 0),
  );
};
