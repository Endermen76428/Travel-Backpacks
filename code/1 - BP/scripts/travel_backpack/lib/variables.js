import { EntityComponentTypes, EquipmentSlot, ItemStack, system, world } from "@minecraft/server";
import { restartFurnaceFunction } from "../functions/upgrades/furnace/restart";
import { createFurnaceIcons } from "../functions/upgrades/furnace/visual";
import { addPlayerHoldListen } from "../functions/hold";
import { apiScoreboard } from "./math/scoreboard";
import { BACSLoadFurnaceRecipe } from "../functions/upgrades/furnace/recipes";
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
    62: 0,
    74: 1,
    89: 2,
    116: 3,
    135: 4,
    155: 5
};
export const backpackUpgradesIndex = {
    62: [27, 1],
    74: [36, 2],
    89: [54, 3],
    116: [81, 4],
    135: [100, 5],
    155: [120, 6]
};
export let furnaceReloadScore;
export let furnaceRecipeScore;
export let BACSFurnaceRecipeScore;
export let BACSFurnaceRecipeDenyScore;
system.run(() => {
    world.gameRules.showTags = false;
    furnaceReloadScore = apiScoreboard.getObj("travel_backpack:furnace");
    furnaceRecipeScore = apiScoreboard.getObj("travel_backpack:furnace_r");
    BACSFurnaceRecipeScore = apiScoreboard.getObj("BACS:furnace_recipes");
    BACSFurnaceRecipeDenyScore = apiScoreboard.getObj("BACS:furnace_recipes_deny");
    BACSLoadFurnaceRecipe(BACSFurnaceRecipeScore, BACSFurnaceRecipeDenyScore);
    const players = world.getAllPlayers();
    lockSlotItem = new ItemStack("travel_backpack:lock_slot");
    coalItem = new ItemStack("minecraft:coal");
    createFurnaceIcons();
    restartFurnaceFunction(furnaceReloadScore);
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
