import { addPlayerListen } from "../functions/hold"
import { world } from "@minecraft/server"

const backpackTag = "travel_backpack:backpack"

world.afterEvents.playerInventoryItemChange.subscribe(({player, slot, itemStack, beforeItemStack}) => {
  const currentBackpackId = (r => typeof r != "string" ? undefined : r)(itemStack?.getDynamicProperty("id"))
  const oldBackpackId = (r => typeof r != "string" ? undefined : r)(beforeItemStack?.getDynamicProperty("id"))

  if(currentBackpackId) if(currentBackpackId == oldBackpackId) return

  if(slot == player.selectedSlotIndex){
    if(itemStack?.hasTag(backpackTag)){
      addPlayerListen(player, itemStack, slot)
      return
    }
  }

  // Fará uma verificação para saber se a backpack na mão foi dropada, se foi ele deve cancelar a ação
  // Tem uma minima chance de conseguir dropar o item se trocar muito rapido para a backpack
  // if(!player.isSneaking && beforeItemStack?.hasTag(backpackTag)){
  //   const entities = player.dimension.getEntities({type: "minecraft:item", location: player.getHeadLocation(), maxDistance: 1})
  //   if(!entities) return

  //   let cancel = false
  //   for(let i = 0, len = entities.length; i < len; i++){
  //     if(cancel) return

  //     const entity = entities[i]
  //     if(!entity || !entity.isValid) continue

  //     const item = entity.getComponent(EntityComponentTypes.Item)?.itemStack
  //     if(!item) continue
  //     if(!item.hasTag(backpackTag)) continue

  //     const id = item.getDynamicProperty("id")
  //     if(id != oldBackpackId) continue

  //     system.run(() => {
  //       const hand = player.getComponent(EntityComponentTypes.Equippable)?.getEquipment(EquipmentSlot.Mainhand)
  //       if(hand && hand.getDynamicProperty("id") == id){
  //         cancel = true
  //         entity.remove()
  //         return
  //       }
  //     })
  //   }
  // }
})
// }, {allowedSlots: [0, 1, 2, 3, 4, 5, 6, 7, 8], includeTags: ["travel_backpack:backpack"]})