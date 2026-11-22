import { EntityComponentTypes, ItemStack, Player, world } from "@minecraft/server";
import { backpackOrganize } from "../functions/organize";
import { openedBackpacks } from "../lib/variables";
world.afterEvents.entityItemDrop.subscribe(({ entity: player, items }) => {
    if (player instanceof Player == false)
        return;
    if (items.length > 1)
        return;
    const item = items[0]?.getComponent(EntityComponentTypes.Item);
    if (item == undefined)
        return;
    const exe = itemDroppedFunctions[item.itemStack.typeId];
    if (exe) {
        const info = openedBackpacks[player.id];
        if (info == undefined)
            return;
        exe(player, ...info);
        item.entity.isValid && item.entity.remove();
    }
}, { entityFilter: { type: "minecraft:player" } });
const itemDroppedFunctions = {
    "travel_backpack:ui_mode_default": (player, id, inventory, size) => { inventory.setItem(size - 3, new ItemStack("travel_backpack:ui_mode_scrolling")), player.setDynamicProperty("uimode", "scrolling"); },
    "travel_backpack:ui_mode_scrolling": (player, id, inventory, size) => { inventory.setItem(size - 3, new ItemStack("travel_backpack:ui_mode_default")), player.setDynamicProperty("uimode", "default"); },
    "travel_backpack:organize_alphabetical": (player, id, inventory, size) => { inventory.setItem(size - 2, new ItemStack("travel_backpack:organize_alphabetical")), backpackOrganize.alphabetical(inventory, size - 3); },
    "travel_backpack:organize_numeric": (player, id, inventory, size) => { inventory.setItem(size - 1, new ItemStack("travel_backpack:organize_numeric")), backpackOrganize.numeric(inventory, size - 3); }
};
