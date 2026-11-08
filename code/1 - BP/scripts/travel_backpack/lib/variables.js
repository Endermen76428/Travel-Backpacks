import { EntityComponentTypes, EquipmentSlot, ItemStack, system, world } from "@minecraft/server";
import { restartFurnaceFunction } from "../functions/upgrades/furnace/restart";
import { createFurnaceIcons } from "../functions/upgrades/furnace/visual";
import { apiScoreboard } from "./../../0-lib/math/scoreboard";
import { addPlayerHoldListen } from "../functions/hold";
export let lockSlotItem;
export let coalItem;
export const backpackSizeFill = {
    0: 28,
    1: 38,
    2: 57,
    3: 85,
    4: 105,
    5: 126
};
export const backpackTypeTier = {
    0: "travel_backpack:leather_backpack",
    1: "travel_backpack:copper_backpack",
    2: "travel_backpack:iron_backpack",
    3: "travel_backpack:gold_backpack",
    4: "travel_backpack:diamond_backpack",
    5: "travel_backpack:netherite_backpack"
};
export const backpackSizeTier = {
    250: 0,
    251: 1,
    252: 2,
    253: 3,
    255: 4,
    256: 5
};
export const backpackUpgradesIndex = {
    250: [27, 1],
    251: [36, 2],
    252: [54, 3],
    253: [81, 4],
    255: [100, 5],
    256: [120, 6]
};
export let furnaceReloadScore;
export const openedBackpacks = {};
system.run(() => {
    world.gameRules.showTags = false;
    furnaceReloadScore = apiScoreboard.getObj("travel_backpack:furnace");
    lockSlotItem = new ItemStack("travel_backpack:lock_slot");
    coalItem = new ItemStack("minecraft:coal");
    createFurnaceIcons();
    restartFurnaceFunction(furnaceReloadScore);
    const players = world.getAllPlayers();
    if (players.length > 0) {
        for (let i = 0, len = players.length; i < len; i++) {
            const player = players[i];
            if (!player)
                continue;
            const item = player.getComponent(EntityComponentTypes.Equippable)?.getEquipment(EquipmentSlot.Mainhand);
            if (item?.hasTag("travel_backpack:backpack")) {
                addPlayerHoldListen(player, item, player.selectedSlotIndex);
            }
        }
    }
});
