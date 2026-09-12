import { world, system, EntityComponentTypes, EquipmentSlot } from "@minecraft/server";
import { addPlayerHoldListen } from "../functions/hold";
export const globalBackpackPos = { x: 0.5, y: 384, z: 0.5 };
export const backpackSizeTier = {
    27: 0,
    36: 1,
    54: 2,
    81: 3,
    100: 4,
    120: 5
};
system.run(() => {
    world.gameRules.showTags = false;
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
