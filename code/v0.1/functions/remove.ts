import { globalBackpackPos, OverworldDimension } from "../lib/variables"
import { world, Entity, ItemStack, Player, EntityComponentTypes, EquipmentSlot } from "@minecraft/server"

export const removeBackpack = new class RemoveBackpack {
  remove(player: Player, entity: Entity): void {
    const block = entity.dimension.getBlock(entity.location)
    if(!block || !block.isValid) return

    entity.setDynamicProperty("pos", undefined)
    entity.triggerEvent("travel_backpack:remove_on_ground")

    entity.teleport(globalBackpackPos, {dimension: OverworldDimension})

    try {
      const item = new ItemStack(block.typeId)
      if(!item) return

      item.setDynamicProperty("id", entity.id)
      item.setLore([{translate: "lore.travel_backpack:backpack.id", with: [entity.id]}])

      entity.dimension.runCommand(`setblock ${block.x} ${block.y} ${block.z} air destroy`)

      const equippable = player.getComponent(EntityComponentTypes.Equippable)
      const hand = equippable?.getEquipment(EquipmentSlot.Mainhand)
      if(hand == undefined){
        equippable?.setEquipment(EquipmentSlot.Mainhand, item)
      } else {
        entity.dimension.spawnItem(item, block.center())
      }
    } catch {}
  }
}