import { EntityComponentTypes, EquipmentSlot, system, world } from "@minecraft/server";
import { addPlayerHoldListen } from "../functions/hold";
export let BackpackDimension;
export const dimensionCenter = { x: 0, y: 0, z: 0 };
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
    30: 0,
    39: 1,
    57: 2,
    84: 3,
    103: 4,
    123: 5
};
export const backpackUpgradesIndex = {
    30: [27, 1],
    39: [36, 2],
    57: [54, 3],
    84: [81, 4],
    103: [100, 5],
    123: [120, 6]
};
export const openedBackpacks = {};
system.run(() => {
    world.gameRules.showTags = false;
    BackpackDimension = world.getDimension("travel_backpack:backpack");
    world.tickingAreaManager.createTickingArea("backpack", { from: { x: 0, y: 0, z: 0 }, to: { x: 0, y: 0, z: 0 }, dimension: BackpackDimension });
    const players = world.getAllPlayers();
    if (players.length > 0) {
        for (let i = 0, len = players.length; i < len; i++) {
            const player = players[i];
            if (!player)
                continue;
            const item = player.getComponent(EntityComponentTypes.Equippable)?.getEquipment(EquipmentSlot.Mainhand);
            if (item?.hasTag("travel_backpack:backpack"))
                addPlayerHoldListen(player, item, player.selectedSlotIndex);
        }
    }
});
