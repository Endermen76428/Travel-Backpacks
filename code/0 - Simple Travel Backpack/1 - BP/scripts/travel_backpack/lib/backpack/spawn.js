import { backpackSizeEvent } from "../../functions/place";
export function spawnBackpack(player, itemId) {
    const inventorySize = backpackSizeEvent[itemId] ?? 0;
    const entity = player.dimension.spawnEntity("travel_backpack:backpack", player.location, { spawnEvent: `travel_backpack:inventory${inventorySize}` });
    entity.nameTag = `ui.travel_backpack:backpack.size.${inventorySize}`;
    return entity;
}
