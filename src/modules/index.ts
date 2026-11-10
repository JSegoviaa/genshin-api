import type { ResourceDef } from "../core/resource";
import type { ResourceName } from "../core/resource-names";
import { characterResource } from "./characters/character.resource";
import { elementResource } from "./elements/element.resource";
import { rarityResource } from "./rarities/rarity.resource";
import { regionResource } from "./regions/region.resource";
import { weaponTypeResource } from "./weapon-types/weapon-type.resource";
import { weaponResource } from "./weapons/weapon.resource";

export const resources: Record<ResourceName, ResourceDef<any>> = {
  elements: elementResource,
  regions: regionResource,
  "weapon-types": weaponTypeResource,
  rarities: rarityResource,
  weapons: weaponResource,
  characters: characterResource,
};
