import { EntityComponentTypes, ItemStack, PlatformType } from "@minecraft/server";
import { getBackpackTier } from "./tier";
export function spawnBackpack(player, itemId) {
    let inventoryTier = getBackpackTier(itemId);
    const entity = player.dimension.spawnEntity("travel_backpack:backpack", player.location, { spawnEvent: `travel_backpack:inventory${inventoryTier}` });
    entity.nameTag = `ui.travel_backpack:backpack.size.${inventoryTier}`;
    entity.addTag(`travel_backpack:${player.id}`);
    const inventory = entity.getComponent(EntityComponentTypes.Inventory)?.container;
    if (!inventory)
        return entity;
    inventory.setItem(inventory.size - 3, new ItemStack("travel_backpack:ui_mode_" + (player.getDynamicProperty("uimode") ?? (player.clientSystemInfo.platformType == PlatformType.Desktop ? "default" : "scrolling"))));
    inventory.setItem(inventory.size - 2, new ItemStack("travel_backpack:organize_alphabetical"));
    inventory.setItem(inventory.size - 1, new ItemStack("travel_backpack:organize_numeric"));
    return entity;
}
