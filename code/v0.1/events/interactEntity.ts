import { upgradeBackpack } from "../functions/upgrade"
import { world } from "@minecraft/server"

world.beforeEvents.playerInteractWithEntity.subscribe(ev => {
  const {player, target, itemStack} = ev
  if(target.typeId != "travel_backpack:backpack") return

  if(itemStack){
    if(itemStack.hasTag("travel_backpack:upgrade")){
      const upgraded = upgradeBackpack.install(player, target, itemStack)
      if(upgraded) ev.cancel = true
    }
  }
})