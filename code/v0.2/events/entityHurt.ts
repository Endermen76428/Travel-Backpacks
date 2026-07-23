import { world } from "@minecraft/server"

world.beforeEvents.entityHurt.subscribe(ev => {
  console.warn(ev.hurtEntity.typeId)
  ev.cancel = true
}, {entityFilter: {type: "travel_backpack:backpack"}})