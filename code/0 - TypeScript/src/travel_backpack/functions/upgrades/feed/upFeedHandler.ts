import { Container, Entity, EntityComponentTypes, EquipmentSlot, ItemComponentTypes, Player, system } from "@minecraft/server"
import { addToGlobalLoop, removeFromGlobalLoop } from "../../../../1-bacs/globalLoop"
import { travelBackpackFuncFeed } from "./feedListener"

const craftListenList: { [key: string]: IntervalInfo } = {} // Backpack Id > Interval Info
let amountOfListeners = 0

function startInverval(): void {
  const backpacks = Object.entries(craftListenList)
  const length = backpacks.length
  let invalidPlayers = 0
  amountOfListeners = length

  for(let i = 0; i < length; i++){
    const [ key, info ] = backpacks[i] ?? []
    if(key == undefined || info == undefined) continue
    const { player, backpack, backpackInv, firstSlot, pattern } = info

    // Remove a backpack da lista quando ela fica inválida
    if(!backpack.isValid){
      invalidPlayers++
      delete craftListenList[key]
      continue
    }

    let currentParttern = ""
    for(let i = 0; i < 9; i++){
      const slot = firstSlot + i
      const item = backpackInv.getItem(slot)
      if(item == undefined){
        currentParttern += ","
        continue
      }

      const foodComp = item.getComponent(ItemComponentTypes.Food)
      if(foodComp == undefined && feedFoodList[item.typeId] == undefined){
        backpack.dimension.spawnItem(item, backpack.location)
        backpackInv.setItem(slot, undefined)
        continue
      }

      currentParttern += item.typeId + ","
    }

    if(pattern != currentParttern){
      const equipComp = player.getComponent(EntityComponentTypes.Equippable)
      if(equipComp == undefined) continue

      const item = equipComp.getEquipment(EquipmentSlot.Mainhand)
      if(item == undefined || item.getDynamicProperty("id") != backpack.id) continue

      info.pattern = currentParttern

      if(currentParttern == ",,,,,,,,,"){
        player.removeTag("travel_backpack:feed")
        item.setDynamicProperty("pattern", undefined)
        removeFromGlobalLoop("travelBackpackFeedListener")
        travelBackpackFuncFeed.remove(player)
      } else {
        item.setDynamicProperty("pattern", currentParttern)
        player.addTag("travel_backpack:feed")
        addToGlobalLoop("travelBackpackFeedListener")
        travelBackpackFuncFeed.add(player, currentParttern)
      }
      equipComp.setEquipment(EquipmentSlot.Mainhand, item)
    }
  }

  // Cancela o loop se não tiver mais backpacks
  if(length == invalidPlayers){
    amountOfListeners = 0
    return
  }

  // Reinicia o loop depois de 1 tick
  system.run(() => startInverval())
}

export const feedUpgradeFunctions = new class FeedUpgradeFunctions {
  add(player: Player, backpack: Entity, backpackInv: Container, firstSlot: number): void {
    craftListenList[backpack.id] = { player, backpack, backpackInv, firstSlot, pattern: "" }
    amountOfListeners == 0 && startInverval()
  }

  remove(backpack: Entity): void {
    delete craftListenList[backpack.id]
  }
}

export const feedFoodList: { [key: string]: {hunger: number, saturation: number} } = {
  "minecraft:apple": { hunger: 5, saturation: 6 },
  "minecraft:baked_potato": { hunger: 5, saturation: 6 },
  "minecraft:beef": { hunger: 5, saturation: 6 },
  "minecraft:beetroot": { hunger: 5, saturation: 6 },
  "minecraft:beetroot_soup": { hunger: 5, saturation: 6 },
  "minecraft:bread": { hunger: 5, saturation: 6 },
  "minecraft:carrot": { hunger: 5, saturation: 6 },
  "minecraft:chicken": { hunger: 5, saturation: 6 },
  "minecraft:chorus_fruit": { hunger: 5, saturation: 6 },
  "minecraft:cod": { hunger: 5, saturation: 6 },
  "minecraft:cooked_beef": { hunger: 5, saturation: 6 },
  "minecraft:cooked_chicken": { hunger: 6, saturation: 7.2 },
  "minecraft:cooked_cod": { hunger: 5, saturation: 6 },
  "minecraft:cooked_mutton": { hunger: 5, saturation: 6 },
  "minecraft:cooked_porkchop": { hunger: 5, saturation: 6 },
  "minecraft:cooked_rabbit": { hunger: 5, saturation: 6 },
  "minecraft:cooked_salmon": { hunger: 5, saturation: 6 },
  "minecraft:cookie": { hunger: 5, saturation: 6 },
  "minecraft:dried_kelp": { hunger: 5, saturation: 6 },
  "minecraft:enchanted_golden_apple": { hunger: 5, saturation: 6 },
  "minecraft:glow_berries": { hunger: 5, saturation: 6 },
  "minecraft:golden_apple": { hunger: 5, saturation: 6 },
  "minecraft:golden_carrot": { hunger: 5, saturation: 6 },
  "minecraft:honey_bottle": { hunger: 5, saturation: 6 },
  "minecraft:melon_slice": { hunger: 5, saturation: 6 },
  "minecraft:mushroom_stew": { hunger: 5, saturation: 6 },
  "minecraft:mutton": { hunger: 5, saturation: 6 },
  "minecraft:porkchop": { hunger: 5, saturation: 6 },
  "minecraft:potato": { hunger: 5, saturation: 6 },
  "minecraft:pufferfish": { hunger: 5, saturation: 6 },
  "minecraft:pumpkin_pie": { hunger: 5, saturation: 6 },
  "minecraft:rabbi": { hunger: 5, saturation: 6 },
  "minecraft:rabbit_stew": { hunger: 5, saturation: 6 },
  "minecraft:rotten_flesh": { hunger: 5, saturation: 6 },
  "minecraft:salmon": { hunger: 5, saturation: 6 },
  "minecraft:spider_eye": { hunger: 5, saturation: 6 },
  "minecraft:sweet_berries": { hunger: 5, saturation: 6 },
  "minecraft:tropical_fish": { hunger: 5, saturation: 6 }
}

interface IntervalInfo {
  player: Player
  backpack: Entity
  backpackInv: Container
  firstSlot: number
  pattern: string
}