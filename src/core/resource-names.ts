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
  "artifacts",
  "stats",
  "enemy-types",
  "enemy-families",
  "enemy-groups",
  "enemies",
] as const;

export type ResourceName = (typeof RESOURCE_NAMES)[number];
