import { EntityComponentTypes, ItemStack, PlatformType, Player, world } from "@minecraft/server";
import { openedBackpacks } from "../lib/variables";
world.afterEvents.entityContainerOpened.subscribe(({ entity: backpack, openSource }) => {
    const player = openSource.entity;
    if (!player || !player.isValid)
        return;
    if (!(player instanceof Player))
        return;
    const inventory = backpack.getComponent(EntityComponentTypes.Inventory)?.container;
    if (inventory == undefined)
        return;
    openedBackpacks[player.id] = [backpack.id, inventory, inventory.size];
    inventory.setItem(inventory.size - 3, new ItemStack("travel_backpack:ui_mode_" + (player.getDynamicProperty("uimode") ?? (player.clientSystemInfo.platformType == PlatformType.Desktop ? "default" : "scrolling"))));
    inventory.setItem(inventory.size - 2, new ItemStack("travel_backpack:organize_alphabetical"));
    inventory.setItem(inventory.size - 1, new ItemStack("travel_backpack:organize_numeric"));
}, { entityFilter: { type: "travel_backpack:backpack" } });
