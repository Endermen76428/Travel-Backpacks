import { Container, Entity, ItemStack, system } from "@minecraft/server"
import { furnaceRecipeList } from "./recipes"
import { furnaceArrowIcons, furnaceFlameIcons } from "./visual"
import { furnaceFuelList } from "./fuel"

const furnaceListenList: { [key: string]: IntervalInfo } = {} // Backpack Id > Interval Info
let amountOfListeners = 0
const inverseProgress = 1 / 200

function startInverval(): void {
  const backpacks = Object.entries(furnaceListenList)
  const length = backpacks.length
  let invalidPlayers = 0
  amountOfListeners = length

  for(let i = 0; i < length; i++){
    const [ key, info ] = backpacks[i] ?? []
    if(key == undefined || info == undefined) continue
    const { backpack, backpackInv, firstSlot, tryStop, fuelMax, fuelTime, progress } = info

    // Remove a backpack da lista quando ela fica inválida
    if(!backpack.isValid){
      invalidPlayers++
      delete furnaceListenList[key]
      continue
    }

    if(fuelTime > 0){
      const levelOld = Math.floor(((fuelTime +1) * fuelMax) *13)
      const level = Math.floor((fuelTime * fuelMax) *13)
      if(level != levelOld) backpackInv.setItem(firstSlot +3, furnaceFlameIcons[level])
      info.fuelTime--
    }

    const input = backpackInv.getItem(firstSlot)
    // Se o player não estiver mais dentro da interface e se não haver mais combustivel ou progresso ele vai parar a execução e ativar o timer de arquivamento da backpack
    if(tryStop){
      if(fuelTime == 0 && progress <= 0){
        backpack.setDynamicProperty("f", undefined)
        backpack.setDynamicProperty("fm", undefined)
        backpack.setDynamicProperty("p", undefined)
        backpackInv.setItem(firstSlot +4, furnaceArrowIcons[0])

        furnaceUpgradeFunctions.remove(backpack)
        backpack.getProperty("travel_backpack:on_ground") == false && backpack.triggerEvent("travel_backpack:add_timer")
        continue
      }
    }

    // Se não tiver mais um item no input ele reseta o progresso
    if(input == undefined){
      if(progress > 0){
        backpackInv.setItem(firstSlot +4, furnaceArrowIcons[0])
        info.progress = 0
        backpack.setDynamicProperty("p", undefined)
      }
      continue
    }

    let output = backpackInv.getItem(firstSlot +2)

    // Se o output estiver cheio ele para de executar
    if(output && output.amount >= output.maxAmount) continue

    const expectedOutput = furnaceRecipeList[input.typeId]
    if(expectedOutput == undefined){
      // console.warn("no caso vai ter o sistema de pegar a recipe, mas fica pra depois")
      continue
    }

    if(output != undefined && expectedOutput != output.typeId){
      if(progress > 0){
        backpackInv.setItem(firstSlot +4, furnaceArrowIcons[0])
        info.progress = 0
        backpack.setDynamicProperty("p", undefined)
      }
      continue
    }

    // Se não haver mais combustivel, tentará pegar um novo do slot de fuel. Se não haver decrementará o progressp
    if(fuelTime == 0){
      const fuel = backpackInv.getItem(firstSlot +1)
      if(fuel == undefined){
        if(progress > 0){
          const levelOld = Math.floor(((progress +1) * inverseProgress) *22)
          const level = Math.floor((progress * inverseProgress) *22)
          if(level != levelOld) backpackInv.setItem(firstSlot +4, furnaceArrowIcons[level])
          info.progress -= 2
          backpack.setDynamicProperty("p", info.progress)
        }
        continue
      }

      const gettedFuelTime = furnaceFuelList[fuel.typeId]
      if(gettedFuelTime == undefined){
        if(progress > 0){
          const levelOld = Math.floor(((progress +1) * inverseProgress) *22)
          const level = Math.floor((progress * inverseProgress) *22)
          if(level != levelOld) backpackInv.setItem(firstSlot +4, furnaceArrowIcons[level])
          info.progress -= 2
          backpack.setDynamicProperty("p", info.progress)
        }
        continue
      }

      if(fuel.amount -1 == 0){
        backpackInv.setItem(firstSlot +1, undefined)
      } else {
        fuel.amount--
        backpackInv.setItem(firstSlot +1, fuel)
      }
      info.fuelTime = gettedFuelTime *200 // 200 ticks = 10s tempo de assar 1 item na fornalha
      info.fuelMax = 1 / (gettedFuelTime *200) // é a função inversa, já que a multiplicação é mais rapida doque divisão, e o max fuel vai ser usado muito la em cima pra atualizar o nivel da chama
      backpack.setDynamicProperty("fm", gettedFuelTime *200) // Salva o maxFuel pra caso o player saia do mapa
    }

    const levelOld = Math.floor(((progress -1) * inverseProgress) *22)
    const level = Math.floor((progress * inverseProgress) *22)
    if(level != levelOld){
      backpackInv.setItem(firstSlot +4, furnaceArrowIcons[level])
      backpack.setDynamicProperty("f", fuelTime)
      backpack.setDynamicProperty("p", progress)
    }

    info.progress++
    // Gera o resultado
    if(info.progress == 200){
      if(output == undefined){
        output = new ItemStack(expectedOutput)
      } else {
        output.amount++
      }
      console.warn("§aFundido:§r", output.amount, output.typeId)
      backpackInv.setItem(firstSlot +4, furnaceArrowIcons[0]) // Sempre reseta o progresso ao fundir um item, evita bugs visuais
      // Decremetanta o input
      backpackInv.setItem(firstSlot +2, output)
      if(input.amount -1 == 0){
        backpackInv.setItem(firstSlot, undefined)
      } else {
        input.amount--
        backpackInv.setItem(firstSlot, input)
      }
      info.progress = 0
    }
  }

  // Cancela o loop se não tiver mais backpacks
  if(length == invalidPlayers){
    amountOfListeners = 0
    return
  }

  // Reinicia o loop depois de 1 tick
  system.run(() => startInverval())
}

export const furnaceUpgradeFunctions = new class FurnaceUpgradeFunctions {
  add(backpack: Entity, backpackInv: Container, firstSlot: number): void {
    if(backpack.getProperty("travel_backpack:on_ground") == false){
      backpack.triggerEvent("travel_backpack:remove_timer")
      backpack.addTag("can_enable_timer")
    }

    const info = furnaceListenList[backpack.id]
    if(info == undefined){
      const fuelTime = (r => typeof r != "number" ? 0 : r)(backpack.getDynamicProperty("f"))
      const fuelMax = (r => typeof r != "number" ? 0 : r)(backpack.getDynamicProperty("fm"))
      const progress = (r => typeof r != "number" ? 0 : r)(backpack.getDynamicProperty("p"))
      furnaceListenList[backpack.id] = { backpack, backpackInv, firstSlot, tryStop: false, fuelMax: 1 / fuelMax, fuelTime, progress }
    } else {
      info.tryStop = false
    }
    amountOfListeners == 0 && startInverval()
  }

  enableTryStop(backpack: Entity): void {
    const info = furnaceListenList[backpack.id]
    if(info == undefined) return

    info.tryStop = true
  }

  remove(backpack: Entity): void {
    delete furnaceListenList[backpack.id]
  }
}

interface IntervalInfo {
  backpack: Entity
  backpackInv: Container
  firstSlot: number
  tryStop: boolean
  fuelTime: number
  fuelMax: number
  progress: number // 0 à 199 - são 200 ticks = 10s tempo da fornalha
}