import { world, system, Entity, EntityComponentTypes, EquipmentSlot, ItemStack, Player, BlockPermutation } from "@minecraft/server"
import { apiEquippable } from "../lib/player/equippable"
import { apiWarn } from "../lib/player/warn"

export const upgradeBackpack = new class UpgradeBackpack {
  install(player: Player, backpack: Entity, item: ItemStack): boolean {
    const upgradeSize = upgradeTier[item.typeId]
    const backpackType = upgradeTierBlocks[item.typeId]

    if(upgradeSize != undefined && backpackType != undefined){
      const currentBackpackTier = backpackSizeTier[backpack.getComponent(EntityComponentTypes.Inventory)?.container.size ?? 27] ?? 0
      if(currentBackpackTier >= upgradeSize) return false

      const block = backpack.dimension.getBlock(backpack.location)
      if(!block) return false
      system.run(() => {
        // Aqui vai ser necessario fazer umas verificações para os upgrades não bugarem
        block.setPermutation(BlockPermutation.resolve(backpackType, block.permutation.getAllStates()))
        block.dimension.spawnParticle("travel_backpack:upgrade_tier", block.center())

        backpack.triggerEvent(`travel_backpack:inventory${upgradeSize}`)
        backpack.nameTag = `ui.travel_backpack:backpack.size.${upgradeSize}`
        apiEquippable.decrement(player, EquipmentSlot.Mainhand)
        apiWarn.playSound(player, "warn.ender_addon_pack:levelup")
      })
      return true
    }

    return false
  }
}

const upgradeTier: { [key: string]: number } = {
  "travel_backpack:copper_upgrade_tier":    1,
  "travel_backpack:iron_upgrade_tier":      2,
  "travel_backpack:gold_upgrade_tier":      3,
  "travel_backpack:diamond_upgrade_tier":   4,
  "travel_backpack:netherite_upgrade_tier": 5
}
const upgradeTierBlocks: { [key: string]: string } = {
  "travel_backpack:copper_upgrade_tier":    "travel_backpack:copper_backpack",
  "travel_backpack:iron_upgrade_tier":      "travel_backpack:iron_backpack",
  "travel_backpack:gold_upgrade_tier":      "travel_backpack:gold_backpack",
  "travel_backpack:diamond_upgrade_tier":   "travel_backpack:diamond_backpack",
  "travel_backpack:netherite_upgrade_tier": "travel_backpack:netherite_backpack"
}

const backpackSizeTier: { [key: number]: number } = {
  27:  0,
  36:  1,
  54:  2,
  81:  3,
  100: 4,
  120: 5
}