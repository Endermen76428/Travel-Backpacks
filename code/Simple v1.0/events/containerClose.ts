import { world, EntityComponentTypes, Player } from "@minecraft/server"

world.afterEvents.entityContainerClosed.subscribe(({entity: backpack, closeSource}) => {
  const player = closeSource.entity
  if(!player || !player.isValid) return
  if(!(player instanceof Player)) return

  const inventory = backpack.getComponent(EntityComponentTypes.Inventory)?.container
  if(!inventory) return

  for(let i = 0, len = inventory.size; i < len; i++){
    const item = inventory.getItem(i)
    if(item && item.hasTag("travel_backpack:backpack")){
      player.dimension.spawnItem(item, player.location)
      inventory.setItem(i)
    }
  }
}, {entityFilter: {type: "travel_backpack:backpack"}})