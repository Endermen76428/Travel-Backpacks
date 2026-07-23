import { world, Entity, Player } from "@minecraft/server"
import { backpackSizeEvent } from "../../functions/place"

export function spawnBackpack(player: Player, itemId: string): Entity {
  const inventorySize = backpackSizeEvent[itemId] ?? 0
  const entity = player.dimension.spawnEntity("travel_backpack:backpack", player.location, {spawnEvent: `travel_backpack:inventory${inventorySize}`})
  entity.nameTag = `ui.travel_backpack:backpack.size.${inventorySize}`
  entity.addTag(player.id)

  return entity
}