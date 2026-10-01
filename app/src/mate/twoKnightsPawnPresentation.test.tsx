import React from 'react'
import assert from 'node:assert/strict'
import test from 'node:test'
import { renderToStaticMarkup } from 'react-dom/server'
import TestRenderer, { act, type ReactTestRenderer } from 'react-test-renderer'
import './rules/twoKnightsPawnTestSetup'
import fixtures from './rules/twoKnightsPawnTableFixtures.json'
import { getChess } from './chess'
import { getMateRuleSet } from './rules'
import { createMateReplaySession, createMateSession, playWhiteMove } from './session'
import MateLog from './MateLog'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
const deps = {now: () => 0, random: () => 0, generatePosition: () => fixtures.worstLine.fen, getRuleSet: getMateRuleSet}

test('custom tablebase log marks unscored play neutrally and exports custom mate without a clock draw', async () => {
  const ruleSet = getMateRuleSet('two-knights-pawn')
  const row = fixtures.positions.find(row => row.dtm === null && getChess(row.fen).turn() === 'w' && row.moves.length > 0)!
  const initial = createMateSession({mateId:'two-knights-pawn',mode:'standard',startingFen:row.fen.replace('0 1','150 80')},deps)
  const manual = playWhiteMove(initial, ruleSet.whiteMoves(initial.fen)[0]!, deps)
  const board = getChess(fixtures.worstLine.fen)
  const moves = fixtures.worstLine.uci.map(uci => board.move({from:uci.slice(0,2),to:uci.slice(2,4),...(uci[4] ? {promotion:uci[4]} : {})}).san)
  const mate = createMateReplaySession({mateId:'two-knights-pawn',mode:'standard',startingFen:fixtures.worstLine.fen,moves},deps)
  const props = (session: typeof mate) => ({fen:session.fen,startingFen:session.startingFen,logs:session.logs,mateMode:'standard' as const,ruleSet,onCycleIdealWhite:()=>{},onCycleIdealBlack:()=>{},onCycleLegalBlack:()=>{}})
  assert.match(renderToStaticMarkup(React.createElement(MateLog, props(manual))),/No forced mate recommendation/)
  const original = Object.getOwnPropertyDescriptor(globalThis,'navigator')
  let copied = ''
  Object.defineProperty(globalThis,'navigator',{configurable:true,value:{clipboard:{writeText:async (text:string)=>{copied=text}}}})
  try {
    for (const [session, expected] of [[manual,'*'],[mate,'1-0']] as const) {
      let renderer: ReactTestRenderer | undefined
      try {
        await act(async()=>{renderer=TestRenderer.create(React.createElement(MateLog, props(session)))})
        await act(async()=>{await renderer!.root.findByProps({'aria-label':'Copy PGN to clipboard'}).props.onClick()})
        assert(copied.endsWith(expected),copied)
        const replay=getChess(); replay.loadPgn(copied)
        assert.equal(replay.fen(),session.fen)
      } finally { await act(async()=>renderer?.unmount()) }
    }
  } finally {
    if (original) Object.defineProperty(globalThis,'navigator',original)
    else Reflect.deleteProperty(globalThis,'navigator')
  }
})

test('Start Over clears an unsupported replay explanation and saves the supported default URL', async () => {
  const { default: MateWorkspace } = await import('./MateWorkspace')
  const { default: MateControls } = await import('./MateControls')
  const { resolveAppRoute } = await import('../routing')
  const { encodeMateReplay, encodeMateLiveFen } = await import('./share')
  const oldFen = 'k7/7p/8/5N2/8/4K3/8/6N1 w - - 0 1'
  const unsupported = resolveAppRoute('/mate/two-knights-pawn', encodeMateReplay(oldFen, ['Kd4', 'Kb8']))
  assert(unsupported.route.module === 'mate')
  assert(unsupported.route.sharedError)
  const replacements: string[] = []
  const BoardProbe = (props: {fen:string}) => React.createElement('div', {'data-fen':props.fen})
  let renderer: ReactTestRenderer | undefined
  try {
    await act(async () => {
      renderer = TestRenderer.create(React.createElement(MateWorkspace, {
        BoardComponent: BoardProbe, mateId:'two-knights-pawn', mateMode:'standard',
        sharedFen:oldFen, sharedMoves:null, sharedReplayCursor:null,
        sharedError:unsupported.route.module === 'mate' ? unsupported.route.sharedError : undefined,
        onReplaceHref:href => {replacements.push(href)},
      }))
    })
    assert.equal(renderer!.root.findByType(BoardProbe).props.fen, oldFen)
    assert(renderer!.root.findAllByProps({role:'alert'}).length > 0)
    assert.deepEqual(replacements, [])
    await act(async () => { renderer!.root.findByType(MateControls).props.onStartOver() })
    assert.equal(renderer!.root.findByType(BoardProbe).props.fen, fixtures.worstLine.fen)
    assert.equal(renderer!.root.findAllByProps({role:'alert'}).length, 0)
    assert.equal(replacements.at(-1), '/mate/two-knights-pawn' + encodeMateLiveFen(fixtures.worstLine.fen))
    const saved = new URL(replacements.at(-1)!, 'https://example.test')
    const reloaded = resolveAppRoute(saved.pathname, saved.hash)
    assert(reloaded.route.module === 'mate')
    assert.equal(reloaded.route.sharedError, undefined)
    assert.equal(reloaded.route.sharedFen, fixtures.worstLine.fen)
  } finally { await act(async () => renderer?.unmount()) }
})
