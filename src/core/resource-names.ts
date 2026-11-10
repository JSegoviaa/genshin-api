export const RESOURCE_NAMES = [
  "elements",
  "regions",
  "weapon-types",
  "weapons",
  "characters",
] as const;

export type ResourceName = (typeof RESOURCE_NAMES)[number];
