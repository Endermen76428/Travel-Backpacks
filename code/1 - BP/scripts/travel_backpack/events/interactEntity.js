import { upgradeBackpackTier } from "../functions/upgrades/tier";
import { backpackTypeTier, dyesList } from "../lib/variables";
import { BlockPermutation, EquipmentSlot, system, world } from "@minecraft/server";
import { getBackpackTier } from "../lib/backpack/tier";
import { apiEquippable } from "../lib/player/equippable";
world.beforeEvents.playerInteractWithEntity.subscribe(ev => {
    const { player, target, itemStack } = ev;
    if (target.typeId != "travel_backpack:backpack")
        return;
    if (itemStack) {
        const dye = dyesList[itemStack.typeId];
        if (dye) {
            const block = target.dimension.getBlock(target.location);
            if (block && block.isValid) {
                const tier = getBackpackTier(block.typeId);
                const type = backpackTypeTier[tier];
                if (type) {
                    if ((dye != "undye" && !block.typeId.startsWith(dye, 16)) || (dye == "undye" && block.typeId != type)) {
                        ev.cancel = true;
                        system.run(() => {
                            if (apiEquippable.decrement(player, EquipmentSlot.Mainhand, itemStack.typeId)) {
                                target.triggerEvent(`travel_backpack:${dye}_color`);
                                block.setPermutation(BlockPermutation.resolve(dye == "undye" ? type : type.replace(":", `:${dye}_`), block.permutation.getAllStates()));
                            }
                        });
                        return;
                    }
                }
            }
        }
        if (itemStack.hasTag("travel_backpack:upgrade")) {
            const upgraded = upgradeBackpackTier.install(player, target, itemStack);
            if (upgraded)
                ev.cancel = true;
        }
    }
});
