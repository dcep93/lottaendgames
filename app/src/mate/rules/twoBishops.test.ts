import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  SQUARE_TRANSFORMS,
  findPiece,
  getChess,
  getEndgamePiecePlacements,
  kingDistance,
  squareCoordinates,
  transformFen,
} from '../chess'
import {
  compareTwoBishopsBlackScores,
  compareTwoBishopsWhiteScores,
  getMateRuleSet,
  getTwoBishopsPhaseLabel,
  isTwoBishopsPhaseTwoPosition,
  scoreTwoBishopsBlackMove,
  scoreTwoBishopsWhiteMove,
  twoBishopsRuleSet,
  twoBishopsWhiteRules,
} from './index'
import { TWO_BISHOPS_DIAGRAM_POSITIONS } from './twoBishopsDiagramPositions'

const WHITE_RULE_IDS = [
  'mate',
  'bishops safe',
  'no stalemate',
  'conclave step',
  'king closer',
  'finish wall',
  'start wall',
] as const

type UniversalOutcome = {
  readonly san: string
  readonly mate: boolean
  readonly bishopCanBeCaptured: boolean
  readonly stalemate: boolean
}

function universalOutcomes(fen: string): UniversalOutcome[] {
  return getChess(fen).moves().map((san) => {
    const chess = getChess(fen)
    chess.move(san)
    const mate = chess.isCheckmate()
    return {
      san,
      mate,
      bishopCanBeCaptured: chess
        .moves({ verbose: true })
        .some((reply) => reply.captured === 'b'),
      stalemate: !mate && chess.isStalemate(),
    }
  })
}

function expectedUniversalSurvivors(fen: string): string[] {
  let survivors = universalOutcomes(fen)
  if (survivors.some(({ mate }) => mate)) {
    return survivors.filter(({ mate }) => mate).map(({ san }) => san)
  }
  if (survivors.some(({ bishopCanBeCaptured }) => !bishopCanBeCaptured)) {
    survivors = survivors.filter(
      ({ bishopCanBeCaptured }) => !bishopCanBeCaptured,
    )
  }
  if (survivors.some(({ stalemate }) => !stalemate)) {
    survivors = survivors.filter(({ stalemate }) => !stalemate)
  }
  return survivors.map(({ san }) => san)
}

test('Two Bishops exposes conclave step before the wall priorities', () => {
  assert.deepEqual(
    twoBishopsWhiteRules.map(({ id }) => id),
    WHITE_RULE_IDS,
  )
  assert.deepEqual(
    twoBishopsWhiteRules.map(({ shortLabel, helpText }) => ({
      shortLabel,
      helpText,
    })),
    [
      { shortLabel: 'mate', helpText: '' },
      { shortLabel: 'pieces safe', helpText: '' },
      { shortLabel: 'no stalemate', helpText: '' },
      {
        shortLabel: 'conclave step',
        helpText:
          'When the pieces are in the position shown, make the conclave step.',
      },
      {
        shortLabel: 'king closer',
        helpText:
          "When the bishop wall is two squares from Black's king, bring White's king closer to Black's king, or the wall opposition moat rank/file.",
      },
      {
        shortLabel: 'finish wall',
        helpText:
          "When one bishop is a knight's move from Black's king, place the other bishop beside it in one-square opposition to Black's king.",
      },
      {
        shortLabel: 'start wall',
        helpText: "Place a bishop in two-square opposition to Black's king.",
      },
    ],
  )
  assert.deepEqual(
    getMateRuleSet('two-bishops').whiteRuleDescriptions.map(({ id }) => id),
    WHITE_RULE_IDS,
  )
  assert.equal(twoBishopsRuleSet.whiteMoveOverride, undefined)
  for (const rule of twoBishopsWhiteRules) {
    assert.equal(rule.applies, undefined)
    assert.equal(rule.subpriorities, undefined)
  }
})

test('the visible strategic comparisons run in their displayed order', () => {
  const ruleSet = getMateRuleSet('two-bishops')
  const positions = [
    '8/8/8/8/8/1KB5/4k3/1B6 w - - 0 1',
    '8/8/8/8/8/8/4K3/3BB1k1 w - - 0 1',
    '5Bk1/3B4/5K2/8/8/8/8/8 w - - 0 1',
    '8/8/8/1B6/8/8/2K5/k1B5 w - - 14 8',
    '8/8/7k/5K2/8/6B1/6B1/8 w - - 0 1',
  ]

  for (const fen of positions) {
    const expected = expectedUniversalSurvivors(fen)
    const conclaveMoves = expected.filter(
      (san) => scoreTwoBishopsWhiteMove(fen, san).conclaveStepPenalty === 0,
    )
    const afterConclave =
      conclaveMoves.length > 0 ? conclaveMoves : expected
    const kingMoves = afterConclave.filter(
      (san) => scoreTwoBishopsWhiteMove(fen, san).kingCloserPenalty === 0,
    )
    const afterKing = kingMoves.length > 0 ? kingMoves : afterConclave
    const finishWallMoves = afterKing.filter(
      (san) => scoreTwoBishopsWhiteMove(fen, san).finishWallPenalty === 0,
    )
    const afterFinish =
      finishWallMoves.length > 0 ? finishWallMoves : afterKing
    const startWallMoves = afterFinish.filter(
      (san) => scoreTwoBishopsWhiteMove(fen, san).startWallPenalty === 0,
    )
    const expectedAfterWall =
      startWallMoves.length > 0 ? startWallMoves : afterFinish
    assert.deepEqual(ruleSet.idealWhiteMoves(fen), expectedAfterWall, fen)
    for (const first of expectedAfterWall) {
      const firstScore = scoreTwoBishopsWhiteMove(fen, first)
      assert.deepEqual(
        Object.keys(firstScore).sort(),
        [
          'bishopSafetyPenalty',
          'conclaveStepPenalty',
          'finishWallPenalty',
          'kingCloserPenalty',
          'matePenalty',
          'stalematePenalty',
          'startWallPenalty',
        ],
        fen,
      )
      for (const second of expectedAfterWall) {
        assert.equal(
          compareTwoBishopsWhiteScores(
            firstScore,
            scoreTwoBishopsWhiteMove(fen, second),
          ),
          0,
          `${fen}: ${first} and ${second} must remain tied`,
        )
      }
    }
  }
})

test('start wall selects Bf5 in the supplied position', () => {
  const ruleSet = getMateRuleSet('two-bishops')
  const fen = '8/2BB4/2K5/8/8/8/5k2/8 w - - 0 1'
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Bf5'])
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Bf5').startWallPenalty, 0)
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'start wall')
})

test('finish wall follows Bf5 Ke3 with Be5', () => {
  const fen = '8/2B5/2K5/5B2/8/4k3/8/8 w - - 2 2'
  const ruleSet = getMateRuleSet('two-bishops')
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Be5'])
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Be5').finishWallPenalty, 0)
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'finish wall')
})

test('king closer advances the king when an adjacent wall is two squares away', () => {
  const fen = '8/8/2K5/4BB2/8/5k2/8/8 w - - 4 3'
  const ruleSet = getMateRuleSet('two-bishops')
  const startingWhiteKing = findPiece(fen, 'w', 'k')!
  const blackKing = findPiece(fen, 'b', 'k')!
  const startingMoatRankDistance = Math.abs(
    squareCoordinates(startingWhiteKing.square).rank - 3,
  )
  const moves = ruleSet.idealWhiteMoves(fen)
  assert.ok(moves.length > 0)
  assert.ok(moves.includes('Kd5'))
  for (const san of moves) {
    const chess = getChess(fen)
    const move = chess.move(san)
    const resultWhiteKing = findPiece(chess.fen(), 'w', 'k')!
    assert.equal(move.piece, 'k')
    const closerToBlack =
      kingDistance(resultWhiteKing.square, blackKing.square) <
      kingDistance(startingWhiteKing.square, blackKing.square)
    const closerToMoatRank =
      Math.abs(squareCoordinates(resultWhiteKing.square).rank - 3) <
      startingMoatRankDistance
    assert.ok(closerToBlack || closerToMoatRank)
    assert.equal(scoreTwoBishopsWhiteMove(fen, san).kingCloserPenalty, 0)
  }
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'king closer')
})

test('king closer accepts Kc4 toward the wall opposition moat rank', () => {
  const fen = '8/8/8/3KBB2/8/4k3/8/8 w - - 6 4'
  const ruleSet = getMateRuleSet('two-bishops')
  assert.ok(ruleSet.idealWhiteMoves(fen).includes('Kc4'))
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Kc4').kingCloserPenalty, 0)
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'king closer')
})

test('conclave step selects Be4 in the supplied arrangement', () => {
  const fen = '8/8/8/4BB2/8/3K4/5k2/8 w - - 16 9'
  const ruleSet = getMateRuleSet('two-bishops')
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Be4'])
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Be4').conclaveStepPenalty, 0)
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'conclave step')
})

test('conclave step ignores rotation, reflection, translation, and board walls', () => {
  const ruleSet = getMateRuleSet('two-bishops')
  const source = '8/8/8/4BB2/8/3K4/5k2/8 w - - 16 9'
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = getChess(transformFen(source, transform)).fen()
    const moves = ruleSet.idealWhiteMoves(fen)
    assert.equal(moves.length, 1, fen)
    assert.equal(
      scoreTwoBishopsWhiteMove(fen, moves[0]!).conclaveStepPenalty,
      0,
      fen,
    )
    assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'conclave step', fen)
  }

  const againstWall = '4BB2/8/3K4/5k2/8/8/8/8 w - - 0 1'
  assert.deepEqual(ruleSet.idealWhiteMoves(againstWall), ['Be7'])
  assert.equal(ruleSet.currentWhiteHint(againstWall)?.id, 'conclave step')
})

test('mate, bishop safety, and stalemate remain mandatory', () => {
  const ruleSet = getMateRuleSet('two-bishops')

  const mateFen = '8/8/8/8/8/1BB5/2K5/k7 w - - 0 1'
  const mateMoves = ruleSet.idealWhiteMoves(mateFen)
  assert.ok(mateMoves.length > 0)
  for (const san of mateMoves) {
    const chess = getChess(mateFen)
    chess.move(san)
    assert.equal(chess.isCheckmate(), true, san)
  }

  const safetyFen = '5Bk1/3B4/5K2/8/8/8/8/8 w - - 0 1'
  assert.equal(ruleSet.idealWhiteMoves(safetyFen).includes('Be6+'), false)
  assert.equal(
    scoreTwoBishopsWhiteMove(safetyFen, 'Be6+').bishopSafetyPenalty,
    1,
  )

  const stalemateFen = '8/8/8/1B6/8/8/2K5/k1B5 w - - 0 1'
  assert.equal(ruleSet.idealWhiteMoves(stalemateFen).includes('Bc4'), false)
  assert.equal(
    scoreTwoBishopsWhiteMove(stalemateFen, 'Bc4').stalematePenalty,
    1,
  )
})

test('Two Bishops recommendations are symmetric', () => {
  const ruleSet = getMateRuleSet('two-bishops')
  for (const fen of [
    '5Bk1/3B4/5K2/8/8/8/8/8 w - - 0 1',
    '8/8/8/1B6/8/8/2K5/k1B5 w - - 0 1',
    '8/2BB4/2K5/8/8/8/5k2/8 w - - 0 1',
    '8/2B5/2K5/5B2/8/4k3/8/8 w - - 2 2',
    '8/8/2K5/4BB2/8/5k2/8/8 w - - 4 3',
    '8/8/8/3KBB2/8/4k3/8/8 w - - 6 4',
    '8/8/8/4BB2/8/3K4/5k2/8 w - - 16 9',
  ]) {
    const expectedCount = ruleSet.idealWhiteMoves(fen).length
    for (const transform of SQUARE_TRANSFORMS) {
      const transformed = getChess(transformFen(fen, transform)).fen()
      assert.equal(
        ruleSet.idealWhiteMoves(transformed).length,
        expectedCount,
        transformed,
      )
    }
  }
})

test('White recommendations depend only on the board position', () => {
  const ruleSet = getMateRuleSet('two-bishops')
  const fresh = '5Bk1/3B4/5K2/8/8/8/8/8 w - - 0 1'
  const old = '5Bk1/3B4/5K2/8/8/8/8/8 w - - 76 39'
  assert.deepEqual(ruleSet.idealWhiteMoves(fresh), ruleSet.idealWhiteMoves(old))
  assert.equal(
    ruleSet.currentWhiteHint(fresh)?.id,
    ruleSet.currentWhiteHint(old)?.id,
  )
})

test('Phase 1 and 2 remain board-derived display metadata only', () => {
  const phaseOne = '8/8/8/8/8/8/4K3/3BB1k1 w - - 0 1'
  const phaseTwo = '4BB2/4K2k/8/8/8/8/8/8 w - - 0 1'
  assert.equal(isTwoBishopsPhaseTwoPosition(phaseOne), false)
  assert.equal(getTwoBishopsPhaseLabel(phaseOne), '1/2')
  assert.equal(isTwoBishopsPhaseTwoPosition(phaseTwo), true)
  assert.equal(getTwoBishopsPhaseLabel(phaseTwo), '2/2')

  const ruleSet = getMateRuleSet('two-bishops')
  for (const fen of [phaseOne, phaseTwo]) {
    assert.equal(ruleSet.phase(fen), getTwoBishopsPhaseLabel(fen))
    const universal = expectedUniversalSurvivors(fen)
    const conclaveMoves = universal.filter(
      (san) => scoreTwoBishopsWhiteMove(fen, san).conclaveStepPenalty === 0,
    )
    const afterConclave =
      conclaveMoves.length > 0 ? conclaveMoves : universal
    const kingMoves = afterConclave.filter(
      (san) => scoreTwoBishopsWhiteMove(fen, san).kingCloserPenalty === 0,
    )
    const afterKing = kingMoves.length > 0 ? kingMoves : afterConclave
    const finishMoves = afterKing.filter(
      (san) => scoreTwoBishopsWhiteMove(fen, san).finishWallPenalty === 0,
    )
    const afterFinish = finishMoves.length > 0 ? finishMoves : afterKing
    const wallMoves = afterFinish.filter(
      (san) => scoreTwoBishopsWhiteMove(fen, san).startWallPenalty === 0,
    )
    assert.deepEqual(
      ruleSet.idealWhiteMoves(fen),
      wallMoves.length > 0 ? wallMoves : afterFinish,
    )
  }
})

test('Two Bishops keeps its phase explanation and diagram', () => {
  const ruleSet = getMateRuleSet('two-bishops')
  assert.deepEqual(ruleSet.help.notes, [
    "Phase 2 begins when Black cannot leave its current edge, or when White's king can seal that edge on this move.",
  ])
  assert.deepEqual(ruleSet.help.noteBoards.map(({ id }) => id), [
    'bishop-conclave-step',
    'bishop-corner-finish',
  ])
  const conclaveBoard = ruleSet.help.noteBoards[0]!
  assert.deepEqual(
    conclaveBoard.pieces,
    getEndgamePiecePlacements(TWO_BISHOPS_DIAGRAM_POSITIONS.conclaveStep.fen)
      .map(({ color, square, type }) => ({
        square,
        piece: color === 'w' ? type.toUpperCase() : type,
      })),
  )
  assert.deepEqual(conclaveBoard.arrows, [{ from: 'f5', to: 'e4' }])
  const board = ruleSet.help.noteBoards[1]!
  assert.deepEqual(
    board.pieces,
    getEndgamePiecePlacements(TWO_BISHOPS_DIAGRAM_POSITIONS.cornerFinish.fen)
      .map(({ color, square, type }) => ({
        square,
        piece: color === 'w' ? type.toUpperCase() : type,
      })),
  )
  assert.equal(
    getTwoBishopsPhaseLabel(TWO_BISHOPS_DIAGRAM_POSITIONS.cornerFinish.fen),
    '2/2',
  )
})

test('Black captures before seeking the center or a bishop', () => {
  const fen = '6B1/8/8/8/3k4/2B5/8/K7 b - - 0 1'
  const capture = scoreTwoBishopsBlackMove(fen, 'Kxc3')
  const quiet = scoreTwoBishopsBlackMove(fen, 'Ke4')
  assert.ok(compareTwoBishopsBlackScores(capture, quiet) < 0)
  assert.ok(
    getMateRuleSet('two-bishops').blackCandidates(fen).idealMoves.includes(
      'Kxc3',
    ),
  )
})

test('Two Bishops has no concealed White strategy selector', () => {
  const source = readFileSync(new URL('./twoBishops.ts', import.meta.url), 'utf8')
  assert.doesNotMatch(
    source,
    /edge finish|form wall|push with king|king approach|advance wall|waiting move|getGuaranteedWallAdvance|corner(?:Setup|Drive|Turn|Support)|followup|lookahead|previousTurnFen|whiteMoveOverride/,
  )
  assert.deepEqual(getMateRuleSet('two-bishops').help.blackPriorities, [
    "Take a piece if White isn't looking.",
    'Move toward the center.',
    'Move toward an unprotected bishop.',
  ])
})
