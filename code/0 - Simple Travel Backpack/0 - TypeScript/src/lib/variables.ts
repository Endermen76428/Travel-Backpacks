import { EntityComponentTypes, EquipmentSlot, ItemStack, ScoreboardObjective, system, world } from "@minecraft/server"
import { addPlayerHoldListen } from "../functions/hold"

export const backpackTypeTier: { [key: number]: string } = {
  0: "travel_backpack:leather_backpack",
  1: "travel_backpack:copper_backpack",
  2: "travel_backpack:iron_backpack",
  3: "travel_backpack:gold_backpack",
  4: "travel_backpack:diamond_backpack",
  5: "travel_backpack:netherite_backpack"
}

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

  const players = world.getAllPlayers()

  if(players.length > 0){
    // Adiciona os jogadores ao Listener caso executem um /reload
    for(let i = 0, len = players.length; i < len; i++){
      const player = players[i]
      if(!player) continue

      const item = player.getComponent(EntityComponentTypes.Equippable)?.getEquipment(EquipmentSlot.Mainhand)
      if(item?.hasTag("travel_backpack:backpack")){
        addPlayerHoldListen(player, item, player.selectedSlotIndex)
      }
    }
  }
})