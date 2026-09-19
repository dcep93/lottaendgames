// Rasterize the same SVG components used by MateBoard, without a second piece set.
import { renderToStaticMarkup } from 'react-dom/server'
import { defaultPieces } from 'react-chessboard'
import sharp from 'sharp'
const size = Number(process.argv[2] ?? 256)
if (!Number.isInteger(size) || size <= 0) throw new Error('Expected a positive piece size')

const sprites = {}
for (const [symbol, key] of Object.entries({K: 'wK', k: 'bK', B: 'wB', N: 'wN'})) {
  const svg = renderToStaticMarkup(defaultPieces[key]({}))
    .replace('width="100%" height="100%"', `width="${size}" height="${size}"`)
  sprites[symbol] = (await sharp(Buffer.from(svg)).png().toBuffer()).toString('base64')
}
process.stdout.write(JSON.stringify(sprites))
