import { ItemStack, system } from "@minecraft/server";
import { furnaceRecipeList } from "./recipes";
import { furnaceArrowIcons, furnaceFlameIcons } from "./visual";
import { furnaceFuelList } from "./fuel";
import { furnaceScore } from "../../../lib/variables";
const furnaceListenList = {};
let amountOfListeners = 0;
const inverseProgress = 1 / 200;
function startInverval() {
    const backpacks = Object.entries(furnaceListenList);
    const length = backpacks.length;
    let invalidPlayers = 0;
    amountOfListeners = length;
    for (let i = 0; i < length; i++) {
        const [key, info] = backpacks[i] ?? [];
        if (key == undefined || info == undefined)
            continue;
        const { backpack, backpackInv, firstSlot, tryStop, fuelMax, fuelTime, progress } = info;
        if (!backpack.isValid) {
            invalidPlayers++;
            delete furnaceListenList[key];
            continue;
        }
        if (fuelTime > 0) {
            const levelOld = Math.floor(((fuelTime + 1) * fuelMax) * 13);
            const level = Math.floor((fuelTime * fuelMax) * 13);
            if (level != levelOld)
                backpackInv.setItem(firstSlot + 3, furnaceFlameIcons[level]);
            info.fuelTime--;
        }
        const input = backpackInv.getItem(firstSlot);
        if (tryStop) {
            if (fuelTime == 0 && progress <= 0) {
                console.warn("§aNão há mais processos");
                backpack.setDynamicProperty("f", undefined);
                backpack.setDynamicProperty("fm", undefined);
                backpack.setDynamicProperty("p", undefined);
                backpackInv.setItem(firstSlot + 4, furnaceArrowIcons[0]);
                furnaceUpgradeFunctions.remove(backpack);
                backpack.getProperty("travel_backpack:on_ground") == false && backpack.triggerEvent("travel_backpack:add_timer");
                continue;
            }
        }
        if (input == undefined) {
            if (progress > 0) {
                backpackInv.setItem(firstSlot + 4, furnaceArrowIcons[0]);
                info.progress = 0;
                backpack.setDynamicProperty("p", undefined);
            }
            continue;
        }
        let output = backpackInv.getItem(firstSlot + 2);
        if (output && output.amount >= output.maxAmount)
            continue;
        const expectedOutput = furnaceRecipeList[input.typeId];
        if (expectedOutput == undefined) {
            continue;
        }
        if (output != undefined && expectedOutput != output.typeId) {
            if (progress > 0) {
                backpackInv.setItem(firstSlot + 4, furnaceArrowIcons[0]);
                info.progress = 0;
                backpack.setDynamicProperty("p", undefined);
            }
            continue;
        }
        if (fuelTime == 0) {
            const fuel = backpackInv.getItem(firstSlot + 1);
            if (fuel == undefined) {
                if (progress > 0) {
                    const levelOld = Math.floor(((progress + 1) * inverseProgress) * 22);
                    const level = Math.floor((progress * inverseProgress) * 22);
                    if (level != levelOld)
                        backpackInv.setItem(firstSlot + 4, furnaceArrowIcons[level]);
                    info.progress -= 2;
                    backpack.setDynamicProperty("p", info.progress);
                }
                continue;
            }
            const gettedFuelTime = furnaceFuelList[fuel.typeId];
            if (gettedFuelTime == undefined) {
                if (progress > 0) {
                    const levelOld = Math.floor(((progress + 1) * inverseProgress) * 22);
                    const level = Math.floor((progress * inverseProgress) * 22);
                    if (level != levelOld)
                        backpackInv.setItem(firstSlot + 4, furnaceArrowIcons[level]);
                    info.progress -= 2;
                    backpack.setDynamicProperty("p", info.progress);
                }
                continue;
            }
            if (fuel.amount - 1 == 0) {
                backpackInv.setItem(firstSlot + 1, undefined);
            }
            else {
                fuel.amount--;
                backpackInv.setItem(firstSlot + 1, fuel);
            }
            info.fuelTime = gettedFuelTime * 200;
            info.fuelMax = 1 / (gettedFuelTime * 200);
            backpack.setDynamicProperty("fm", gettedFuelTime * 200);
        }
        const levelOld = Math.floor(((progress - 1) * inverseProgress) * 22);
        const level = Math.floor((progress * inverseProgress) * 22);
        if (level != levelOld) {
            backpackInv.setItem(firstSlot + 4, furnaceArrowIcons[level]);
            backpack.setDynamicProperty("f", fuelTime);
            backpack.setDynamicProperty("p", progress);
        }
        info.progress++;
        if (info.progress == 200) {
            if (output == undefined) {
                output = new ItemStack(expectedOutput);
            }
            else {
                output.amount++;
            }
            console.warn("§aFundido:§r", output.amount, output.typeId);
            backpackInv.setItem(firstSlot + 4, furnaceArrowIcons[0]);
            backpackInv.setItem(firstSlot + 2, output);
            if (input.amount - 1 == 0) {
                backpackInv.setItem(firstSlot, undefined);
            }
            else {
                input.amount--;
                backpackInv.setItem(firstSlot, input);
            }
            info.progress = 0;
        }
    }
    if (length == invalidPlayers) {
        amountOfListeners = 0;
        return;
    }
    system.run(() => startInverval());
}
export const furnaceUpgradeFunctions = new class FurnaceUpgradeFunctions {
    add(backpack, backpackInv, firstSlot) {
        if (backpack.getProperty("travel_backpack:on_ground") == false) {
            backpack.triggerEvent("travel_backpack:remove_timer");
            backpack.addTag("can_enable_timer");
        }
        furnaceScore.setScore(backpack.id, 0);
        const info = furnaceListenList[backpack.id];
        if (info == undefined) {
            const fuelTime = (r => typeof r != "number" ? 0 : r)(backpack.getDynamicProperty("f"));
            const fuelMax = (r => typeof r != "number" ? 0 : r)(backpack.getDynamicProperty("fm"));
            const progress = (r => typeof r != "number" ? 0 : r)(backpack.getDynamicProperty("p"));
            furnaceListenList[backpack.id] = { backpack, backpackInv, firstSlot, tryStop: false, fuelMax: 1 / fuelMax, fuelTime, progress };
        }
        else {
            info.tryStop = false;
        }
        amountOfListeners == 0 && startInverval();
    }
    enableTryStop(backpack) {
        const info = furnaceListenList[backpack.id];
        if (info == undefined)
            return;
        info.tryStop = true;
    }
    remove(backpack) {
        furnaceScore.removeParticipant(backpack.id);
        delete furnaceListenList[backpack.id];
    }
};
