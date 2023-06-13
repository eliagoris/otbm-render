# otbm render

A project to render a Remeres map in the browser

- Reads a `.otbm` file (Remeres map) in JSON format using otbm2json
- Writes to a JSON file (this can be skipped, use only JSON variables later) - TODO
- Uses open-tibia-library to read the `.dat` and `.spr` files
- Load the proper sprite from the `.spr` file for each map item
- Renders the map using pixi.js
