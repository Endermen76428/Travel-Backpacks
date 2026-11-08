import { Container, EntityComponentTypes, ItemStack, world } from "@minecraft/server"
import { craftUpgradeFunctions } from "../functions/upgrades/craft/upCraftHandler"
import { openedBackpacks } from "../lib/variables"
import { backpackOrganize } from "../functions/organize"

world.afterEvents.entityItemDrop.subscribe(({entity: player, items}) => {
  if(items.length > 1) return

  const item = items[0]?.getComponent(EntityComponentTypes.Item)
  if(item == undefined) return

  const exe = itemDroppedFunctions[item.itemStack.typeId]
  if(exe){
    const info = openedBackpacks[player.id]
    if(info == undefined) return
    exe(...info)
    item.entity.isValid && item.entity.remove()
  }
}, {entityFilter: {type: "minecraft:player"}})

const itemDroppedFunctions: { [key: string]: (id: string, inventory: Container, size: number) => void } = {
  "travel_backpack:ui_mode_default": (id, inventory, size) => { inventory.setItem(size +6, new ItemStack("travel_backpack:ui_mode_scrolling")) },
  "travel_backpack:ui_mode_scrolling": (id, inventory, size) => { inventory.setItem(size +6, new ItemStack("travel_backpack:ui_mode_default")) },

  "travel_backpack:organize_alphabetical": (id, inventory, size) => { inventory.setItem(size +7, new ItemStack("travel_backpack:organize_alphabetical")), backpackOrganize.alphabetical(inventory, size) },
  "travel_backpack:organize_numeric": (id, inventory, size) => { inventory.setItem(size +8, new ItemStack("travel_backpack:organize_numeric")), backpackOrganize.numeric(inventory, size) },

  "travel_backpack:craft_amount_1": (id, inventory, size) => { inventory.setItem(size +21, new ItemStack("travel_backpack:craft_amount_2")), craftUpgradeFunctions.updateAmount(id, 2) },
  "travel_backpack:craft_amount_2": (id, inventory, size) => { inventory.setItem(size +21, new ItemStack("travel_backpack:craft_amount_4")), craftUpgradeFunctions.updateAmount(id, 4) },
  "travel_backpack:craft_amount_4": (id, inventory, size) => { inventory.setItem(size +21, new ItemStack("travel_backpack:craft_amount_8")), craftUpgradeFunctions.updateAmount(id, 8) },
  "travel_backpack:craft_amount_8": (id, inventory, size) => { inventory.setItem(size +21, new ItemStack("travel_backpack:craft_amount_16")), craftUpgradeFunctions.updateAmount(id, 16) },
  "travel_backpack:craft_amount_16": (id, inventory, size) => { inventory.setItem(size +21, new ItemStack("travel_backpack:craft_amount_32")), craftUpgradeFunctions.updateAmount(id, 32) },
  "travel_backpack:craft_amount_32": (id, inventory, size) => { inventory.setItem(size +21, new ItemStack("travel_backpack:craft_amount_64")), craftUpgradeFunctions.updateAmount(id, 64) },
  "travel_backpack:craft_amount_64": (id, inventory, size) => { inventory.setItem(size +21, new ItemStack("travel_backpack:craft_amount_1")), craftUpgradeFunctions.updateAmount(id, 1) }
}