import { EntityComponentTypes, system } from "@minecraft/server";
import { backpackUpgradesIndex, lockSlotItem } from "../../lib/variables";
import { craftUpgradeFunctions } from "./craft/upCraftHandler";
const backpackPlayersListenList = {};
let amountOfListeners = 0;
function startInverval(executeTime = 0) {
    const players = Object.entries(backpackPlayersListenList);
    const length = players.length;
    let invalidPlayers = 0;
    amountOfListeners = length;
    for (let i = 0; i < length; i++) {
        const [key, info] = players[i] ?? [];
        if (key == undefined || info == undefined)
            continue;
        const { player, backpack, backpackInv, slots, upgrades } = info;
        if (!player.isValid || !backpack.isValid) {
            invalidPlayers++;
            backpackPlayersListenList[key];
            continue;
        }
        if (executeTime == 4) {
            const [firstSlot, size] = slots;
            const newUpgrades = Array.from({ length: 6 });
            for (let i = firstSlot, len = firstSlot + size; i < len; i++) {
                const slot = i - firstSlot;
                const item = backpackInv.getItem(i);
                const oldUpgrade = upgrades[slot];
                if (item != undefined && !item?.hasTag("travel_backpack:upgrade_function")) {
                    backpackInv.setItem(i, undefined);
                    item && player.dimension.spawnItem(item, player.location);
                    if (upgrades[slot] != "")
                        newUpgrades[slot] = "";
                    continue;
                }
                const itemId = item?.typeId ?? "";
                if (itemId == oldUpgrade)
                    continue;
                newUpgrades[slot] = itemId;
            }
            for (let i = firstSlot, len = firstSlot + size; i < len; i++) {
                const slot = i - firstSlot;
                const change = newUpgrades[slot];
                if (change == undefined)
                    continue;
                if (change == "") {
                    const exe = removeFunctions[upgrades[slot] ?? ""];
                    exe && exe(player, backpack, backpackInv, firstSlot, upgrades);
                    upgrades[slot] = "";
                    continue;
                }
                const exe = addFunctions[change];
                exe && exe(backpack, backpackInv, firstSlot, upgrades);
                upgrades[slot] = change;
            }
        }
    }
    if (length == invalidPlayers) {
        amountOfListeners = 0;
        return;
    }
    system.run(() => startInverval(executeTime >= 4 ? 0 : executeTime + 1));
}
export function addPlayerUpgradeListen(player, backpack) {
    const playerInv = backpack.getComponent(EntityComponentTypes.Inventory)?.container;
    const backpackInv = backpack.getComponent(EntityComponentTypes.Inventory)?.container;
    if (!playerInv || !backpackInv)
        return;
    const info = backpackUpgradesIndex[backpackInv.size];
    if (info == undefined)
        return;
    const [firstSlot, size] = info;
    const upgradesToEnable = { craft: false };
    const upgrades = ["", "", "", "", "", ""];
    for (let i = firstSlot, len = firstSlot + size; i < len; i++) {
        const item = backpackInv.getItem(i);
        if (!item)
            continue;
        if (!item.hasTag("travel_backpack:upgrade_function")) {
            backpackInv.setItem(i, undefined);
            player.dimension.spawnItem(item, player.location);
            continue;
        }
        const exe = enableUpgrades[item.typeId];
        exe && exe(upgradesToEnable, backpack, backpackInv, firstSlot, upgrades);
        upgrades[i - firstSlot] = item.typeId;
    }
    backpackPlayersListenList[player.id] = { player, backpack, playerInv, backpackInv, slots: info, upgrades };
    amountOfListeners == 0 && startInverval();
}
export function removePlayerUpgradeListen(player) {
    delete backpackPlayersListenList[player.id];
}
const addFunctions = {
    "travel_backpack:craft_upgrade": (entity, inventory, firstSlot) => {
        if (inventory.getItem(firstSlot + 10)?.typeId != "travel_backpack:lock_slot")
            return;
        for (let i = firstSlot + 10, len = firstSlot + 19; i < len; i++)
            inventory.setItem(i, undefined);
        craftUpgradeFunctions.add(entity, inventory, firstSlot);
    }
};
const removeFunctions = {
    "travel_backpack:craft_upgrade": (player, entity, inventory, firstSlot, oldUpgrades) => {
        let upgradesEnabled = -1;
        for (let i = 0, len = oldUpgrades.length; i < len; i++) {
            const upgrade = oldUpgrades[i];
            if (upgrade == "travel_backpack:craft_upgrade")
                upgradesEnabled++;
        }
        if (upgradesEnabled > 0)
            return;
        for (let i = firstSlot + 10, len = firstSlot + 19; i < len; i++) {
            const item = inventory.getItem(i);
            item && !item.hasTag("travel_backpack:lock_slot") && player.dimension.spawnItem(item, player.location);
            inventory.setItem(i, lockSlotItem);
        }
        craftUpgradeFunctions.remove(entity);
    }
};
const enableUpgrades = {
    "travel_backpack:craft_upgrade": (upgrades, entity, inventory, firstSlot) => {
        if (upgrades.craft == true)
            return;
        upgrades.craft = true;
        craftUpgradeFunctions.add(entity, inventory, firstSlot);
    }
};
