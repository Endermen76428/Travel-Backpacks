import { world, system, EntityComponentTypes, EquipmentSlot, ItemStack } from "@minecraft/server";
import { addPlayerHoldListen } from "../functions/hold";
export const globalBackpackPos = { x: 0.5, y: 384, z: 0.5 };
export let lockSlotItem;
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
    49: 0,
    57: 1,
    75: 2,
    102: 3,
    121: 4,
    141: 5
};
export const backpackUpgradesIndex = {
    49: [27, 1],
    57: [36, 2],
    75: [54, 3],
    102: [81, 4],
    121: [100, 5],
    141: [120, 6]
};
export const dyesList = {
    "minecraft:ink_sac": "undye",
    "minecraft:white_dye": "white",
    "minecraft:light_gray_dye": "light_gray",
    "minecraft:gray_dye": "gray",
    "minecraft:black_dye": "black",
    "minecraft:brown_dye": "brown",
    "minecraft:red_dye": "red",
    "minecraft:orange_dye": "orange",
    "minecraft:yellow_dye": "yellow",
    "minecraft:lime_dye": "lime",
    "minecraft:green_dye": "green",
    "minecraft:cyan_dye": "cyan",
    "minecraft:light_blue_dye": "light_blue",
    "minecraft:blue_dye": "blue",
    "minecraft:purple_dye": "purple",
    "minecraft:magenta_dye": "magenta",
    "minecraft:pink_dye": "pink"
};
system.run(() => {
    world.gameRules.showTags = false;
    const players = world.getAllPlayers();
    lockSlotItem = new ItemStack("travel_backpack:lock_slot");
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
