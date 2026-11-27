import { EntityComponentTypes, ItemLockMode, system, world } from "@minecraft/server";
import { spawnBackpack } from "../lib/backpack/spawn";
import { BackpackDimension, dimensionCenter } from "../lib/variables";
const backpackPlayersListenList = {};
const playersSneaking = {};
let amountOfListeners = 0;
const maxTick = 19;
function startInverval(executeTime = 0) {
    const players = Object.entries(backpackPlayersListenList);
    const length = players.length;
    let invalidPlayers = 0;
    amountOfListeners = length;
    for (let i = 0; i < length; i++) {
        const [key, info] = players[i] ?? [];
        if (key == undefined || info == undefined)
            continue;
        const [player, backpack, inventory, lastSlot] = info;
        if (!player.isValid || !backpack.isValid) {
            invalidPlayers++;
            deleteInfo(key);
            continue;
        }
        const isSneaking = player.isSneaking;
        if (!playersSneaking[key]) {
            if (isSneaking) {
                playersSneaking[key] = true;
                removePlayerHoldListen(player, player.selectedSlotIndex, true);
                continue;
            }
        }
        else {
            if (!isSneaking) {
                const hand = inventory.getItem(player.selectedSlotIndex);
                if (hand && hand.hasTag("travel_backpack:backpack")) {
                    hand.lockMode = ItemLockMode.slot;
                    inventory.setItem(player.selectedSlotIndex, hand);
                }
                delete playersSneaking[key];
            }
            continue;
        }
        if (lastSlot != player.selectedSlotIndex) {
            removePlayerHoldListen(player, lastSlot);
            deleteInfo(key);
            continue;
        }
        const hand = inventory.getItem(player.selectedSlotIndex);
        if (!hand || !hand.hasTag("travel_backpack:backpack")) {
            invalidPlayers++;
            deleteInfo(key);
            continue;
        }
        const playerHead = player.getHeadLocation();
        if (!(playerHead.x == backpack.location.x && playerHead.y == backpack.location.y && playerHead.z == backpack.location.z)) {
            backpack.teleport(playerHead, { dimension: player.dimension });
        }
    }
    if (length == invalidPlayers) {
        amountOfListeners = 0;
        return;
    }
    system.run(() => startInverval(executeTime >= maxTick ? 0 : executeTime + 1));
}
function deleteInfo(playerId) {
    delete backpackPlayersListenList[playerId];
    delete playersSneaking[playerId];
}
export function addPlayerHoldListen(player, item, slot) {
    const inventory = player.getComponent(EntityComponentTypes.Inventory)?.container;
    if (!inventory)
        return;
    let entity;
    const itemBackpackId = item.getDynamicProperty("id");
    if (typeof itemBackpackId == "string") {
        entity = world.getEntity(itemBackpackId);
        if (!entity) {
            const id = `travel_backpack:${itemBackpackId}`;
            const structure = world.structureManager.get(id);
            if (structure != undefined) {
                const pos = { x: 0.5, y: BackpackDimension.heightRange.min + 1, z: 0.5 };
                world.structureManager.place(structure, BackpackDimension, pos);
                const backpackEntity = BackpackDimension.getEntitiesAtBlockLocation(pos)[0];
                if (backpackEntity) {
                    entity = backpackEntity;
                    world.structureManager.delete(id);
                }
                else {
                    item.lockMode = ItemLockMode.none;
                    inventory.setItem(slot, item);
                    return console.warn("§4Entity not found in Structure!");
                }
            }
            else {
                item.lockMode = ItemLockMode.none;
                inventory.setItem(slot, item);
                return console.warn("§4Entity not found!");
            }
        }
    }
    else {
        entity = spawnBackpack(player, item.typeId);
    }
    if (!entity || !entity.isValid)
        return;
    system.runTimeout(() => entity.triggerEvent("travel_backpack:remove_timer"), 5);
    if (player.isSneaking) {
        entity.teleport({ x: player.location.x, y: player.dimension.heightRange.min + 1, z: player.location.z }, { dimension: player.dimension });
    }
    else {
        entity.teleport(player.getHeadLocation(), { dimension: player.dimension });
    }
    backpackPlayersListenList[player.id] = [player, entity, inventory, slot];
    item.setDynamicProperty("id", entity.id);
    item.setLore([{ translate: "lore.travel_backpack:backpack.id", with: [entity.id] }]);
    if (!player.isSneaking)
        item.lockMode = ItemLockMode.slot;
    inventory.setItem(slot, item);
    amountOfListeners == 0 && startInverval();
}
function removePlayerHoldListen(player, slot, sneaking = false) {
    const inventory = player.getComponent(EntityComponentTypes.Inventory)?.container;
    if (!inventory)
        return;
    const item = inventory.getItem(slot);
    if (!item || !item.hasTag("travel_backpack:backpack"))
        return;
    const backpackId = item.getDynamicProperty("id");
    if (typeof backpackId != "string")
        return;
    const entity = world.getEntity(backpackId);
    if (!entity || !entity.isValid)
        return;
    if (!sneaking && entity.hasTag("can_enable_timer") == false)
        entity.triggerEvent("travel_backpack:add_timer");
    entity.teleport(dimensionCenter, { dimension: BackpackDimension });
    item.lockMode = ItemLockMode.none;
    inventory.setItem(slot, item);
}
