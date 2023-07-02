# otbm-render

Render a Remeres map in the browser.

What is happening in this project:

- Reads your `.otbm` file (Remeres map).
- Reads your `.dat`, `.spr`, & `.otb` files.
- Loops through the entire map and renders item sprites using pixi.js.

_In a nutshell, you can create your game using Remeres, Open Tibia tools, and sprites; and by using this project, you can develop & deploy your game to the web browser. This project is barebones and is meant to be further developed._

Thanks to the Open Tibia community for making this possible. Especially the [open-tibia-library](https://github.com/gesior/open-tibia-library), [otbm2json](https://github.com/Inconcessus/OTBM2JSON), [open_tibia_sprite_pack](https://github.com/peonso/opentibia_sprite_pack), & [RME](https://github.com/hampusborgos/rme) authors.

## develop

- clone this repo
- run `yarn`
- run `yarn build`
- run `yarn dev`
