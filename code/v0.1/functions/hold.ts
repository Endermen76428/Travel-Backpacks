import { world, system, Entity, EntityComponentTypes, Container, EquipmentSlot, ItemLockMode, ItemStack, Player, Vector3 } from "@minecraft/server"
import { globalBackpackPos, OverworldDimension } from "../lib/variables"
import { backpackSizeEvent } from "./place"
import { apiWarn } from "../lib/player/warn"

const backpackPlayersListenList: { [key: string]: [Player, Entity, Container, number] } = {} // Player Id > Player Entity, Backpack Entity, Inventory, Last Slot
const playersSneaking: { [key: string]: boolean } = {} // Player Id > Is Sneaking
let amountOfListeners = 0

function startInverval(): void {
  const players = Object.entries(backpackPlayersListenList)
  const length = players.length
  let invalidPlayers = 0
  amountOfListeners = length

  for(let i = 0; i < length; i++){
    const [ key, info ] = players[i] ?? []
    if(key == undefined || info == undefined) continue
    const [ player, backpack, inventory, lastSlot ] = info

    // Remove o player da lista, ocorre quando o jogador sai do mundo
    if(!player.isValid || !backpack.isValid){
      invalidPlayers++
      deleteInfo(key)
      continue
    }

    const isSneaking = player.isSneaking

    if(!playersSneaking[key]){
      if(isSneaking){
        playersSneaking[key] = true
        removePlayerListen(player, player.selectedSlotIndex, true)
        continue
      }
    } else {
      if(!isSneaking){
        // Quando o player levantar ele trava novamente a backpack
        const hand = inventory.getItem(player.selectedSlotIndex)
        if(hand && hand.hasTag("travel_backpack:backpack")){
          hand.lockMode = ItemLockMode.slot
          inventory.setItem(player.selectedSlotIndex, hand)
        }
        delete playersSneaking[key]
      }
      continue
    }

    if(lastSlot != player.selectedSlotIndex){
      removePlayerListen(player, lastSlot)
      deleteInfo(key)
      continue
    }

    // Se o item não for mais uma backpack remove o player da lista
    const hand = inventory.getItem(player.selectedSlotIndex)
    if(!hand || !hand.hasTag("travel_backpack:backpack")){
      invalidPlayers++
      deleteInfo(key)
      continue
    }

    const playerHead = player.getHeadLocation()

    // Teleporta a entidade na exata localização da cabeça do jogador se tiver muito longe
    if(!(playerHead.x == backpack.location.x && playerHead.y == backpack.location.y && playerHead.z == backpack.location.z)){
      backpack.teleport(playerHead, {dimension: player.dimension})
    }
  }

  // Cancela o loop se não tiver mais jogadores
  if(length == invalidPlayers){
    amountOfListeners = 0
    return
  }

  // Reinicia o loop
  system.run(() => startInverval())
}

function deleteInfo(playerId: string): void {
  delete backpackPlayersListenList[playerId]
  delete playersSneaking[playerId]
}

export function addPlayerListen(player: Player, item: ItemStack, slot: number): void {
  const inventory = player.getComponent(EntityComponentTypes.Inventory)?.container
  if(!inventory) return

  let entity: Entity | undefined

  const itemBackpackId = item.getDynamicProperty("id")
  if(typeof itemBackpackId == "string"){
    // Pega a entidade que está na região de salvamento
    entity = world.getEntity(itemBackpackId)
    if(!entity){
      const structure = world.structureManager.get(`travel_backpack:${itemBackpackId}`)
      if(structure){
        const pos = {x: player.location.x, y: player.dimension.heightRange.max -1, z: player.location.z}
        world.structureManager.place(structure, player.dimension, pos, {includeBlocks: false})
        entity = player.dimension.getEntities({type: "travel_backpack:backpack", location: pos, maxDistance: 1})[0]
      } else {
        if(player.dimension.isChunkLoaded(player.location) == false) return
        apiWarn.notify(player, "§cErro ao pegar mochila do structure, resetando a mochila!", {sound: "warn.ender_addon_pack:break"})
        // Gera uma mochila nova se der algum erro na hora de pegar a backpack salva
        const inventorySize = backpackSizeEvent[item.typeId] ?? 0
        entity = player.dimension.spawnEntity("travel_backpack:backpack", player.location, {spawnEvent: `travel_backpack:inventory${inventorySize}`})
        entity.nameTag = `ui.travel_backpack:backpack.size.${inventorySize}`
        entity.addTag(player.id)
      }
    }
  } else {
    // Gera uma mochila nova pois nunca foi colocada no chão para gerar o primeiro id
    const inventorySize = backpackSizeEvent[item.typeId] ?? 0
    entity = player.dimension.spawnEntity("travel_backpack:backpack", player.location, {spawnEvent: `travel_backpack:inventory${inventorySize}`})
    entity.nameTag = `ui.travel_backpack:backpack.size.${inventorySize}`
    entity.addTag(player.id)
  }

  if(!entity || !entity.isValid) return

  entity.triggerEvent("travel_backpack:remove_timer")
  if(player.isSneaking){
    entity.teleport(globalBackpackPos, {dimension: player.dimension})
  } else {
    entity.teleport(player.getHeadLocation(), {dimension: player.dimension})
  }
  backpackPlayersListenList[player.id] = [player, entity, inventory, slot]

  item.setDynamicProperty("id", entity.id)
  item.setLore([{translate: "lore.travel_backpack:backpack.id", with: [entity.id]}])
  if(!player.isSneaking) item.lockMode = ItemLockMode.slot

  inventory.setItem(slot, item)

  amountOfListeners == 0 && startInverval()
}

function removePlayerListen(player: Player, slot: number, sneaking = false): void {
  const inventory = player.getComponent(EntityComponentTypes.Inventory)?.container
  if(!inventory) return

  const item = inventory.getItem(slot)
  if(!item || !item.hasTag("travel_backpack:backpack")) return

  const backpackId = item.getDynamicProperty("id")
  if(typeof backpackId != "string") return

  const entity = world.getEntity(backpackId)
  if(!entity || !entity.isValid) return

  entity.teleport(globalBackpackPos, {dimension: OverworldDimension})
  if(!sneaking) entity.triggerEvent("travel_backpack:add_timer")

  item.lockMode = ItemLockMode.none

  inventory.setItem(slot, item)
}