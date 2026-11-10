import type { ResourceDef } from "../core/resource";
import type { ResourceName } from "../core/resource-names";
import { artifactSetResource } from "./artifact-sets/artifact-set.resource";
import { artifactTypeResource } from "./artifact-types/artifact-type.resource";
import { artifactResource } from "./artifacts/artifact.resource";
import { characterResource } from "./characters/character.resource";
import { elementResource } from "./elements/element.resource";
import { localSpecialtyResource } from "./local-specialties/local-specialty.resource";
import { rarityResource } from "./rarities/rarity.resource";
import { regionResource } from "./regions/region.resource";
import { statResource } from "./stats/stat.resource";
import { versionResource } from "./versions/version.resource";
import { weaponTypeResource } from "./weapon-types/weapon-type.resource";
import { weaponResource } from "./weapons/weapon.resource";

export const resources: Record<ResourceName, ResourceDef<any>> = {
  elements: elementResource,
  regions: regionResource,
  "weapon-types": weaponTypeResource,
  rarities: rarityResource,
  versions: versionResource,
  "local-specialties": localSpecialtyResource,
  weapons: weaponResource,
  characters: characterResource,
  "artifact-types": artifactTypeResource,
  "artifact-sets": artifactSetResource,
  artifacts: artifactResource,
  stats: statResource,
};
