import * as PIXI from "pixi.js"
import { FrameGroupType } from "open-tibia-library/dist/constants/const"
import { ImageGenerator } from "open-tibia-library/dist/imageGenerator/imageGenerator"
import { OtbManager } from "open-tibia-library/dist/otbFile/otbManager"
import { DatManager } from "open-tibia-library/dist/datFile/datManager"
import untitled from "../public/Untitled.json"
import { SpriteManager } from "open-tibia-library/dist/sprFile/spriteManager"
import { DatThingType } from "open-tibia-library/dist/datFile/datThingType"

const tileSize = 32

export function renderMap(
  tilesContainer: PIXI.Container,
  itemsContainer: PIXI.Container,
  datManager: DatManager,
  spriteManager: SpriteManager,
  otbManager: OtbManager,
  generator: ImageGenerator
) {
  // Parse the JSON data to extract tile positions and IDs
  const json = untitled
  const features = json.data.nodes[0].features
  const tiles: {
    type: number
    x: number
    y: number
    tileid?: number
    items?: { type: number; id: number }[]
  }[] = []

  features.forEach((feature) => {
    // type 4 are tiles and items
    if (feature.type === 4) {
      feature.tiles?.forEach((tile) => {
        if (tile.type === 5) {
          tiles.push(tile)
        }
      })
    }
  })

  const gridSizeX = Math.ceil(json.data.mapWidth)
  const gridSizeY = Math.ceil(json.data.mapHeight)
  // the rendered map
  const map: {
    x: number
    y: number
    tile?: {
      sprite: PIXI.Sprite
      itemThing: DatThingType
      tileid: number
    }
    items?: {
      sprite: PIXI.Sprite
      itemThing: DatThingType
    }[]
  }[][] = new Array(gridSizeX)

  for (let i = 0; i < gridSizeX; i++) {
    map[i] = new Array(gridSizeY)
  }

  const items: {
    sprite: PIXI.Sprite
    itemThing: DatThingType
  }[] = []
  tiles.forEach((tile) => {
    // sometimes there is no tileid, only items. for example, a wall in an empty space.
    if (tile.tileid) {
      const tileClientId = otbManager.getItem(tile.tileid).getClientId()
      // get data from '.dat' about that item
      const tileThingType = datManager.getItem(tileClientId)
      // get first sprite [image] of that item
      const firstThingTypeImage = tileThingType
        .getFrameGroup(FrameGroupType.FrameGroupIdle)
        .getSprite(0)

      const firstImagePixelsData = spriteManager.getSprite(firstThingTypeImage)

      const sprite = new PIXI.Sprite(
        PIXI.Texture.fromBuffer(
          new Uint8Array(firstImagePixelsData.getPixels().m_buffer.buffer),
          32,
          32
        )
      )
      sprite.position.set(tile.x * tileSize, tile.y * tileSize)

      // Add the sprite to the tilesContainer
      tilesContainer.addChild(sprite)
    }

    map[tile.x][tile.y] = {
      x: tile.x,
      y: tile.y,
    }

    if (tile.items) {
      tile.items.forEach((item) => {
        const itemSprites = generator.generateItemImagesByClientId(item.id)

        // loop through all sprites for this item and add them to the tilesContainer
        for (
          let frameIndex = 0;
          frameIndex < itemSprites.length;
          frameIndex++
        ) {
          const itemSprite = itemSprites[frameIndex]

          const itemThing = datManager.getItem(item.id)
          console.log(itemThing.isNotWalkable())

          // const itemThingType = datManager.getItem(item.id)
          const pixiSprite = new PIXI.Sprite(
            PIXI.Texture.fromBuffer(
              // @ts-ignore
              new Uint8ClampedArray(itemSprite.getPixels().m_buffer.buffer),
              itemSprite.getWidth(),
              itemSprite.getHeight()
            )
          )

          pixiSprite.position.set(
            tile.x * tileSize - (itemSprite.getWidth() === 64 ? 32 : 0),
            tile.y * tileSize - (itemSprite.getWidth() === 64 ? 32 : 0)
          )

          itemsContainer.addChild(pixiSprite)
          items.push({
            sprite: pixiSprite,
            itemThing,
          })

          if (!map[tile.x][tile.y].items) {
            map[tile.x][tile.y].items = []
          }

          map[tile.x][tile.y].items?.push({
            sprite: pixiSprite,
            itemThing,
          })
        }
      })
    }
  })

  return { mapJson: untitled, map, items }
}
