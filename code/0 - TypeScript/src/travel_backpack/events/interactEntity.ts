import { upgradeBackpackTier } from "../functions/upgrades/tier"
import { world } from "@minecraft/server"

world.beforeEvents.playerInteractWithEntity.subscribe(ev => {
  const {player, target, itemStack} = ev
  if(target.typeId != "travel_backpack:backpack") return

  if(target.getProperty("travel_backpack:on_ground") == false){
    const backpackId = itemStack?.getDynamicProperty("id")
    if(backpackId == undefined || backpackId != target.id){
      ev.cancel = true
      return
    }
  }

  if(itemStack){
    if(itemStack.hasTag("travel_backpack:upgrade")){
      const upgraded = upgradeBackpackTier.install(player, target, itemStack)
      if(upgraded) ev.cancel = true
    }
  }
})

world.afterEvents.itemUse.subscribe(({source, itemStack}) => {
  if(itemStack.typeId != "minecraft:stick") return

  const hunger = source.getComponent("minecraft:player.hunger")
  const saturation = source.getComponent("minecraft:player.saturation")
  if(hunger == undefined || saturation == undefined) return

  hunger.setCurrentValue(10)
  saturation.setCurrentValue(0)
})