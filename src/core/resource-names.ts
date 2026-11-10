export const RESOURCE_NAMES = [
  "elements",
  "regions",
  "weapon-types",
  "rarities",
  "versions",
  "local-specialties",
  "weapons",
  "characters",
  "artifact-types",
  "artifact-sets",
  "stats",
] as const;

export type ResourceName = (typeof RESOURCE_NAMES)[number];
