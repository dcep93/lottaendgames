/** Independent move/terminal audit: ordinary chess legality filtered by the
 * custom prohibitions. Does not import production move generation or indexing.
 */
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { Chess } from '../../app/node_modules/chess.js/dist/esm/chess.js'

const fixtures = JSON.parse(readFileSync(new URL('../../app/src/mate/rules/twoKnightsPawnTableFixtures.json', import.meta.url), 'utf8'))
const index = (s: string) => s.charCodeAt(0) - 97 + 8 * (Number(s[1]) - 1)
function idOf(chess: Chess) {
  const pieces = chess.board().flat().filter(Boolean)
  const knights = pieces.filter(p => p!.type === 'n').map(p => index(p!.square)).sort((a,b) => a-b)
  const [a,b] = knights
  const wk = pieces.find(p => p!.type === 'k' && p!.color === 'w')!
  const bk = pieces.find(p => p!.type === 'k' && p!.color === 'b')!
  const pawn = pieces.find(p => p!.type === 'p' || p!.type === 'q')!
  const layer = pawn.type === 'q' ? 0 : Number(pawn.square[1])-1
  const pair = a*(127-a)/2+b-a-1
  const board = ((layer*64+index(wk.square))*2016+pair)*64+index(bk.square)
  return board*2+(chess.turn()==='b'?1:0)
}
const permitted = (chess: Chess) => chess.moves({verbose:true}).filter(m => !m.captured && m.piece !== 'q' && (!m.promotion || m.promotion === 'q'))
let edges = 0, terminals = 0
for (const p of fixtures.positions) {
  const chess = new Chess(p.fen)
  assert.equal(idOf(chess), p.id, p.fen)
  const actual = permitted(chess).map(m => {
    chess.move(m)
    const result = {uci:m.from+m.to+(m.promotion??''),id:idOf(chess)}
    chess.undo()
    return result
  }).sort((a,b) => a.uci.localeCompare(b.uci))
  const expected = p.moves.map(({uci,id}: {uci:string,id:number})=>({uci,id})).sort((a,b)=>a.uci.localeCompare(b.uci))
  assert.deepEqual(actual, expected, p.fen)
  edges += actual.length
  if (!actual.length) {
    ++terminals
    assert.equal(p.dtm === 0, chess.turn()==='b' && chess.isCheck(), p.fen)
  }
}
const line = fixtures.worstLine
const chess = new Chess(line.fen)
const san: string[] = []
for (const uci of line.uci) {
  const m = permitted(chess).find(m => m.from+m.to+(m.promotion??'') === uci)
  assert.ok(m, `Not permitted: ${uci} in ${chess.fen()}`)
  const played = chess.move(m)
  san.push(played.san)
}
assert.equal(san.length, line.dtm)
assert.equal(chess.turn(),'b')
assert.equal(chess.isCheck(),true)
assert.deepEqual(permitted(chess),[])
const url = `http://localhost:5173/mate/two-knights-pawn#fen=${line.fen.replaceAll(' ','_')}&moves=${san.map(encodeURIComponent).join(',')}&cursor=0`
const result = {positions:fixtures.positions.length,edges,terminals,rootDtm:line.dtm,san,url,finalFen:chess.fen()}
writeFileSync(new URL('./work/custom-tablebase-data/independent-verification.json',import.meta.url),JSON.stringify(result,null,2)+'\n')
console.log(JSON.stringify(result,null,2))
