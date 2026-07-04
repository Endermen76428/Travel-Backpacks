import { world, system, Player } from "@minecraft/server"
import { placeBackpack } from "../functions/place"

let ItemUsedOn = false

system.beforeEvents.startup.subscribe(({itemComponentRegistry: customI}) => {
  customI.registerCustomComponent("travel_backpack:backpack", {
    onUseOn: ({source, block, blockFace, itemStack: item}) => {
      ItemUsedOn = true

      if(source instanceof Player) placeBackpack.place(source, item, block, blockFace)
    },

    onUse: ({source: player, itemStack: item}) => {
      if(!(player instanceof Player) || !item) return

      system.run(() => {
        if(ItemUsedOn){ ItemUsedOn = false; return }

        // const config = apiConfig.get(item)

        // new ModalFormData()
        // .title("ui.builder_wand:config.wand.title")
        // .slider({translate: "ui.builder_wand:config.wand.slider"}, 3, apiWandInfo.getMaxSize(item), {valueStep: 2, defaultValue: config.size})
        // .toggle("ui.builder_wand:config.wand.toggle", {defaultValue: config.connect})
        // .show(player).then(({canceled, formValues}) => {
        //   if(canceled || formValues == undefined) return

        //   const [ size, connect ] = formValues
        //   if(typeof size != "number") return
        //   if(typeof connect != "boolean") return

        //   config.size = size
        //   config.connect = connect

        //   apiConfig.set(player, item, config)
        // })
      })
    }
  })
})

// world.afterEvents.itemUse.subscribe(({source, itemStack}) => {
//   console.warn(itemStack.getTags())
//   const entities = source.dimension.getEntities({type: "travel_backpack:backpack"})
//   itemStack.typeId == "minecraft:stick" && console.warn(JSON.stringify(entities.map(value => value.location)))
//   // itemStack.typeId == "minecraft:stick" && console.warn(JSON.stringify(entities.length))
// })