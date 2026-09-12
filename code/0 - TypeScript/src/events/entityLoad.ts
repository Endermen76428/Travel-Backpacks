import { world } from "@minecraft/server"
import { furnaceScore } from "../lib/variables"
import { restartFurnaceFunction } from "../functions/upgrades/furnace/restart"

world.afterEvents.entityLoad.subscribe(({entity}) => {
  if(entity.typeId == "travel_backpack:backpack"){

    if(furnaceScore.hasParticipant(entity.id)){ restartFurnaceFunction(furnaceScore, entity.id) }

    if(entity.getProperty("travel_backpack:on_ground") == false){
      entity.triggerEvent("travel_backpack:add_timer")
    }
  }
})