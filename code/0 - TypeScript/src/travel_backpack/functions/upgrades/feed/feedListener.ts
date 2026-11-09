import { compatibleAddonsTranslation, BACSFurnaceRecipeScore, BACSFurnaceRecipeDenyScore } from "../../../../1-bacs/recipes/variables"
import { furnaceRecipeList, furnaceRecipeDenyList, furnaceHasRecipe } from "../../../../1-bacs/recipes/furnace/recipes"
import { Block, BlockComponentTypes, Container, Entity, EntityComponentTypes, EntityHungerComponent, EntitySaturationComponent, ItemStack, Player, system, world } from "@minecraft/server"
import { furnaceFuelList } from "../../../../1-bacs/recipes/furnace/fuel"
import { removeFromGlobalLoop } from "../../../../1-bacs/globalLoop"
import { apiNumbers } from "../../../../0-lib/math/numbers"
import { apiWarn } from "../../../../0-lib/player/warn"
import { feedFoodList } from "./upFeedHandler"
import { backpackUpgradesIndex } from "../../../lib/variables"

const playersInfo: { [key: string]: IIntervalInfo } = {}
let execution = 0

export const travelBackpackFuncFeed = new class TravelBackpackFuncFeed {
  add(player: Player, pattern: string): void {
    const inventory = player.getComponent(EntityComponentTypes.Inventory)?.container
    if(inventory == undefined) return

    const hungerComp = player.getComponent(EntityComponentTypes.Hunger)
    const saturationComp = player.getComponent(EntityComponentTypes.Saturation)
    if(hungerComp == undefined || saturationComp == undefined) return

    const nutrition: IFoodInfo[] = []
    const items = pattern.split(",")
    for(let i = 0, len = items.length; i < len; i++){
      const item = items[i]
      if(item == undefined) continue

      const info = feedFoodList[item]
      if(info == undefined){
        // tentar pegar o component de food
        continue
      }

      nutrition.push({type: item, nutrition: info.hunger, saturation: info.saturation})
    }

    nutrition.sort((a, b) => a.nutrition - b.nutrition)

    playersInfo[player.id] = { player, inventory, hungerComp, saturationComp, nutrition, pattern }
  }

  remove(player: Player): void {
    delete playersInfo[player.id]
  }

  update(): void {
    if(execution < 1){
      execution++
      return
    }

    execution = 0

    const players = Object.entries(playersInfo)
    const length = players.length
    let invalids = 0

    for(let i = 0; i < length; i++){
      const [ key, info ] = players[i] ?? []
      if(key == undefined || info == undefined) continue
      const { player, inventory, hungerComp, saturationComp, nutrition, pattern } = info

      // Remove o player da lista quando ela fica inválida
      if(!player.isValid || !inventory.isValid || !hungerComp.isValid){
        invalids++
        delete playersInfo[key]
        continue
      }

      const minNutritionInfo = nutrition[0]
      if(minNutritionInfo == undefined){
        invalids++
        delete playersInfo[key]
        continue
      }

      if(hungerComp.effectiveMax - hungerComp.currentValue >= minNutritionInfo.nutrition || hungerComp.currentValue <= 6){
        let targetNutrition = minNutritionInfo

        for(let i = 1, len = nutrition.length; i < len; i++){
          const nutriInfo = nutrition[i]
          if(nutriInfo == undefined) continue

          console.warn(hungerComp.currentValue + nutriInfo.saturation, ">", hungerComp.effectiveMax, "=", hungerComp.currentValue + nutriInfo.saturation > hungerComp.effectiveMax)
          if(hungerComp.currentValue + nutriInfo.saturation > hungerComp.effectiveMax) continue
          console.warn(targetNutrition.nutrition, ">", nutriInfo.nutrition, "=", targetNutrition.nutrition < nutriInfo.nutrition)
          if(targetNutrition.nutrition > nutriInfo.nutrition) continue

          console.warn("Selecionado:", nutriInfo.type, nutriInfo.nutrition)
          targetNutrition = nutriInfo
        }

        for(let i = 0, len = inventory.size; i < len; i++){
          const item = inventory.getItem(i)
          if(item == undefined) continue
          if(item.hasTag("travel_backpack:backpack") == false) continue
          if(item.getDynamicProperty("pattern") != pattern) continue

          const backpackId = item.getDynamicProperty("id")
          if(typeof backpackId != "string") continue

          const backpackEntity = world.getEntity(backpackId)
          if(backpackEntity == undefined || backpackEntity.isValid == false) continue

          const backpackInv = backpackEntity.getComponent(EntityComponentTypes.Inventory)?.container
          if(backpackInv == undefined) continue

          const firstSlot = backpackUpgradesIndex[backpackInv.size]?.[0]
          if(firstSlot == undefined) continue

          let slot: number | undefined = undefined
          let food: ItemStack | undefined = undefined
          for(let i = firstSlot +32, len = firstSlot +41; i < len; i++){
            const item = backpackInv.getItem(i)
            if(item == undefined || item.typeId != targetNutrition.type) continue
            food = item
            slot = i
            break
          }

          if(food == undefined || slot == undefined) continue

          if(food.amount <= 1){
            backpackInv.setItem(slot, undefined)
          } else {
            food.amount--
            backpackInv.setItem(slot, food)
          }

          hungerComp.setCurrentValue(Math.min(hungerComp.currentValue + targetNutrition.nutrition, hungerComp.effectiveMax))
          saturationComp.setCurrentValue(Math.min(saturationComp.currentValue + targetNutrition.saturation, saturationComp.effectiveMax))

          console.warn(targetNutrition.type, hungerComp.currentValue, saturationComp.currentValue)
        }
      }
    }

    // Desativa o loop se não tiver mais fornalhas
    if(length == invalids){
      removeFromGlobalLoop("travelBackpackFeedListener")
    }
  }
}

interface IIntervalInfo {
  player: Player
  inventory: Container
  pattern: string
  hungerComp: EntityHungerComponent
  saturationComp: EntitySaturationComponent
  nutrition: IFoodInfo[]
}

interface IFoodInfo {
  type: string
  nutrition: number
  saturation: number
}