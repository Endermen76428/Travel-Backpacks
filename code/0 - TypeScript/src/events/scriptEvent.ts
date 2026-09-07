import { world, system, Block, Entity, StructureSaveMode, EntityComponentTypes } from "@minecraft/server"
import { backpackSizeEvent } from "../functions/place"
import { backpackSizeTier } from "../lib/variables"

system.afterEvents.scriptEventReceive.subscribe(({id, message, sourceEntity, sourceBlock}) => {
  const exe = scriptEventFunctions[id]
  if(exe) exe(message, sourceEntity, sourceBlock)
}, {namespaces: ["travel_backpack"]})

const scriptEventFunctions: { [jey: string]: (message: string, entity?: Entity, block?: Block) => void } = {
  "travel_backpack:return": (message, entity) => {
    if(!entity) return

    const pos = entity.getDynamicProperty("pos")
    if(typeof pos != "object") return

    entity.teleport(pos)
  },

  "travel_backpack:archive": (message, entity) => {
    if(entity?.isValid){
      entity.addTag("can_remove")
      entity?.remove()
    }
  },

  "travel_backpack:update_level": (message, entity) => {
    if(!entity) return

    let level = entity.getProperty("travel_backpack:level")
    if(typeof level != "number") return
    if(level == -1){
      const inv = entity.getComponent(EntityComponentTypes.Inventory)?.container
      if(inv == undefined) return

      const tier = backpackSizeTier[inv.size]
      if(tier == undefined) return

      console.warn("§cTier inválido!")
      level = tier
      entity.triggerEvent(`travel_backpack:inventory${tier}`)
    }
    console.warn(level)
    entity.nameTag = `ui.travel_backpack:backpack.size.${level}`
  }
}