import { system, BlockPermutation, EntityComponentTypes } from "@minecraft/server";
const cacheCraftPatterns = new Map([["////////", false]]);
const cachebackpackGetting = new Set();
export const craftUpgradeRecipes = new class CraftUpgradeRecipes {
    getResult(backapck, pattern, items) {
        const result = cacheCraftPatterns.get(pattern);
        if (result)
            return result;
        if (result == undefined) {
            if (cachebackpackGetting.has(backapck.id))
                return;
            cachebackpackGetting.add(backapck.id);
            this.generateUnknownRecipe(backapck, pattern, items);
            return;
        }
        return;
    }
    generateUnknownRecipe(backpack, pattern, items) {
        const minHeight = { x: backpack.location.x, y: backpack.dimension.heightRange.min, z: backpack.location.z };
        const crafterBlock = backpack.dimension.getBlock(minHeight);
        if (!crafterBlock || !crafterBlock.isValid)
            return;
        const trapdoorBlock = crafterBlock.north(1);
        const redstoneBlock = crafterBlock.south(1);
        if (!trapdoorBlock || !redstoneBlock)
            return;
        crafterBlock.setPermutation(BlockPermutation.resolve("minecraft:crafter", { "orientation": "north_up" }));
        trapdoorBlock.setType("minecraft:trapdoor");
        for (let i = 0, len = items.length; i < len; i++) {
            const item = items[i];
            item && backpack.runCommand(`replaceitem block ${crafterBlock.x} ${crafterBlock.y} ${crafterBlock.z} slot.container ${i} ${item.typeId}`);
        }
        redstoneBlock.setType("minecraft:redstone_block");
        system.runTimeout(() => {
            const entities = backpack.dimension.getEntitiesAtBlockLocation(trapdoorBlock);
            let gettedItem;
            let remnant = [];
            for (let i = 0, len = entities.length; i < len; i++) {
                const entity = entities[i];
                if (!entity || entity.typeId != "minecraft:item")
                    continue;
                const itemComp = entity.getComponent(EntityComponentTypes.Item)?.itemStack;
                if (!itemComp)
                    continue;
                entity.remove();
                if (!gettedItem) {
                    gettedItem = itemComp;
                }
                else {
                    remnant.push({ output: itemComp.typeId, amount: itemComp.amount });
                }
            }
            trapdoorBlock.setType("minecraft:bedrock");
            redstoneBlock.setType("minecraft:bedrock");
            if (gettedItem == undefined) {
                cachebackpackGetting.delete(backpack.id);
                cacheCraftPatterns.set(pattern, false);
                backpack.runCommand(`setblock ${crafterBlock.x} ${crafterBlock.y} ${crafterBlock.z} bedrock`);
                return;
            }
            cachebackpackGetting.delete(backpack.id);
            crafterBlock.setType("minecraft:bedrock");
            cacheCraftPatterns.set(pattern, { output: gettedItem.typeId, amount: gettedItem.amount, remnant: remnant.length > 0 ? remnant : undefined });
        }, 7);
    }
};
