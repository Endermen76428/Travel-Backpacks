import { world } from "@minecraft/server";
world.beforeEvents.entityRemove.subscribe(({ removedEntity: entity }) => {
    if (entity.typeId != "travel_backpack:backpack")
        return;
    if (!entity.hasTag("can_remove")) {
        console.warn("§cRemovida sem permissão:§r", entity.id, entity.isValid, entity.getProperty("travel_backpack:level"));
    }
    else {
        console.warn("§aRemoção permitida:§r", entity.id);
    }
});
