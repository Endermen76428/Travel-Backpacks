import { world, system, Player, EntityComponentTypes } from "@minecraft/server"
import { addPlayerListen } from "../functions/hold"

// const scheduling: { [key: string]: number } = {} // Player Id

world.afterEvents.playerHotbarSelectedSlotChange.subscribe(({player, itemStack, newSlotSelected}) => {
  if(itemStack && itemStack.hasTag("travel_backpack:backpack")){
    // addSchedule(player, newSlotSelected)
    addPlayerListen(player, itemStack, newSlotSelected)
    return
  }
})

// function addSchedule(player: Player, slot: number): void {
//   const has = scheduling[player.id] != undefined
//   scheduling[player.id] = slot

//   if(!has){
//     system.runTimeout(() => {
//       if(!player.isValid){
//         delete scheduling[player.id]
//         return
//       }

//       const lastSlot = scheduling[player.id]
//       if(lastSlot == undefined){
//         delete scheduling[player.id]
//         return
//       }

//       const item = player.getComponent(EntityComponentTypes.Inventory)?.container.getItem(lastSlot)
//       if(item && item.hasTag("travel_backpack:backpack")){
//         delete scheduling[player.id]
//         addPlayerListen(player, item, lastSlot)
//         player.playSound("random.levelup")
//       }
//     }, 3) // DEpois de 0.15 segundos
//   }
// }