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
      if(level != levelOld){
        backpackInv.setItem(firstSlot +3, furnaceFlameIcons[level])
        console.warn("§aFuel:§r", level)
      }
      info.fuelTime--
    }

    const input = backpackInv.getItem(firstSlot)
    // Se o player não estiver mais dentro da interface e se não haver mais combustivel ou progresso ele vai parar a execução e ativar o timer de arquivamento da backpack
    if(tryStop){
      if(fuelTime == 0 && progress == 0){
        furnaceUpgradeFunctions.remove(backpack)
        console.warn("§aNão há mais processos.")
        backpack.getProperty("travel_backpack:on_ground") == false && backpack.triggerEvent("travel_backpack:add_timer")
        continue
      }

      // console.warn("fazer o teleporte da entidade caso ela não seja uma backpack no chão")
    }

    // Se não tiver mais um item no input ele reseta o progresso
    if(input == undefined){
      if(progress > 0){
        console.warn("§cItem Removido, Progresso Resetado")
        info.progress = 0
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
          if(level != levelOld){
            backpackInv.setItem(firstSlot +4, furnaceArrowIcons[level])
            console.warn("§cProgress:§r", level)
          }
          info.progress -= 2
        }
        continue
      }

      const gettedFuelTime = furnaceFuelList[fuel.typeId]
      if(gettedFuelTime == undefined){
        if(progress > 0){
          const levelOld = Math.floor(((progress +1) * inverseProgress) *22)
          const level = Math.floor((progress * inverseProgress) *22)
          if(level != levelOld){
            backpackInv.setItem(firstSlot +4, furnaceArrowIcons[level])
            console.warn("§cProgress:§r", level)
          }
          info.progress -= 2
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
        console.warn("§cOutput não correspondente, Progresso Resetado")
        info.progress = 0
      }
      continue
    }

    info.progress++
    // console.warn("§aProgresso:§r", progress, Math.floor((progress / 200) * 22))

    const levelOld = Math.floor(((progress -1) * inverseProgress) *22)
    const level = Math.floor((progress * inverseProgress) *22)
    if(level != levelOld){
      backpackInv.setItem(firstSlot +4, furnaceArrowIcons[level])
      console.warn("§aProgress:§r", level)
    }
    if(info.progress == 200){
      if(output == undefined){
        output = new ItemStack(expectedOutput)
      } else {
        output.amount++
      }
      backpackInv.setItem(firstSlot +2, output)
      if(input.amount -1 == 0){
        backpackInv.setItem(firstSlot, undefined)
      } else {
        input.amount--
        backpackInv.setItem(firstSlot, input)
      }
      info.progress = 0
    }
    // console.warn(input.typeId, "=>", output?.typeId)
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
    // console.warn("Fazer ele pegar o progresso atual e o combustivel atual, pra ele continuar de onde parou")
    const info = furnaceListenList[backpack.id]
    if(info == undefined){
      furnaceListenList[backpack.id] = { backpack, backpackInv, firstSlot, tryStop: false, fuelMax: 0, fuelTime: 0, progress: 0 }
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
    // console.warn("Não sei se vai preicsar fazer ele salvar as informações de fuelTime e progress em dynamic, acho que não")
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