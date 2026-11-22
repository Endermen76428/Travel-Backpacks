import { Container, Dimension, EntityComponentTypes, EquipmentSlot, system, world } from "@minecraft/server"
import { addPlayerHoldListen } from "../functions/hold"

export let BackpackDimension: Dimension
export const dimensionCenter = {x: 0, y: 0, z: 0}

export const backpackSizeFill: { [key: number]: number } = {
  0: 28,  // 27  slot padrão + 1 upgrade slot
  1: 38,  // 36  slot padrão + 2 upgrade slot
  2: 57,  // 54  slot padrão + 3 upgrade slot
  3: 85,  // 81  slot padrão + 4 upgrade slot
  4: 105, // 100 slot padrão + 5 upgrade slot
  5: 126  // 120 slot padrão + 6 upgrade slot
}

export const backpackTypeTier: { [key: number]: string } = {
  0: "travel_backpack:leather_backpack",
  1: "travel_backpack:copper_backpack",
  2: "travel_backpack:iron_backpack",
  3: "travel_backpack:gold_backpack",
  4: "travel_backpack:diamond_backpack",
  5: "travel_backpack:netherite_backpack"
}

export const backpackSizeTier: { [key: number]: number } = {
  30:  0,
  39:  1,
  57:  2,
  84:  3,
  103: 4,
  123: 5
}

export const backpackUpgradesIndex: { [key: number]: [number, number] } = {
  30:  [27,  1], // [ Backpack Size, Upgrade Amount ]
  39:  [36,  2],
  57:  [54,  3],
  84:  [81,  4],
  103: [100, 5],
  123: [120, 6]
}

export const openedBackpacks: { [key: string]: [string, Container, number] } = {} // Player ID > [ Backpack Id, Backpack Inventory, Backpack Size]

system.run(() => {
  world.gameRules.showTags = false

  BackpackDimension = world.getDimension("travel_backpack:backpack")
  world.tickingAreaManager.createTickingArea("backpack", {from: {x: 0, y: 0, z: 0}, to: {x: 0, y: 0, z: 0}, dimension: BackpackDimension})

  const players = world.getAllPlayers()
  if(players.length > 0){
    // Adiciona os jogadores aos seus respectivos Listener caso executem um /reload, para quando entra no mapa é no arquivo playerSpawn.ts
    for(let i = 0, len = players.length; i < len; i++){
      const player = players[i]
      if(!player) continue

      const item = player.getComponent(EntityComponentTypes.Equippable)?.getEquipment(EquipmentSlot.Mainhand)
      if(item?.hasTag("travel_backpack:backpack")) addPlayerHoldListen(player, item, player.selectedSlotIndex)
    }
  }
})