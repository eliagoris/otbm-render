import { Client } from "open-tibia-library/dist/client"
import { DatManager } from "open-tibia-library/dist/datFile/datManager"
import { OtbManager } from "open-tibia-library/dist/otbFile/otbManager"
import { SpriteManager } from "open-tibia-library/dist/sprFile/spriteManager"
import { ImageGenerator } from "open-tibia-library/dist/imageGenerator/imageGenerator"
import * as PIXI from "pixi.js"
import { Sprite } from "open-tibia-library/dist/sprFile/sprite"
import { renderMap } from "./utils"
import { Grid, AStarFinder } from "pathfinding"

// Define a target point for the character to move towards
let targetPoint: number[][] | null = null

async function testLoadFromUrlsAndDrawImage() {
  const client = new Client()
  client.setClientVersion(1041)

  // const serverUrl = "http://localhost:4000/"
  const serverUrl = "https://otbm-render.vercel.app/"

  const datManager = new DatManager(client)
  await datManager.loadDatFromUrl(serverUrl + "game.dat").then((datLoaded) => {
    console.log("loaded dat", datLoaded)
  })

  const otbManager = new OtbManager(client)
  await otbManager.loadOtbFromUrl(serverUrl + "items.otb").then((otbLoaded) => {
    console.log("loaded otb", otbLoaded)
  })

  const spriteManager = new SpriteManager(client)
  await spriteManager
    .loadSprFromUrl(serverUrl + "game.spr")
    .then((sprLoaded) => {
      console.log("loaded spr", sprLoaded)
    })

  // Create a PIXI Application
  const app = new PIXI.Application<HTMLCanvasElement>({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0x000000,
    antialias: true,
  })

  // Add the PIXI canvas to the HTML body
  document.body.appendChild(app.view)

  // Load the spritesheet image
  // Define the tile size
  const tileSize = 32

  // Create a tilesContainer for the tiles
  const cameraViewport = new PIXI.Container()
  app.stage.addChild(cameraViewport)

  // Create separate containers for different layers
  const tilesContainer = new PIXI.Container()
  const itemsContainer = new PIXI.Container()
  const characterContainer = new PIXI.Container()

  cameraViewport.addChild(tilesContainer)
  cameraViewport.addChild(itemsContainer)
  cameraViewport.addChild(characterContainer)

  const imageGenerator = new ImageGenerator(
    datManager,
    spriteManager,
    otbManager
  )

  const { mapJson, map } = renderMap(
    tilesContainer,
    itemsContainer,
    datManager,
    spriteManager,
    otbManager,
    imageGenerator
  )

  const grid = new Grid(mapJson.data.mapWidth, mapJson.data.mapHeight)
  for (let x = 0; x < mapJson.data.mapWidth; x++) {
    for (let y = 0; y < mapJson.data.mapHeight; y++) {
      const cell = map[x][y]
      // Mark walkable cells as 0 and non-walkable cells as 1
      grid.setWalkableAt(
        x,
        y,
        !cell || !cell.items?.some((item) => item.itemThing.isNotWalkable())
      )
    }
  }

  // Calculate the map width and height in pixels
  const mapWidthPixels = mapJson.data.mapWidth * tileSize
  const mapHeightPixels = mapJson.data.mapHeight * tileSize

  console.log("mapWidthPixels", mapWidthPixels)
  // Set the initial camera position to the center of the map
  const camera = {
    x: mapWidthPixels / 2,
    y: mapHeightPixels / 2,
  }

  const outfitSprites: { sprite: Sprite }[] =
    imageGenerator.generateOutfitAnimationImages(1) || []

  const [top1, , , right1, , , bottom1, , , left1, , ,] = outfitSprites

  // Create the character sprite
  const characterSprite = new PIXI.Sprite(
    PIXI.Texture.fromBuffer(
      new Uint8Array(bottom1.sprite.getPixels().m_buffer.buffer),
      bottom1.sprite.getWidth(),
      bottom1.sprite.getHeight()
    )
  )
  characterSprite.position.set(mapWidthPixels / 2, mapHeightPixels / 2)
  characterContainer.addChild(characterSprite)

  cameraViewport.scale.set(2)

  // move the camera to the initial position
  cameraViewport.position.set(
    app.screen.width / 2 - camera.x * cameraViewport.scale.x,
    app.screen.height / 2 - camera.y * cameraViewport.scale.y
  )

  // Update the character position based on the sprite facing direction
  // Update the character position based on the sprite facing direction
  function updateCharacterPosition(direction: string, speed: number) {
    let dx = 0
    let dy = 0
    let spriteToUpdate: Sprite

    if (direction === "top") {
      dy = -1
      spriteToUpdate = top1.sprite
    } else if (direction === "right") {
      dx = 1
      spriteToUpdate = right1.sprite
    } else if (direction === "bottom") {
      dy = 1
      spriteToUpdate = bottom1.sprite
    } else {
      dx = -1
      spriteToUpdate = left1.sprite
    }

    const targetX = characterSprite.x + dx * speed
    const targetY = characterSprite.y + dy * speed

    const targetCellX = Math.floor(targetX / tileSize)
    const tagetCellY = Math.floor(targetY / tileSize)

    const targetMapCell = map[targetCellX][tagetCellY]

    // that means there is no tile in the target cell (empty space)
    if (!targetMapCell) {
      return true
    }

    // check for items, such as not walkable items
    const items = targetMapCell.items
    if (items) {
      const isThereNotWalkable = items.some((item) =>
        item.itemThing.isNotWalkable()
      )

      // prevent character from walking on not walkable items
      if (isThereNotWalkable) {
        return true
      }
    }

    // Move the character sprite
    characterSprite.x = targetX
    characterSprite.y = targetY

    // Update the character sprite texture
    const texture = PIXI.Texture.fromBuffer(
      new Uint8Array(spriteToUpdate.getPixels().m_buffer.buffer),
      spriteToUpdate.getWidth(),
      spriteToUpdate.getHeight()
    )
    characterSprite.texture = texture

    // Update the camera position to follow the character sprite
    camera.x = characterSprite.x
    camera.y = characterSprite.y

    // Update the cameraViewport position to create the desired camera effect
    cameraViewport.position.set(
      app.screen.width / 2 - camera.x * cameraViewport.scale.x,
      app.screen.height / 2 - camera.y * cameraViewport.scale.y
    )
  }

  // Update the camera position based on the keyboard input
  function handleKeyboardInput() {
    const speed = 32

    function keydownHandler(event) {
      switch (event.code) {
        case "KeyW":
          updateCharacterPosition("top", speed)
          break
        case "KeyA":
          updateCharacterPosition("left", speed)
          break
        case "KeyS":
          updateCharacterPosition("bottom", speed)
          break
        case "KeyD":
          updateCharacterPosition("right", speed)
          break
      }
    }

    document.addEventListener("keydown", keydownHandler)
  }

  // Call the function to handle keyboard input and update the camera
  handleKeyboardInput()

  function handleMouseClick(event) {
    const targetX =
      camera.x + (event.clientX - app.screen.width / 2) / cameraViewport.scale.x
    const targetY =
      camera.y +
      (event.clientY - app.screen.height / 2) / cameraViewport.scale.y

    // Use pathfinding to find a path to the clicked point
    const finder = new AStarFinder()
    const startX = Math.floor(characterSprite.x / tileSize)
    const startY = Math.floor(characterSprite.y / tileSize)
    const endX = Math.floor(targetX / tileSize)
    const endY = Math.floor(targetY / tileSize)
    const path = finder.findPath(startX, startY, endX, endY, grid.clone())

    if (path.length > 0) {
      // Convert path to world coordinates
      const newPath = path.map(([x, y]) => [x * tileSize, y * tileSize])

      // Remove the current position from the path
      newPath.shift()

      // Set the path as the target points
      targetPoint = newPath
    } else {
      targetPoint = null
    }
  }
  // Add a mouse click event listener to the app's view
  app.view.addEventListener("click", handleMouseClick)

  function updateCharacterMovement() {
    const speed = 2

    if (targetPoint && targetPoint?.length > 0) {
      const [targetX, targetY] = targetPoint[0]
      const dx = targetX - characterSprite.x
      const dy = targetY - characterSprite.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance > speed) {
        const vx = dx / distance
        const vy = dy / distance

        characterSprite.x += vx * speed
        characterSprite.y += vy * speed
        updateCharacterTextureAndCamera(vx, vy)
      } else {
        targetPoint?.shift()
      }
    }
  }

  // Function to update character sprite texture and camera position
  function updateCharacterTextureAndCamera(vx, vy) {
    // Update the character sprite texture
    const spriteToUpdate = getCharacterSpriteBasedOnDirection(vx, vy)
    const texture = PIXI.Texture.fromBuffer(
      new Uint8Array(spriteToUpdate.getPixels().m_buffer.buffer),
      spriteToUpdate.getWidth(),
      spriteToUpdate.getHeight()
    )
    characterSprite.texture = texture

    // Update the camera position to follow the character sprite
    camera.x = characterSprite.x
    camera.y = characterSprite.y

    // Update the cameraViewport position for desired camera effect
    cameraViewport.position.set(
      app.screen.width / 2 - camera.x * cameraViewport.scale.x,
      app.screen.height / 2 - camera.y * cameraViewport.scale.y
    )
  }

  // Define a function to get the appropriate character sprite based on movement direction
  function getCharacterSpriteBasedOnDirection(vx, vy) {
    if (Math.abs(vx) > Math.abs(vy)) {
      if (vx > 0) return right1.sprite
      else return left1.sprite
    } else {
      if (vy > 0) return bottom1.sprite
      else return top1.sprite
    }
  }

  // Define the game loop to update character movement
  function gameLoop() {
    updateCharacterMovement()
    requestAnimationFrame(gameLoop)
  }

  // Start the game loop
  gameLoop()
}

testLoadFromUrlsAndDrawImage()
