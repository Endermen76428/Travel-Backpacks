import { ItemStack, system } from "@minecraft/server";
import { craftUpgradeRecipes } from "./recipes";
const craftListenList = {};
let amountOfListeners = 0;
function startInverval() {
    const backpacks = Object.entries(craftListenList);
    const length = backpacks.length;
    let invalidPlayers = 0;
    amountOfListeners = length;
    for (let i = 0; i < length; i++) {
        const [key, info] = backpacks[i] ?? [];
        if (key == undefined || info == undefined)
            continue;
        const { backpack, backpackInv, firstSlot, amount, lastItem, lastMin, lastAmount } = info;
        if (!backpack.isValid) {
            invalidPlayers++;
            delete craftListenList[key];
            continue;
        }
        let craftPattern = "";
        let minAmount = Infinity;
        const items = Array.from({ length: 9 });
        for (let i = firstSlot, len = firstSlot + 9; i < len; i++) {
            const item = backpackInv.getItem(i);
            craftPattern += (item?.typeId ?? "") + (i - firstSlot == 8 ? "" : "/");
            items[i - firstSlot] = item;
            if (item != undefined)
                minAmount = Math.min(minAmount, item.amount);
        }
        minAmount = Math.min(minAmount, amount);
        const currentOutputItem = backpackInv.getItem(firstSlot + 10);
        const craft = craftUpgradeRecipes.getResult(backpack, craftPattern, items);
        if (craft) {
            if (lastItem && !currentOutputItem) {
                const decrementAmount = Math.min(lastMin ?? Infinity, minAmount, Math.floor((lastAmount ?? 0) / craft.amount));
                for (let i = firstSlot, len = firstSlot + 9; i < len; i++) {
                    const item = backpackInv.getItem(i);
                    if (item) {
                        if (item.amount > decrementAmount) {
                            item.amount -= decrementAmount;
                            backpackInv.setItem(i, item);
                        }
                        else
                            backpackInv.setItem(i);
                    }
                }
                if (craft.remnant) {
                    const location = backpack.dimension.getPlayers({ location: backpack.location, closest: 1 })[0]?.location ?? backpack.location;
                    for (let i = 0, len = craft.remnant.length; i < len; i++) {
                        const outputRemnant = craft.remnant[i];
                        if (!outputRemnant)
                            continue;
                        backpack.dimension.spawnItem(new ItemStack(outputRemnant.output, outputRemnant.amount), location);
                    }
                }
                delete info.lastItem;
            }
            else if (lastItem == undefined || craft.output != lastItem[0] || amount != lastItem[1] || minAmount != lastMin) {
                const outputItem = new ItemStack(craft.output, craft.amount);
                outputItem.amount = Math.min(outputItem.amount * minAmount, Math.floor(outputItem.maxAmount / craft.amount) * craft.amount);
                backpackInv.setItem(firstSlot + 10, outputItem);
                info.lastItem = [craft.output, amount];
                info.lastMin = minAmount;
                info.lastAmount = outputItem.amount;
            }
        }
        else {
            backpackInv.setItem(firstSlot + 10);
            delete info.lastItem;
        }
    }
    if (length == invalidPlayers) {
        amountOfListeners = 0;
        return;
    }
    system.run(() => startInverval());
}
export const craftUpgradeFunctions = new class CraftUpgradeFunctions {
    add(backpack, backpackInv, firstSlot) {
        const itemCraftAmount = backpackInv.getItem(firstSlot + 11);
        let amount = 1;
        if (itemCraftAmount == undefined || !itemCraftAmount.hasTag("travel_backpack:craft_amount")) {
            backpackInv.setItem(firstSlot + 11, new ItemStack("travel_backpack:craft_amount_1"));
        }
        else {
            amount = craftAmountByItem[itemCraftAmount.typeId] ?? 1;
        }
        craftListenList[backpack.id] = { backpack, backpackInv, firstSlot, amount };
        amountOfListeners == 0 && startInverval();
    }
    remove(backpack) {
        delete craftListenList[backpack.id];
    }
    updateAmount(backpackId, amount) {
        const info = craftListenList[backpackId];
        if (info == undefined)
            return;
        info.amount = amount;
    }
};
const craftAmountByItem = {
    "travel_backpack:craft_amount_1": 1,
    "travel_backpack:craft_amount_2": 2,
    "travel_backpack:craft_amount_4": 4,
    "travel_backpack:craft_amount_8": 8,
    "travel_backpack:craft_amount_16": 16,
    "travel_backpack:craft_amount_32": 32,
    "travel_backpack:craft_amount_64": 64
};
