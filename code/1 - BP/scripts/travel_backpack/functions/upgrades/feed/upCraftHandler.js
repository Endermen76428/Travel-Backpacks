import { system } from "@minecraft/server";
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
        const { backpack, backpackInv, firstSlot } = info;
        if (!backpack.isValid) {
            invalidPlayers++;
            delete craftListenList[key];
            continue;
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
        craftListenList[backpack.id] = { backpack, backpackInv, firstSlot };
        amountOfListeners == 0 && startInverval();
    }
    remove(backpack) {
        delete craftListenList[backpack.id];
    }
};
