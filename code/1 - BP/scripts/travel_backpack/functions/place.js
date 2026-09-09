import { world, EntityComponentTypes, EquipmentSlot, GameMode } from "@minecraft/server";
import { spawnBackpack } from "../lib/backpack/spawn";
import { apiWarn } from "../lib/player/warn";
export const placeBackpack = new class PlaceBackpack {
    place(player, item, blockTarget, direction) {
        const offset = offsetDirection[direction];
        const block = blockTarget.hasTag("travel_backpack:backpack") ? blockTarget : blockTarget.offset(offset);
        if (!block || !block.isValid)
            return;
        if (!block.hasTag("travel_backpack:backpack"))
            return;
        if (!player.isSneaking) {
            block.setType("minecraft:air");
            player.getComponent(EntityComponentTypes.Equippable)?.setEquipment(EquipmentSlot.Mainhand, item);
            apiWarn.notify(player, "item.warn.travel_backpack:backpack.need_shift.place", { type: "actionbar", sound: "warn.ender_addon_pack:pop" });
            return;
        }
        if (player.getGameMode() == GameMode.Creative) {
            player.getComponent(EntityComponentTypes.Equippable)?.setEquipment(EquipmentSlot.Mainhand, undefined);
        }
        const entityPos = { x: block.x + 0.5, y: block.y, z: block.z + 0.5 };
        const backpackId = item.getDynamicProperty("id");
        if (typeof backpackId == "string") {
            const savedEntity = world.getEntity(backpackId);
            if (savedEntity) {
                savedEntity.teleport(entityPos, { dimension: player.dimension });
                savedEntity.triggerEvent("travel_backpack:add_on_ground");
                savedEntity.setDynamicProperty("pos", entityPos);
                return;
            }
        }
        const entity = spawnBackpack(player, item.typeId);
        entity.triggerEvent("travel_backpack:add_on_ground");
        entity.setDynamicProperty("pos", entityPos);
    }
};
const offsetDirection = {
    "North": { x: 0, y: 0, z: -1 },
    "South": { x: 0, y: 0, z: 1 },
    "East": { x: 1, y: 0, z: 0 },
    "West": { x: -1, y: 0, z: 0 },
    "Up": { x: 0, y: 1, z: 0 },
    "Down": { x: 0, y: -1, z: 0 }
};
