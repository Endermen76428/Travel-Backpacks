import { world, system, Dimension, Entity, EntityComponentTypes, EquipmentSlot, ItemStack } from "@minecraft/server"
import { loadBackpackChunk } from "../functions/loadChunk"
import { addPlayerHoldListen } from "../functions/hold"

export const globalBackpackPos = {x: 0.5, y: 384, z: 0.5}
export let OverworldDimension: Dimension

export const backpackSizeTier: { [key: number]: number } = {
  27:  0,
  36:  1,
  54:  2,
  81:  3,
  100: 4,
  120: 5
}

system.run(() => {
  world.gameRules.showTags = false

  OverworldDimension = world.getDimension("overworld")
  const players = world.getAllPlayers()

  if(players.length > 0){
    // Carrega as chunks onde ficam as backpacks ao executar o /reload
    loadBackpackChunk()

    for(let i = 0, len = players.length; i < len; i++){
      const player = players[i]
      if(!player) continue

      const item = player.getComponent(EntityComponentTypes.Equippable)?.getEquipment(EquipmentSlot.Mainhand)
      if(item?.hasTag("travel_backpack:backpack")){
        addPlayerHoldListen(player, item, player.selectedSlotIndex)
      }
    }
  } else {
    // Carrega as chunks onde ficam as backpacks apos algum player entrar
    const event = world.afterEvents.playerSpawn.subscribe(_ => {
      loadBackpackChunk()
      world.afterEvents.playerSpawn.unsubscribe(event)
    })
  }
})