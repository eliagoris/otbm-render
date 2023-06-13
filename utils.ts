import * as PIXI from "pixi.js"
import { FrameGroupType } from "./modules/constants/const"
import { ImageGenerator } from "./modules/imageGenerator/imageGenerator"
import { OtbManager } from "./modules/otbFile/otbManager"
import { DatManager } from "./modules/datFile/datManager"
let untitled = require("./Untitled.json")

const tileSize = 32

export function renderMap(
  tilesContainer,
  itemsContainer,
  datManager: DatManager,
  spriteManager,
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
    tileid: number
    items?: { type: number; id: number }[]
  }[] = []

  features.forEach((feature) => {
    // type 4 are tiles and items
    if (feature.type === 4) {
      feature.tiles.forEach((tile) => {
        if (tile.type === 5) {
          tiles.push(tile)
        }
      })
    }
  })

  tiles.forEach((tile) => {
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
          pixiSprite.zIndex = 10

          itemsContainer.addChild(pixiSprite)
        }
      })
    }
  })

  return { mapJson: untitled }
}
