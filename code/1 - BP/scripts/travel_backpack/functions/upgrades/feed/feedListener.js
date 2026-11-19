import { EntityComponentTypes, world } from "@minecraft/server";
import { removeFromGlobalLoop } from "../../../../1-bacs/globalLoop";
import { backpackUpgradesIndex } from "../../../lib/variables";
import { vanillaFoodList } from "./upFeedHandler";
const playersInfo = {};
let execution = 0;
export const travelBackpackFuncFeed = new class TravelBackpackFuncFeed {
    add(player, pattern) {
        const inventory = player.getComponent(EntityComponentTypes.Inventory)?.container;
        if (inventory == undefined)
            return;
        const hungerComp = player.getComponent(EntityComponentTypes.Hunger);
        const saturationComp = player.getComponent(EntityComponentTypes.Saturation);
        if (hungerComp == undefined || saturationComp == undefined)
            return;
        const nutrition = [];
        const items = pattern.split(",");
        for (let i = 0, len = items.length; i < len; i++) {
            const item = items[i];
            if (item == undefined)
                continue;
            const info = vanillaFoodList[item];
            if (info == undefined) {
                continue;
            }
            nutrition.push({ type: item, food: info.food, saturation: info.saturation, effects: info.effects, convert: info.convert, noConsume: info.noConsume });
        }
        nutrition.sort((a, b) => a.food - b.food);
        playersInfo[player.id] = { player, inventory, hungerComp, saturationComp, nutrition, pattern };
    }
    remove(player) {
        delete playersInfo[player.id];
    }
    update() {
        if (execution < 1) {
            execution++;
            return;
        }
        execution = 0;
        const players = Object.entries(playersInfo);
        const length = players.length;
        let invalids = 0;
        for (let i = 0; i < length; i++) {
            const [key, info] = players[i] ?? [];
            if (key == undefined || info == undefined)
                continue;
            const { player, inventory, hungerComp, saturationComp, nutrition, pattern } = info;
            if (!player.isValid || !inventory.isValid || !hungerComp.isValid) {
                invalids++;
                delete playersInfo[key];
                continue;
            }
            const minNutritionInfo = nutrition[0];
            if (minNutritionInfo == undefined) {
                invalids++;
                delete playersInfo[key];
                continue;
            }
            if (hungerComp.effectiveMax - hungerComp.currentValue >= minNutritionInfo.food || hungerComp.currentValue <= 6) {
                let targetNutrition = minNutritionInfo;
                for (let i = 1, len = nutrition.length; i < len; i++) {
                    const nutriInfo = nutrition[i];
                    if (nutriInfo == undefined)
                        continue;
                    if (hungerComp.currentValue + nutriInfo.saturation > hungerComp.effectiveMax)
                        continue;
                    if (targetNutrition.food > nutriInfo.food)
                        continue;
                    targetNutrition = nutriInfo;
                }
                for (let i = 0, len = inventory.size; i < len; i++) {
                    const item = inventory.getItem(i);
                    if (item == undefined)
                        continue;
                    if (item.hasTag("travel_backpack:backpack") == false)
                        continue;
                    if (item.getDynamicProperty("pattern") != pattern)
                        continue;
                    const backpackId = item.getDynamicProperty("id");
                    if (typeof backpackId != "string")
                        continue;
                    const backpackEntity = world.getEntity(backpackId);
                    if (backpackEntity == undefined || backpackEntity.isValid == false)
                        continue;
                    const backpackInv = backpackEntity.getComponent(EntityComponentTypes.Inventory)?.container;
                    if (backpackInv == undefined)
                        continue;
                    const firstSlot = backpackUpgradesIndex[backpackInv.size]?.[0];
                    if (firstSlot == undefined)
                        continue;
                    let slot = undefined;
                    let food = undefined;
                    for (let i = firstSlot + 32, len = firstSlot + 41; i < len; i++) {
                        const item = backpackInv.getItem(i);
                        if (item == undefined || item.typeId != targetNutrition.type)
                            continue;
                        food = item;
                        slot = i;
                        break;
                    }
                    if (food == undefined || slot == undefined)
                        continue;
                    if (targetNutrition.noConsume == undefined) {
                        if (food.amount <= 1) {
                            backpackInv.setItem(slot, undefined);
                        }
                        else {
                            food.amount--;
                            backpackInv.setItem(slot, food);
                        }
                    }
                    hungerComp.setCurrentValue(Math.min(hungerComp.currentValue + targetNutrition.food, hungerComp.effectiveMax));
                    saturationComp.setCurrentValue(Math.min(saturationComp.currentValue + targetNutrition.saturation, hungerComp.currentValue, saturationComp.effectiveMax));
                    if (targetNutrition.effects) {
                        for (let i = 0, len = targetNutrition.effects.length; i < len; i++) {
                            const effect = targetNutrition.effects[i];
                            if (effect == undefined)
                                continue;
                            if (Math.random() < effect.chance) {
                                player.addEffect(effect.id, effect.time * 20, { amplifier: effect.amplifier });
                            }
                        }
                    }
                }
            }
        }
        if (length == invalids) {
            removeFromGlobalLoop("travelBackpackFeedListener");
        }
    }
};
