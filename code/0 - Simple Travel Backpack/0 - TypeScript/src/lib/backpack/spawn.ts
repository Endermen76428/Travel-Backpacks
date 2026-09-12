import { Entity, Player } from "@minecraft/server"
import { getBackpackTier } from "./tier"

export function spawnBackpack(player: Player, itemId: string): Entity {
  let inventoryTier = getBackpackTier(itemId)
  const entity = player.dimension.spawnEntity("travel_backpack:backpack", player.location, {spawnEvent: `travel_backpack:inventory${inventoryTier}`})
  entity.nameTag = `ui.travel_backpack:backpack.size.${inventoryTier}`
  entity.addTag(`travel_backpack:${player.id}`)

  return entity
}