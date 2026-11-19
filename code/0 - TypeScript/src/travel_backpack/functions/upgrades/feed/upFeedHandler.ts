import { Container, Entity, EntityComponentTypes, EquipmentSlot, ItemComponentTypes, Player, system } from "@minecraft/server"
import { addToGlobalLoop, removeFromGlobalLoop } from "../../../../1-bacs/globalLoop"
import { IFoodInfo, travelBackpackFuncFeed } from "./feedListener"

const feedPatternListenList: { [key: string]: IIntervalInfo } = {} // Backpack Id > Interval Info
let amountOfListeners = 0

function startInverval(): void {
  const backpacks = Object.entries(feedPatternListenList)
  const length = backpacks.length
  let invalidPlayers = 0
  amountOfListeners = length

  for(let i = 0; i < length; i++){
    const [ key, info ] = backpacks[i] ?? []
    if(key == undefined || info == undefined) continue
    const { player, backpack, backpackInv, firstSlot, pattern, slot: playerHand, justOneLoop } = info

    // Remove a backpack da lista quando ela fica inválida
    if(!backpack.isValid){
      invalidPlayers++
      delete feedPatternListenList[key]
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
      if(foodComp == undefined && vanillaFoodList[item.typeId] == undefined){
        backpack.dimension.spawnItem(item, backpack.location)
        backpackInv.setItem(slot, undefined)
        continue
      }

      currentParttern += item.typeId + ","
    }

    if(pattern != currentParttern){
      const invComp = player.getComponent(EntityComponentTypes.Inventory)?.container
      if(invComp == undefined) continue

      const item = invComp.getItem(playerHand)
      if(item == undefined || item.getDynamicProperty("id") != backpack.id) continue

      info.pattern = currentParttern

      if(currentParttern == ",,,,,,,,,"){
        player.removeTag("travel_backpack:feed")
        item.setDynamicProperty("pattern", undefined)
        removeFromGlobalLoop("travelBackpackFeedListener")
        travelBackpackFuncFeed.remove(player)
        backpack.removeTag("can_enable_timer")
      } else {
        item.setDynamicProperty("pattern", currentParttern)
        player.addTag("travel_backpack:feed")
        addToGlobalLoop("travelBackpackFeedListener")
        travelBackpackFuncFeed.add(player, currentParttern)
        backpack.addTag("can_enable_timer")
      }
      invComp.setItem(playerHand, item)
    }

    if(justOneLoop){
      delete feedPatternListenList[key]
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
  add(player: Player, backpack: Entity, backpackInv: Container, firstSlot: number, slot: number, justOneLoop = false): void {
    feedPatternListenList[backpack.id] = { player, backpack, backpackInv, firstSlot, pattern: "", slot, justOneLoop }
    amountOfListeners == 0 && startInverval()
  }

  remove(backpack: Entity): void {
    delete feedPatternListenList[backpack.id]
  }
}

export const vanillaFoodList: { [key: string]: TFoodList } = {
  "minecraft:apple":                  { food: 4,  saturation: 2.4 },
  "minecraft:baked_potato":           { food: 5,  saturation: 6 },
  "minecraft:beetroot":               { food: 1,  saturation: 1.2 },
  "minecraft:beetroot_soup":          { food: 6,  saturation: 7.2 },
  "minecraft:bread":                  { food: 5,  saturation: 6 },
  "minecraft:cake":                   { food: 14, saturation: 2.8 },
  "minecraft:carrot":                 { food: 3,  saturation: 3.6 },
  "minecraft:chorus_fruit":           { food: 4,  saturation: 2.4 }, // Teleporta o player
  "minecraft:cooked_chicken":         { food: 6,  saturation: 7.2 },
  "minecraft:cooked_cod":             { food: 5,  saturation: 6 },
  "minecraft:cooked_mutton":          { food: 6,  saturation: 9.6 },
  "minecraft:cooked_porkchop":        { food: 8,  saturation: 12.8 },
  "minecraft:cooked_rabbit":          { food: 5,  saturation: 6 },
  "minecraft:cooked_salmon":          { food: 6,  saturation: 9.6 },
  "minecraft:cookie":                 { food: 2,  saturation: 0.4 },
  "minecraft:dried_kelp":             { food: 1,  saturation: 0.2 },
  "minecraft:enchanted_golden_apple": { food: 4,  saturation: 9.6, effects: [
    { id: "minecraft:regeneration", time: 30, amplifier: 1, chance: 1 },
    { id: "minecraft:absorption", time: 120, amplifier: 3, chance: 1 },
    { id: "minecraft:resistance", time: 300, amplifier: 0, chance: 1 },
    { id: "minecraft:fire_resistance", time: 300, amplifier: 0, chance: 1 }
  ] },
  "minecraft:glow_berries":           { food: 2,  saturation: 0.4 },
  "minecraft:golden_apple":           { food: 4,  saturation: 9.6, effects: [
    { id: "minecraft:regeneration", time: 5, amplifier: 1, chance: 1 },
    { id: "minecraft:absorption", time: 120, amplifier: 0, chance: 1 }
  ] },
  "minecraft:golden_carrot":          { food: 6,  saturation: 14.4 },
  "minecraft:honey_bottle":           { food: 6,  saturation: 1.2, convert: "minecraft:glass_bottle" }, // Limpa efeito e é convertido pra garrafa vazia
  "minecraft:melon_slice":            { food: 2,  saturation: 1.2 },
  "minecraft:mushroom_stew":          { food: 6,  saturation: 7.2 },
  "minecraft:poisonous_potato":       { food: 2,  saturation: 1.2, effects: [
    {id: "minecraft:poison", time: 5, amplifier: 0, chance: 0.6}
  ] },
  "minecraft:potato":                 { food: 1,  saturation: 0.6 },
  "minecraft:pufferfish":             { food: 1,  saturation: 0.2, effects: [
    { id: "minecraft:poison", time: 60, amplifier: 1, chance: 1 },
    { id: "minecraft:nausea", time: 15, amplifier: 0, chance: 1 },
    { id: "minecraft:hunger", time: 15, amplifier: 2, chance: 1 }
  ] },
  "minecraft:pumpkin_pie":            { food: 8,  saturation: 4.8 },
  "minecraft:rabbit_stew":            { food: 10, saturation: 12 },
  "minecraft:beef":                   { food: 3,  saturation: 1.8 },
  "minecraft:chicken":                { food: 2,  saturation: 1.2, effects: [
    { id: "minecraft:hunger", time: 30, amplifier: 0, chance: 0.3 }
  ] },
  "minecraft:cod":                    { food: 2,  saturation: 0.4 },
  "minecraft:mutton":                 { food: 2,  saturation: 1.2 },
  "minecraft:porkchop":               { food: 3,  saturation: 1.8 },
  "minecraft:rabbit":                 { food: 3,  saturation: 1.8 },
  "minecraft:salmon":                 { food: 2,  saturation: 0.4 },
  "minecraft:rotten_flesh":           { food: 4,  saturation: 0.8, effects: [
    { id: "minecraft:hunger", time: 30, amplifier: 0, chance: 0.8 }
  ] },
  "minecraft:spider_eye":             { food: 2,  saturation: 3.2, effects: [
    {id: "minecraft:poison", time: 5, amplifier: 0, chance: 1}
  ] },
  "minecraft:cooked_beef":            { food: 8,  saturation: 12.8 },
  "minecraft:suspicious_stew":        { food: 6,  saturation: 7.2 },
  "minecraft:sweet_berries":          { food: 2,  saturation: 1.2 },
  "minecraft:tropical_fish":          { food: 1,  saturation: 0.2 }
}

interface IIntervalInfo {
  player: Player
  backpack: Entity
  backpackInv: Container
  firstSlot: number
  pattern: string
  slot: number
  justOneLoop: boolean
}

type TFoodList = Omit<IFoodInfo, "type">