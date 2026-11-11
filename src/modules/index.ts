import type { ResourceDef } from "../core/resource";
import type { ResourceName } from "../core/resource-names";
import { artifactSetResource } from "./artifact-sets/artifact-set.resource";
import { artifactTypeResource } from "./artifact-types/artifact-type.resource";
import { artifactResource } from "./artifacts/artifact.resource";
import { characterResource } from "./characters/character.resource";
import { domainTypeResource } from "./domain-types/domain-type.resource";
import { domainResource } from "./domains/domain.resource";
import { elementResource } from "./elements/element.resource";
import { enemyResource } from "./enemies/enemy.resource";
import { enemyFamilyResource } from "./enemy-families/enemy-family.resource";
import { enemyGroupResource } from "./enemy-groups/enemy-group.resource";
import { enemyTypeResource } from "./enemy-types/enemy-type.resource";
import { itemGroupResource } from "./item-groups/item-group.resource";
import { itemTypeResource } from "./item-types/item-type.resource";
import { itemResource } from "./items/item.resource";
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
  weapons: weaponResource,
  characters: characterResource,
  "artifact-types": artifactTypeResource,
  "artifact-sets": artifactSetResource,
  artifacts: artifactResource,
  stats: statResource,
  "enemy-types": enemyTypeResource,
  "enemy-families": enemyFamilyResource,
  "enemy-groups": enemyGroupResource,
  enemies: enemyResource,
  "item-types": itemTypeResource,
  "item-groups": itemGroupResource,
  items: itemResource,
  "domain-types": domainTypeResource,
  domains: domainResource,
};
