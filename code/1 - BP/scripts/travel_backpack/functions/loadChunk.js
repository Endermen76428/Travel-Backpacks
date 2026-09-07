import { globalBackpackPos, OverworldDimension } from "../lib/variables";
import { world, system } from "@minecraft/server";
const zeroCoord = { x: 0.5, y: 0, z: 0.5 };
export function loadBackpackChunk() {
    const entity = OverworldDimension.getEntities({ type: "travel_backpack:chunk_loader", location: globalBackpackPos, maxDistance: 5, closest: 1 })[0];
    if (!entity || !entity.isValid) {
        const tickId = "travel_backpack:start";
        world.tickingAreaManager.createTickingArea(tickId, { from: zeroCoord, to: zeroCoord, dimension: OverworldDimension });
        system.runTimeout(() => {
            const entityLoader = OverworldDimension.spawnEntity("travel_backpack:chunk_loader", zeroCoord);
            entityLoader.teleport(globalBackpackPos, { dimension: OverworldDimension });
            world.tickingAreaManager.hasTickingArea(tickId) && world.tickingAreaManager.removeTickingArea(tickId);
        }, 25);
    }
}
