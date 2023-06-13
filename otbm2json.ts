import { writeFileSync } from "fs"

// @ts-ignore
import { read, serialize, write } from "otbm2json"
const data = read("./public/Untitled.otbm")

writeFileSync("./public/Untitled.json", JSON.stringify(data))
