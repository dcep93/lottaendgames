import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import data from './twoKnightsPawnTableData.json'
import { installTwoKnightsPawnTable } from './twoKnightsPawnTable'
const bytes = gunzipSync(
  readFileSync(new URL(`../../../public${data.url}`, import.meta.url)),
)
installTwoKnightsPawnTable(
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
)
