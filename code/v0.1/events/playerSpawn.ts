import { EntityComponentTypes, EquipmentSlot, world } from "@minecraft/server"
import { addPlayerListen } from "../functions/hold"

world.afterEvents.playerSpawn.subscribe(({player, initialSpawn}) => {
  if(initialSpawn){
    const item = player.getComponent(EntityComponentTypes.Equippable)?.getEquipment(EquipmentSlot.Mainhand)
    if(item?.hasTag("travel_backpack:backpack")){
      addPlayerListen(player, item, player.selectedSlotIndex)
    }
  }
})