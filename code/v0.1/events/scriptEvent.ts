import { world, system, Block, Entity, StructureSaveMode } from "@minecraft/server"

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
    if(!entity) return

    entity.triggerEvent("travel_backpack:remove_timer")
    const pos = {x: entity.location.x, y: entity.dimension.heightRange.max -1, z: entity.location.z}
    entity.teleport(pos)
    world.structureManager.createFromWorld(`travel_backpack:${entity.id}`, entity.dimension, pos, pos, {includeBlocks: false, saveMode: StructureSaveMode.World})
    entity.remove()

  },

  "travel_backpack:remove_chunk_loader": (message, entity) => {
    entity?.remove()
  }
}