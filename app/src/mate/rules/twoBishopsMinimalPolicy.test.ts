import assert from 'node:assert/strict'
import test from 'node:test'
import {
  SQUARE_TRANSFORMS,
  getChess,
  kingDistance,
  transformFen,
  transformSquare,
} from '../chess'
import {
  analyzeTwoBishopsWhiteSelection,
  compareTwoBishopsWhiteScores,
  getAdjacentDiagonalWallTargetCorners,
  getIdealTwoBishopsWhiteMoves,
  getTwoBishopsPhaseLabel,
  isTwoBishopsPhaseTwoPosition,
  scoreTwoBishopsWhiteMove,
  twoBishopsRuleSet,
  twoBishopsWhiteRules,
} from './twoBishops'
import { compareScoresByRules } from './selection'

const ACTIVE_RULE_IDS = [
  'mate',
  'bishops safe',
  'no stalemate',
  'rule r1',
  'rule r3',
  'rule r4',
  'rule r5',
  'rule r5.5',
  'rule r6',
  'rule r6.2',
  'rule r6.4',
  'rule r7',
  'rule r8',
  'rule r9',
  'rule r10',
  'rule r19',
  'rule r24',
  'rule r24.5',
  'rule r25',
  'rule r30',
]

test('Two Bishops exposes only the simplified experiment policy', () => {
  assert.deepEqual(
    twoBishopsWhiteRules.map(({ id }) => id),
    ACTIVE_RULE_IDS,
  )
  assert.deepEqual(
    twoBishopsRuleSet.help.noteBoards.map(({ id }) => id),
    ['two-bishops-target-square', 'two-bishops-phase-two', 'two-bishops-rule-r9-opposition', 'two-bishops-rule-r5-5-force-corner'],
  )
  assert.equal(twoBishopsRuleSet.help.noteBoards[0]?.noteIndex, 0)
  assert.equal(
    twoBishopsWhiteRules.find(({ id }) => id === 'rule r4')?.helpText,
    'Execute the mating pattern.',
  )
  assert.equal(
    twoBishopsWhiteRules.find(({ id }) => id === 'rule r5')?.helpText,
    'Prefer bishops on adjacent squares on their Phase 2 diagonals, enclosing Black on 2 edge squares, then prefer the White king on the Phase 2 square in line with those bishops.',
  )
  assert.equal(
    twoBishopsWhiteRules.find(({ id }) => id === 'rule r6')?.helpText,
    "Prefer bishops on unscreened Phase 2 diagonals, then prefer Bishops on their Phase 2 squares, then prefer the shortest king path to its Phase 2 square without entering Black's area, then Euclidean proximity to that same Phase 2 king square.",
  )
  assert.equal(
    twoBishopsWhiteRules.find(({ id }) => id === 'rule r3')?.helpText,
    "Prefer White's king out of the corner, then bishops not adjacent to a cornered White king, then bishops out of the corner.",
  )
  assert.equal(
    twoBishopsWhiteRules.find(({ id }) => id === 'rule r1')?.helpText,
    "With Black's king in the corner, prefer White's king on a Phase 2 square associated with that corner.",
  )
  assert.equal(
    twoBishopsWhiteRules.find(({ id }) => id === 'rule r9')?.helpText,
    "When the Black king is edge adjacent to the inner wall and the outer bishop is not on the target corner's edge, prefer White's king on the outer wall square in opposition to Black's king and closer to both bishops.",
  )
  assert.equal(
    twoBishopsWhiteRules.find(({ id }) => id === 'rule r10')?.helpText,
    "Prefer outer bishop off target corner's edge, then White king's step proximity to the target square, then bishops to have legal moves along their wall.",
  )
  assert.equal(twoBishopsWhiteRules.some(({ id }) => id === 'rule r12'), false)
  assert.equal(twoBishopsWhiteRules.some(({ id }) => id === 'rule r18.5'), false)
  assert.equal(
    twoBishopsWhiteRules.find(({ id }) => id === 'rule r19')?.helpText,
    "If the white King is on or adjacent to the outer diagonal, prefer the outer bishop at least 3 steps away from Black's king.",
  )
  assert.equal(
    twoBishopsWhiteRules.find(({ id }) => id === 'rule r24')?.helpText,
    'Prefer a bishop wall, otherwise prefer a bishop inside a king moat.',
  )
  assert.equal(
    twoBishopsWhiteRules.find(({ id }) => id === 'rule r24.5')?.helpText,
    'Prefer the White king closer to the diagonal one beyond the outer wall.',
  )
  assert.equal(
    twoBishopsWhiteRules.find(({ id }) => id === 'rule r25')?.helpText,
    'Prefer king proximity.',
  )
  assert.equal(
    twoBishopsWhiteRules.find(({ id }) => id === 'rule r30')?.helpText,
    "Prefer bishops further from Black's king, then prefer bishops closer to White's king.",
  )
})

test('rule r4 recognizes the exact Phase 2 geometry symmetrically', () => {
  const fen = '8/8/8/8/7k/4B3/4BK2/8 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    assert.equal(isTwoBishopsPhaseTwoPosition(transformedFen), true, transform.name)
  }
})

test('rule r4 executes every h-file stage symmetrically', () => {
  const stages = [
    { fen: '8/8/8/8/8/4B2k/4BK2/8 w - - 0 1', move: 'Bg5' },
    { fen: '8/8/8/8/8/4B3/4BK1k/8 w - - 0 1', move: 'Bg4' },
    { fen: '8/8/8/8/8/4B3/4BK2/7k w - - 0 1', move: 'Bg4' },
  ] as const
  for (const { fen, move } of stages) {
    const originalMove = getChess(fen)
      .moves({ verbose: true })
      .find((candidate) => candidate.san === move)!
    for (const transform of SQUARE_TRANSFORMS) {
      const transformedFen = transformFen(fen, transform)
      const transformedTarget = transformSquare(originalMove.to, transform)
      const transformedMove = getChess(transformedFen)
        .moves({ verbose: true })
        .find(
          (candidate) =>
            candidate.piece === originalMove.piece &&
            candidate.to === transformedTarget,
        )?.san
      assert.ok(transformedMove, `${move} ${transform.name}`)
      const score = scoreTwoBishopsWhiteMove(transformedFen, transformedMove)
      assert.equal(score.ruleR4Applies, true, `${move} ${transform.name}`)
      assert.equal(score.ruleR4Penalty, 0, `${move} ${transform.name}`)
    }
  }
})

test('rule r4 uses a non-checking bishop waiting move with Black on h4', () => {
  const fen = '8/8/8/8/7k/4B3/4BK2/8 w - - 0 1'
  const waitingScore = scoreTwoBishopsWhiteMove(fen, 'Bf4')
  assert.equal(waitingScore.ruleR4Applies, true)
  assert.equal(waitingScore.ruleR4Penalty, 0)
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Kg2').ruleR4Penalty, 1)
})

test('rule r4 preserves h3 control when Black is in the corner', () => {
  const fen = '8/8/8/6B1/6B1/8/5K2/7k w - - 0 1'
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Bh6').ruleR4Penalty, 0)
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Be2').ruleR4Penalty, 1)
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Kg3').ruleR4Penalty, 1)
})

test('rule r4 checks once the required control already exists symmetrically', () => {
  const fen = '8/8/8/8/6B1/4B3/5K1k/8 w - - 2 2'
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const from = transformSquare('e3', transform)
    const to = transformSquare('f4', transform)
    const move = getChess(transformedFen)
      .moves({ verbose: true })
      .find((candidate) => candidate.from === from && candidate.to === to)?.san
    assert.ok(move, transform.name)
    assert.deepEqual(
      getIdealTwoBishopsWhiteMoves(transformedFen),
      [move],
      transform.name,
    )
    assert.equal(
      scoreTwoBishopsWhiteMove(transformedFen, move).ruleR4Penalty,
      0,
      transform.name,
    )
  }
})

test('rule r4 accepts the b1-h7 diagonal waiting pattern symmetrically', () => {
  const fen = '7k/8/5KBB/8/8/8/8/8 w - - 4 3'
  const waitingTargets = ['b1', 'c2', 'd3', 'e4', 'f5', 'h7'] as const
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    assert.equal(isTwoBishopsPhaseTwoPosition(transformedFen), true, transform.name)
    for (const target of waitingTargets) {
      const move = getChess(transformedFen)
        .moves({ verbose: true })
        .find(
          (candidate) =>
            candidate.from === transformSquare('g6', transform) &&
            candidate.to === transformSquare(target, transform),
        )?.san
      assert.ok(move, `${target} ${transform.name}`)
      const score = scoreTwoBishopsWhiteMove(transformedFen, move)
      assert.equal(score.ruleR4Applies, true, `${target} ${transform.name}`)
      assert.equal(score.ruleR4Penalty, 0, `${target} ${transform.name}`)
    }
    const kingMove = getChess(transformedFen)
      .moves({ verbose: true })
      .find((candidate) => candidate.piece === 'k')?.san
    assert.ok(kingMove, transform.name)
    assert.equal(
      scoreTwoBishopsWhiteMove(transformedFen, kingMove).ruleR4Penalty,
      1,
      transform.name,
    )
  }
})

test('rule r4 retreats Bc1 with the other bishop anywhere on c2–h7 symmetrically', () => {
  for (const fixedBishop of ['c2', 'd3', 'e4', 'f5', 'g6', 'h7'] as const) {
    const original = getChess('8/8/8/8/8/2K5/kBB5/8 w - - 2 2')
    original.remove('c2')
    original.put({ type: 'b', color: 'w' }, fixedBishop)
    for (const transform of SQUARE_TRANSFORMS) {
      const chess = getChess(transformFen(original.fen(), transform))
      const from = transformSquare('b2', transform)
      const to = transformSquare('c1', transform)
      const move = chess.moves({ verbose: true }).find(
        (candidate) => candidate.from === from && candidate.to === to,
      )!
      const label = `${fixedBishop} ${transform.name}`
      assert.ok(move, label)
      const score = scoreTwoBishopsWhiteMove(chess.fen(), move.san)
      assert.equal(score.ruleR4Applies, true, label)
      assert.equal(score.ruleR4Penalty, 0, label)
      assert.deepEqual(getIdealTwoBishopsWhiteMoves(chess.fen()), [move.san], label)
      chess.move(move)
      assert.deepEqual(chess.moves({ verbose: true }).map((reply) => reply.to),
        [transformSquare('a1', transform)], label)
    }
  }
})

test('rule r4 does not apply the Bc1 retreat without its king and bishop geometry', () => {
  for (const fen of [
    '8/8/8/8/B7/2K5/kB6/8 w - - 0 1', // Other bishop off c2–h7.
    '8/8/8/8/2K5/8/kBB5/8 w - - 0 1', // White king too far away.
  ]) {
    for (const transform of SQUARE_TRANSFORMS) {
      const transformedFen = transformFen(fen, transform)
      const move = getChess(transformedFen).moves({ verbose: true }).find(
        (candidate) => candidate.from === transformSquare('b2', transform) &&
          candidate.to === transformSquare('c1', transform),
      )!
      assert.equal(scoreTwoBishopsWhiteMove(transformedFen, move.san).ruleR4Applies,
        false, `${fen} ${transform.name}`)
    }
  }
})

test('rule r4 executes the loaded a-file drive to mate against either corner reply symmetrically', () => {
  const fen = '8/8/8/k1B5/2BK4/8/8/8 w - - 0 1'
  for (const fourthReply of ['Ka3', 'Ka1']) {
    const original = getChess(fen)
    const line = ['Kc3', 'Ka4', 'Bb6', 'Ka3', 'Bb5', 'Ka2', 'Kc2', fourthReply,
      fourthReply === 'Ka3' ? 'Bc5+' : 'Bc5', 'Ka2', 'Bc4+', 'Ka1', 'Bd4#']
    const originalMoves = line.map((san) => original.move(san))
    assert.equal(original.isCheckmate(), true)
    for (const transform of SQUARE_TRANSFORMS) {
      const chess = getChess(transformFen(fen, transform))
      for (const [index, originalMove] of originalMoves.entries()) {
        const move = chess.moves({ verbose: true }).find(
          (candidate) => candidate.from === transformSquare(originalMove.from, transform) &&
            candidate.to === transformSquare(originalMove.to, transform),
        )
        assert.ok(move, `${index} ${fourthReply} ${transform.name}`)
        if (chess.turn() === 'w') {
          const score = scoreTwoBishopsWhiteMove(chess.fen(), move.san)
          assert.equal(score.ruleR4Applies, true, `${index} ${transform.name}`)
          assert.equal(score.ruleR4Penalty, 0, `${index} ${transform.name}`)
          assert.deepEqual(getIdealTwoBishopsWhiteMoves(chess.fen()), [move.san],
            `${index} ${fourthReply} ${transform.name}`)
        } else {
          // These are all Black's legal branches, not just cooperative replies.
          assert.equal(chess.moves().length, index === 7 ? 2 : 1, transform.name)
        }
        chess.move(move)
      }
      assert.equal(chess.isCheckmate(), true, transform.name)
    }
  }
})

test('rule r4 completes the extended waiting mating pattern symmetrically', () => {
  const fen = '7k/8/5KBB/8/8/8/8/8 w - - 4 3'
  const line = [
    ['Be4', 'Kg8'],
    ['Kg6', 'Kh8'],
    ['Bd3', 'Kg8'],
    ['Bc4+', 'Kh8'],
    ['Bg7#', null],
  ] as const
  const original = getChess(fen)
  const whiteMoves = line.map(([san, blackReply]) => {
    const move = original.moves({ verbose: true }).find((candidate) => candidate.san === san)
    assert.ok(move, san)
    original.move(move)
    if (blackReply !== null) original.move(blackReply)
    return move
  })
  for (const transform of SQUARE_TRANSFORMS) {
    const chess = getChess(transformFen(fen, transform))
    for (const [index, [, blackReply]] of line.entries()) {
      const originalMove = whiteMoves[index]!
      const transformedMove = chess
        .moves({ verbose: true })
        .find(
          (candidate) =>
            candidate.from === transformSquare(originalMove.from, transform) &&
            candidate.to === transformSquare(originalMove.to, transform),
        )
      assert.ok(transformedMove, `${index + 1} ${transform.name}`)
      const score = scoreTwoBishopsWhiteMove(chess.fen(), transformedMove.san)
      assert.equal(score.ruleR4Applies, true, `${index + 1} ${transform.name}`)
      assert.equal(score.ruleR4Penalty, 0, `${index + 1} ${transform.name}`)
      chess.move(transformedMove)
      if (blackReply !== null) {
        const replies = chess.moves({ verbose: true })
        assert.equal(replies.length, 1, `${index + 1} ${transform.name}`)
        chess.move(replies[0]!)
      }
    }
    assert.equal(chess.isCheckmate(), true, transform.name)
  }
})

test('rule r4 selects Be7 from the b5 king and c5-c6 bishop pattern symmetrically', () => {
  const fen = '8/2k5/2B5/1KB5/8/8/8/8 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const chess = getChess(transformedFen)
    const move = chess.moves({ verbose: true }).find(
      (candidate) => candidate.from === transformSquare('c5', transform) &&
        candidate.to === transformSquare('e7', transform),
    )!.san
    const score = scoreTwoBishopsWhiteMove(transformedFen, move)
    assert.equal(score.ruleR4Applies, true, transform.name)
    assert.equal(score.ruleR4Penalty, 0, transform.name)
    assert.deepEqual(getIdealTwoBishopsWhiteMoves(transformedFen), [move], transform.name)
    chess.move(move)
    assert.deepEqual(chess.moves({ verbose: true }).map(({ to }) => to).sort(),
      (['b8', 'c8'] as const).map((square) => transformSquare(square, transform)).sort(),
      transform.name)
  }
})

test('rule r4 continues Be7 with Kb6 after either Black reply symmetrically', () => {
  const startingFen = '8/2k5/2B5/1KB5/8/8/8/8 w - - 0 1'
  for (const blackReply of ['Kb8', 'Kc8']) {
    const original = getChess(startingFen)
    original.move('Be7')
    original.move(blackReply)
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(original.fen(), transform)
      const chess = getChess(fen)
      const move = chess.moves({ verbose: true }).find(
        (candidate) => candidate.from === transformSquare('b5', transform) &&
          candidate.to === transformSquare('b6', transform),
      )!.san
      const score = scoreTwoBishopsWhiteMove(fen, move)
      assert.equal(score.ruleR4Applies, true, `${blackReply} ${transform.name}`)
      assert.equal(score.ruleR4Penalty, 0, `${blackReply} ${transform.name}`)
      assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), [move],
        `${blackReply} ${transform.name}`)
      chess.move(move)
      assert.equal(chess.isStalemate(), false, transform.name)
    }
  }
})

test('rule r4 recognizes Bd5 and Be6 mating-pattern stages symmetrically', () => {
  const fen = '5B2/5B1k/5K2/8/8/8/8/8 w - - 0 1'
  const stages = [
    { from: 'f7', to: 'd5' },
    { from: 'd5', to: 'e6' },
  ] as const
  for (const transform of SQUARE_TRANSFORMS) {
    const chess = getChess(transformFen(fen, transform))
    for (const [index, stage] of stages.entries()) {
      const move = chess
        .moves({ verbose: true })
        .find(
          (candidate) =>
            candidate.from === transformSquare(stage.from, transform) &&
            candidate.to === transformSquare(stage.to, transform),
        )
      assert.ok(move, `${index + 1} ${transform.name}`)
      assert.deepEqual(
        analyzeTwoBishopsWhiteSelection(chess.fen()).idealWhiteMoves,
        [move.san],
        `${index + 1} ${transform.name}`,
      )
      const score = scoreTwoBishopsWhiteMove(chess.fen(), move.san)
      assert.equal(score.ruleR4Applies, true, `${index + 1} ${transform.name}`)
      assert.equal(score.ruleR4Penalty, 0, `${index + 1} ${transform.name}`)
      chess.move(move)
      const replies = chess.moves({ verbose: true })
      assert.equal(replies.length, 1, `${index + 1} ${transform.name}`)
      chess.move(replies[0]!)
    }
  }
})

test('rule r4 aligns the outer bishop before walking the king through the wall', () => {
  const fen = '8/7k/8/4BK2/4B3/8/8/8 w - - 0 1'
  const line = [
    { from: 'e4' as const, to: 'd5' as const, reply: 'Kh6' },
    { from: 'f5' as const, to: 'e4' as const, reply: null },
  ]
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedChess = getChess(transformFen(fen, transform))
    for (const [index, stage] of line.entries()) {
      const move = transformedChess
        .moves({ verbose: true })
        .find(
          (candidate) =>
            candidate.from === transformSquare(stage.from, transform) &&
            candidate.to === transformSquare(stage.to, transform),
        )
      assert.ok(move, `${index + 1} ${transform.name}`)
      assert.deepEqual(
        analyzeTwoBishopsWhiteSelection(transformedChess.fen()).idealWhiteMoves,
        [move.san],
        `${index + 1} ${transform.name}`,
      )
      const score = scoreTwoBishopsWhiteMove(transformedChess.fen(), move.san)
      assert.equal(score.ruleR4Applies, true, `${index + 1} ${transform.name}`)
      assert.equal(score.ruleR4Penalty, 0, `${index + 1} ${transform.name}`)
      transformedChess.move(move)
      if (stage.reply !== null) {
        const replies = transformedChess.moves({ verbose: true })
        assert.equal(replies.length, 1, `${index + 1} ${transform.name}`)
        transformedChess.move(replies[0]!)
      }
    }
  }
})

test('rule r4 forces Black from the edge into its associated corner', () => {
  const fen = '8/8/8/8/8/8/2BB1K1k/8 w - - 2 2'
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const expected = getChess(transformedFen)
      .moves({ verbose: true })
      .find(
        (candidate) =>
          candidate.from === transformSquare('c2', transform) &&
          candidate.to === transformSquare('f5', transform),
      )?.san
    assert.ok(expected, transform.name)
    assert.equal(getTwoBishopsPhaseLabel(transformedFen), '2/2', transform.name)
    assert.deepEqual(
      analyzeTwoBishopsWhiteSelection(transformedFen).idealWhiteMoves,
      [expected],
      transform.name,
    )
  }
})

test('rule r4 prepares h7 while preserving h6 with the king already on f7 symmetrically', () => {
  const fen = '4BB1k/5K2/8/8/8/8/8/8 w - - 0 1'
  const original = getChess(fen)
  const line = ['Ba4', 'Kh7', 'Bc2+', 'Kh8', 'Bg7#'].map((san) => original.move(san))
  for (const transform of SQUARE_TRANSFORMS) {
    const chess = getChess(transformFen(fen, transform))
    const alternative = (from: 'e8' | 'f8', to: 'a4' | 'd7' | 'e7') => chess.moves({ verbose: true }).find(
      (move) => move.from === transformSquare(from, transform) &&
        move.to === transformSquare(to, transform),
    )!.san
    const bd7 = scoreTwoBishopsWhiteMove(chess.fen(), alternative('e8', 'd7'))
    const ba4 = scoreTwoBishopsWhiteMove(chess.fen(), alternative('e8', 'a4'))
    assert.equal(bd7.ruleR4Penalty, 0, transform.name)
    assert.equal(ba4.ruleR4Penalty, 0, transform.name)
    assert.equal(scoreTwoBishopsWhiteMove(chess.fen(), alternative('f8', 'e7')).ruleR4Penalty,
      1, transform.name)
    for (const [index, originalMove] of line.entries()) {
      const move = chess.moves({ verbose: true }).find(
        (candidate) => candidate.from === transformSquare(originalMove.from, transform) &&
          candidate.to === transformSquare(originalMove.to, transform),
      )!.san
      if (chess.turn() === 'w') {
        const score = scoreTwoBishopsWhiteMove(chess.fen(), move)
        assert.equal(score.ruleR4Applies, true, `${index} ${transform.name}`)
        assert.equal(score.ruleR4Penalty, 0, `${index} ${transform.name}`)
        assert.deepEqual(getIdealTwoBishopsWhiteMoves(chess.fen()), [move], transform.name)
      } else {
        assert.equal(chess.moves().length, 1, transform.name)
      }
      chess.move(move)
      if (index < 4) assert.equal(chess.isAttacked(transformSquare('h6', transform), 'w'), true,
        transform.name)
    }
    assert.equal(chess.isCheckmate(), true, transform.name)
  }
})

test('rule r4 executes the sealed two-square corner sequence by destination', () => {
  const stages = [
    {
      fen: '4B3/5K1k/8/8/8/B7/8/8 w - - 2 2',
      from: 'a3' as const,
      to: 'c1' as const,
    },
    {
      fen: '4B2k/5K2/8/8/8/8/8/2B5 w - - 4 3',
      from: 'e8' as const,
      to: 'b5' as const,
    },
    {
      fen: '8/5K1k/8/1B6/8/8/8/2B5 w - - 6 4',
      from: 'b5' as const,
      to: 'd3' as const,
    },
  ] as const
  for (const stage of stages) {
    for (const transform of SQUARE_TRANSFORMS) {
      const transformedFen = transformFen(stage.fen, transform)
      const expected = getChess(transformedFen)
        .moves({ verbose: true })
        .find(
          (candidate) =>
            candidate.from === transformSquare(stage.from, transform) &&
            candidate.to === transformSquare(stage.to, transform),
        )?.san
      assert.ok(expected, `${stage.to} ${transform.name}`)
      assert.equal(
        scoreTwoBishopsWhiteMove(transformedFen, expected).ruleR4Penalty,
        0,
        `${stage.to} ${transform.name}`,
      )
      assert.deepEqual(
        analyzeTwoBishopsWhiteSelection(transformedFen).idealWhiteMoves,
        [expected],
        `${stage.to} ${transform.name}`,
      )
    }
  }
})

test('rule r4 preserves the third edge square before the mate-in-two sequence', () => {
  const stages = [
    {
      fen: '2B5/B7/8/8/8/8/5K2/7k w - - 0 1',
      from: 'c8' as const,
      to: 'd7' as const,
    },
    {
      fen: '8/B2B4/8/8/8/8/5K1k/8 w - - 2 2',
      from: 'a7' as const,
      to: 'b8' as const,
    },
    {
      fen: '1B6/3B4/8/8/8/8/5K2/7k w - - 4 3',
      from: 'd7' as const,
      to: 'c6' as const,
    },
  ] as const
  for (const stage of stages) {
    for (const transform of SQUARE_TRANSFORMS) {
      const transformedFen = transformFen(stage.fen, transform)
      const expected = getChess(transformedFen)
        .moves({ verbose: true })
        .find(
          (candidate) =>
            candidate.from === transformSquare(stage.from, transform) &&
            candidate.to === transformSquare(stage.to, transform),
        )?.san
      assert.ok(expected, `${stage.to} ${transform.name}`)
      assert.equal(
        scoreTwoBishopsWhiteMove(transformedFen, expected).ruleR4Penalty,
        0,
        `${stage.to} ${transform.name}`,
      )
      assert.deepEqual(
        analyzeTwoBishopsWhiteSelection(transformedFen).idealWhiteMoves,
        [expected],
        `${stage.to} ${transform.name}`,
      )
    }
  }
})

test('rule r4 prefers the move that forces mate next symmetrically', () => {
  const fen = '8/2B5/8/1B6/8/6K1/8/6k1 w - - 2 2'
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const expected = getChess(transformedFen)
      .moves({ verbose: true })
      .find(
        (candidate) =>
          candidate.from === transformSquare('c7', transform) &&
          candidate.to === transformSquare('b6', transform),
      )?.san
    assert.ok(expected, transform.name)
    assert.deepEqual(
      analyzeTwoBishopsWhiteSelection(transformedFen).idealWhiteMoves,
      [expected],
      transform.name,
    )
  }
})

test('Phase 2 requires the new White king square and four-square edge cage', () => {
  const canonical = '8/8/8/8/7k/4B3/4BK2/8 w - - 0 1'
  assert.equal(isTwoBishopsPhaseTwoPosition(canonical), true)
  assert.equal(
    isTwoBishopsPhaseTwoPosition('8/8/8/8/7k/4B3/4B3/4K3 w - - 0 1'),
    false,
  )
  assert.equal(
    isTwoBishopsPhaseTwoPosition('8/8/8/8/8/4B1k1/4BK2/8 w - - 0 1'),
    false,
  )
  for (const transform of SQUARE_TRANSFORMS) {
    assert.equal(
      isTwoBishopsPhaseTwoPosition(transformFen(canonical, transform)),
      true,
      transform.name,
    )
  }
})

test('rule r5 forms the two-edge cage with Bf3 symmetrically', () => {
  const fen = '8/8/8/8/4K3/4B3/8/3B1k2 w - - 8 5'
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const from = transformSquare('d1', transform)
    const to = transformSquare('f3', transform)
    const move = getChess(transformedFen)
      .moves({ verbose: true })
      .find((candidate) => candidate.from === from && candidate.to === to)?.san
    assert.ok(move, transform.name)
    assert.deepEqual(
      getIdealTwoBishopsWhiteMoves(transformedFen),
      [move],
      transform.name,
    )
    const score = scoreTwoBishopsWhiteMove(transformedFen, move)
    assert.equal(score.ruleR5BishopPenalty, 0, transform.name)
    assert.equal(score.ruleR5CagePenalty, 0, transform.name)
  }
})

test('rule r5 stays neutral before the two-edge cage exists', () => {
  const fen = '8/8/8/8/3K2k1/8/2BB4/8 w - - 2 2'
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const from = transformSquare('d4', transform)
    const to = transformSquare('e5', transform)
    const move = getChess(transformedFen)
      .moves({ verbose: true })
      .find((candidate) => candidate.from === from && candidate.to === to)?.san
    assert.ok(move, transform.name)
    const score = scoreTwoBishopsWhiteMove(transformedFen, move)
    assert.equal(score.ruleR5BishopPenalty, 1, transform.name)
  }
})

test('rule r5 prefers the Phase 2 orientation that encloses Black', () => {
  const fen = '8/8/5K2/8/7k/3B4/3B4/8 w - - 2 2'
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const from = transformSquare('d3', transform)
    const to = transformSquare('e2', transform)
    const move = getChess(transformedFen)
      .moves({ verbose: true })
      .find((candidate) => candidate.from === from && candidate.to === to)?.san
    assert.ok(move, transform.name)
    assert.deepEqual(
      getIdealTwoBishopsWhiteMoves(transformedFen),
      [move],
      transform.name,
    )
  }
})

test('rule r5 then walks the White king toward the in-line Phase 2 square', () => {
  for (const blackKing of ['e1', 'f1']) {
    const fen = `8/8/8/8/4K3/4BB2/8/${blackKing === 'e1' ? '4k3' : '5k2'} w - - 9 6`
    assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Kf4'], blackKing)
    assert.equal(scoreTwoBishopsWhiteMove(fen, 'Kf4').ruleR5KingDistance, 2)
    assert.equal(scoreTwoBishopsWhiteMove(fen, 'Kd4').ruleR5KingDistance, 10)
  }
})

test('rule r5 uses the r6 Phase 2 orientation when entering it', () => {
  const fen = '8/8/8/8/3K4/8/2BB4/5k2 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const expected = getChess(transformedFen)
      .moves({ verbose: true })
      .find(
        (candidate) =>
          candidate.from === transformSquare('c2', transform) &&
          candidate.to === transformSquare('d1', transform),
      )?.san
    assert.ok(expected, transform.name)
  }
})

test('rule r5 requires adjacent bishops when entering Phase 2 diagonals', () => {
  const fen = '8/4B3/2k5/8/8/1B1K4/8/8 w - - 22 12'
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const move = getChess(transformedFen)
      .moves({ verbose: true })
      .find(
        (candidate) =>
          candidate.from === transformSquare('b3', transform) &&
          candidate.to === transformSquare('a4', transform),
      )?.san
    assert.ok(move, transform.name)
    assert.equal(
      scoreTwoBishopsWhiteMove(transformedFen, move).ruleR5BishopPenalty,
      1,
      transform.name,
    )
  }
})

test('rule r5 requires the adjacent Phase 2 bishops to form a two-edge cage', () => {
  const fen = '8/8/8/8/7k/8/2BBK3/8 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const rejected = getChess(transformedFen)
      .moves({ verbose: true })
      .find(
        (candidate) =>
          candidate.from === transformSquare('c2', transform) &&
          candidate.to === transformSquare('d1', transform),
      )?.san
    assert.ok(rejected, transform.name)
    assert.equal(
      scoreTwoBishopsWhiteMove(transformedFen, rejected).ruleR5BishopPenalty,
      1,
      transform.name,
    )
  }
})

test('rule r6 measures Euclidean distance to the Phase 2 king square', () => {
  const steps = [
    {
      fen: '8/8/8/8/4K2k/4B3/4B3/8 w - - 0 1',
      preferred: 'Kd3',
      rejected: 'Kf3',
    },
    {
      fen: '8/8/8/8/8/3KB2k/4B3/8 w - - 0 1',
      preferred: 'Ke4',
      rejected: 'Kc4',
    },
    {
      fen: '8/8/8/8/7k/4B3/3KB3/8 w - - 0 1',
      preferred: 'Ke1',
      rejected: 'Kc2',
    },
    {
      fen: '8/8/8/8/8/4B1k1/4B3/4K3 w - - 2 2',
      preferred: 'Kf1',
      rejected: 'Kd2',
    },
    {
      fen: '8/8/8/8/8/4B2k/4B3/4K3 w - - 0 1',
      preferred: 'Kf2',
      rejected: 'Kd2',
    },
    {
      fen: '8/8/8/8/8/4B1k1/8/3BK3 w - - 0 1',
      preferred: 'Kf1',
      rejected: 'Be2',
    },
  ] as const
  for (const { fen, preferred, rejected } of steps) {
    assert.ok(
      compareTwoBishopsWhiteScores(
        scoreTwoBishopsWhiteMove(fen, preferred),
        scoreTwoBishopsWhiteMove(fen, rejected),
      ) < 0,
      `${preferred} over ${rejected}`,
    )
  }
})

test('rule r6 prefers progress along the allowed path to the Phase 2 king square', () => {
  const fen = '8/8/8/8/4K2k/4B3/4B3/8 w - - 2 2'
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const expected = getChess(transformedFen)
      .moves({ verbose: true })
      .find(
        (candidate) =>
          candidate.from === transformSquare('e4', transform) &&
          candidate.to === transformSquare('d3', transform),
      )?.san
    assert.ok(expected, transform.name)
    assert.deepEqual(
      analyzeTwoBishopsWhiteSelection(transformedFen).idealWhiteMoves,
      [expected],
      transform.name,
    )
  }
})

test('rule r6 does not freeze the current Black king attack map while planning its path', () => {
  const fen = '8/8/8/8/4K3/4B3/4B1k1/8 w - - 2 2'
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const expected = getChess(transformedFen)
      .moves({ verbose: true })
      .find(
        (candidate) =>
          candidate.from === transformSquare('e4', transform) &&
          candidate.to === transformSquare('d3', transform),
      )?.san
    assert.ok(expected, transform.name)
    assert.deepEqual(
      analyzeTwoBishopsWhiteSelection(transformedFen).idealWhiteMoves,
      [expected],
      transform.name,
    )
  }
})

test('rule r6 ignores Phase 2 squares and king proximity until both diagonals are occupied', () => {
  const fen = '8/5k2/8/4BB2/5K2/8/8/8 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const legalMoves = getChess(transformedFen).moves({ verbose: true })
    const kingMove = legalMoves.find(
      (move) =>
        move.from === transformSquare('f4', transform) &&
        move.to === transformSquare('e4', transform),
    )?.san
    const bishopMove = legalMoves.find(
      (move) =>
        move.from === transformSquare('e5', transform) &&
        move.to === transformSquare('d6', transform),
    )?.san
    assert.ok(kingMove, transform.name)
    assert.ok(bishopMove, transform.name)
    for (const score of [
      scoreTwoBishopsWhiteMove(transformedFen, kingMove),
      scoreTwoBishopsWhiteMove(transformedFen, bishopMove),
    ]) {
      assert.equal(score.ruleR6DiagonalPenalty, 1, transform.name)
      assert.equal(score.ruleR6SquarePenalty, 0, transform.name)
      assert.equal(score.ruleR6KingAreaPenalty, 0, transform.name)
      assert.equal(score.ruleR6KingDistance, 0, transform.name)
    }
  }
})

test('rule r6 stays neutral on mismatched Phase 2 diagonals', () => {
  const fen = '8/2k5/8/1B6/4K3/8/5B2/8 w - - 2 2'
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const move = getChess(transformedFen)
      .moves({ verbose: true })
      .find(
        (candidate) =>
          candidate.from === transformSquare('f2', transform) &&
          candidate.to === transformSquare('h4', transform),
      )?.san
    assert.ok(move, transform.name)
    assert.equal(
      scoreTwoBishopsWhiteMove(transformedFen, move).ruleR6DiagonalPenalty,
      1,
      transform.name,
    )
  }
})

test('rule r6 rejects a nominal Phase 2 wall that Black can escape', () => {
  const fen = '8/4k3/8/8/4KBB1/8/8/8 w - - 8 5'
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const move = getChess(transformedFen)
      .moves({ verbose: true })
      .find(
        (candidate) =>
          candidate.from === transformSquare('f4', transform) &&
          candidate.to === transformSquare('g5', transform),
      )?.san
    assert.ok(move, transform.name)
    assert.equal(
      scoreTwoBishopsWhiteMove(transformedFen, move).ruleR6DiagonalPenalty,
      1,
      transform.name,
    )
  }
})

test('rule r6 rejects Bd1 when Kh5 can enter the screened Phase 2 diagonal', () => {
  const fen = '8/8/8/8/7k/5K2/2BB4/8 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const chess = getChess(transformedFen)
    const move = chess.moves({ verbose: true }).find(
      (candidate) => candidate.from === transformSquare('c2', transform) &&
        candidate.to === transformSquare('d1', transform),
    )!.san
    const score = scoreTwoBishopsWhiteMove(transformedFen, move)
    assert.equal(score.ruleR6DiagonalPenalty, 1, transform.name)
    assert.equal(score.ruleR6SquarePenalty, 0, transform.name)
    assert.equal(score.ruleR6KingPathDistance, 0, transform.name)
    chess.move(move)
    assert.ok(chess.moves({ verbose: true }).some(
      (reply) => reply.to === transformSquare('h5', transform)), transform.name)
  }
})

test('rule r6 allows Bh5 when Black is equidistant from the bishop and White king symmetrically', () => {
  const fen = '8/8/6B1/8/8/5K1k/3B4/8 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const chess = getChess(transformedFen)
    const move = chess.moves({ verbose: true }).find(
      (candidate) => candidate.from === transformSquare('g6', transform) &&
        candidate.to === transformSquare('h5', transform),
    )!.san
    const score = scoreTwoBishopsWhiteMove(transformedFen, move)
    assert.equal(score.ruleR6DiagonalPenalty, 0, transform.name)
    assert.equal(score.ruleR6SquarePenalty, 1, transform.name)
    assert.equal(score.ruleR6KingPathDistance, 1, transform.name)
    chess.move(move)
    // Black cannot enter d1–h5 immediately, but Kf3 still screens that wall.
    assert.ok(chess.moves({ verbose: true }).every((reply) =>
      !(['d1', 'e2', 'f3', 'g4', 'h5'] as const)
        .map((square) => transformSquare(square, transform)).includes(reply.to),
    ), transform.name)
  }
})

test('rule r6 prefers entering the Phase 2 diagonals with Be6', () => {
  const fen = '8/3K1B2/5B1k/8/8/8/8/8 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const expected = getChess(transformedFen)
      .moves({ verbose: true })
      .find(
        (candidate) =>
          candidate.from === transformSquare('f7', transform) &&
          candidate.to === transformSquare('e6', transform),
      )?.san
    assert.ok(expected, transform.name)
    assert.deepEqual(
      analyzeTwoBishopsWhiteSelection(transformedFen).idealWhiteMoves,
      [expected],
      transform.name,
    )
  }
})

test('rule r6 treats e1 as outside Black area symmetrically', () => {
  const fen = '8/8/8/8/8/8/3BK1k1/3B4 w - - 2 2'
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const from = transformSquare('e2', transform)
    const to = transformSquare('e1', transform)
    const move = getChess(transformedFen)
      .moves({ verbose: true })
      .find((candidate) => candidate.from === from && candidate.to === to)?.san
    assert.ok(move, transform.name)
    const score = scoreTwoBishopsWhiteMove(transformedFen, move)
    assert.equal(score.ruleR6KingAreaPenalty, 0, transform.name)
  }
})

test('rule r6 always treats its Phase 2 king square as outside Black area', () => {
  const fen = '8/8/8/8/7k/4KB2/3B4/8 w - - 6 4'
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const from = transformSquare('e3', transform)
    const to = transformSquare('f2', transform)
    const move = getChess(transformedFen)
      .moves({ verbose: true })
      .find((candidate) => candidate.from === from && candidate.to === to)?.san
    assert.ok(move, transform.name)
    const score = scoreTwoBishopsWhiteMove(transformedFen, move)
    assert.equal(score.ruleR6KingAreaPenalty, 0, transform.name)
    assert.equal(score.ruleR6KingDistance, 0, transform.name)
  }
})

test('rule r6 prefers the bishop Phase 2 squares before king proximity', () => {
  const fen = '8/8/8/8/8/3K4/3B2k1/3B4 w - - 2 2'
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const move = getChess(transformedFen)
      .moves({ verbose: true })
      .find(
        (candidate) =>
          candidate.from === transformSquare('d2', transform) &&
          candidate.to === transformSquare('e3', transform),
      )?.san
    assert.ok(move, transform.name)
    assert.deepEqual(
      getIdealTwoBishopsWhiteMoves(transformedFen),
      [move],
      transform.name,
    )
  }
})

test('rule r6 rejects an uncontrolled tail even when Black cannot immediately reach it', () => {
  const fen = '8/8/8/8/8/8/3BK1k1/3B4 w - - 2 2'
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const moves = getChess(transformedFen).moves({ verbose: true })
    const bishopMove = moves.find((move) =>
      move.from === transformSquare('d2', transform) &&
      move.to === transformSquare('e3', transform),
    )!.san
    const kingMove = moves.find((move) =>
      move.from === transformSquare('e2', transform) &&
      move.to === transformSquare('e1', transform),
    )!.san
    assert.equal(scoreTwoBishopsWhiteMove(transformedFen, bishopMove).ruleR6DiagonalPenalty,
      1, transform.name)
    assert.equal(scoreTwoBishopsWhiteMove(transformedFen, kingMove).ruleR6DiagonalPenalty,
      0, transform.name)
    const screened = getChess(transformedFen)
    screened.move(bishopMove)
    assert.equal(screened.isAttacked(transformSquare('f3', transform), 'w'), true,
      transform.name)
    assert.equal(screened.isAttacked(transformSquare('g4', transform), 'w'), false,
      transform.name)
    assert.deepEqual(getIdealTwoBishopsWhiteMoves(transformedFen), [kingMove], transform.name)
  }
})

test('rule r6 treats d1 as an outer-bishop Phase 2 square symmetrically', () => {
  const fen = '8/8/8/8/8/4B1k1/4B3/4K3 w - - 2 2'
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const from = transformSquare('e2', transform)
    const to = transformSquare('d1', transform)
    const move = getChess(transformedFen)
      .moves({ verbose: true })
      .find((candidate) => candidate.from === from && candidate.to === to)?.san
    assert.ok(move, transform.name)
    assert.equal(
      scoreTwoBishopsWhiteMove(transformedFen, move).ruleR6SquarePenalty,
      0,
      transform.name,
    )
  }
})

test("rule r3 prefers White's king out of every corner", () => {
  const fen = 'K7/B7/B1k5/8/8/8/8/8 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const expected = getChess(transformedFen)
      .moves({ verbose: true })
      .find(
        (candidate) =>
          candidate.from === transformSquare('a8', transform) &&
          candidate.to === transformSquare('b8', transform),
      )?.san
    assert.ok(expected, transform.name)
    assert.deepEqual(
      analyzeTwoBishopsWhiteSelection(transformedFen).idealWhiteMoves,
      [expected],
      transform.name,
    )
  }
})

test('rule r3 compares king corners, adjacent bishops, then bishop corners symmetrically', () => {
  const fen = '7B/8/8/7k/8/8/B7/K7 w - - 0 1'
  const rule = twoBishopsWhiteRules.find(({ id }) => id === 'rule r3')!
  const compare = rule.compare
  assert.ok(compare)
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const scoreMove = (from: 'a1' | 'a2' | 'h8', to: 'b1' | 'b3' | 'g7' | 'b2') => {
      const move = getChess(transformedFen).moves({ verbose: true }).find(
        (candidate) => candidate.from === transformSquare(from, transform) &&
          candidate.to === transformSquare(to, transform),
      )
      assert.ok(move, `${from}${to} ${transform.name}`)
      return scoreTwoBishopsWhiteMove(transformedFen, move.san)
    }
    const leaveKingCorner = scoreMove('a1', 'b1')
    const clearKingNeighbor = scoreMove('a2', 'b3')
    const leaveBishopCorner = scoreMove('h8', 'g7')
    const stayBesideKing = scoreMove('h8', 'b2')
    const penalties = (score: typeof leaveKingCorner) => [
      score.ruleR3CornerPenalty,
      score.ruleR3AdjacentBishopPenalty,
      score.ruleR3BishopCornerPenalty,
    ]
    assert.deepEqual(penalties(leaveKingCorner), [0, 0, 1], transform.name)
    assert.deepEqual(penalties(clearKingNeighbor), [1, 0, 1], transform.name)
    assert.deepEqual(penalties(leaveBishopCorner), [1, 1, 0], transform.name)
    assert.deepEqual(penalties(stayBesideKing), [1, 2, 0], transform.name)
    assert.ok(compare(leaveKingCorner, leaveBishopCorner) < 0, transform.name)
    assert.ok(compare(clearKingNeighbor, leaveBishopCorner) < 0, transform.name)
    assert.ok(compare(leaveBishopCorner, stayBesideKing) < 0, transform.name)

    // Leaving the bishop on an edge is allowed; only the four corners count.
    const edgeMove = getChess(transformedFen).moves({ verbose: true }).find(
      (candidate) => candidate.from === transformSquare('a2', transform) &&
        candidate.to === transformSquare('b1', transform),
    )!
    const remainInBishopCorner = scoreTwoBishopsWhiteMove(transformedFen, edgeMove.san)
    assert.deepEqual(penalties(remainInBishopCorner), [1, 1, 1], transform.name)
    assert.ok(compare(leaveBishopCorner, remainInBishopCorner) < 0, transform.name)
  }
})

test('the second former stalemate start mates before the draw limit', () => {
  const fen = '4B2B/8/5K1k/8/8/8/8/8 w - - 0 1'
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Bg7+'])
  // Follow every selected White move and every legal Black reply, including
  // the draw clock. A depth bound catches loops as well as a slower finish.
  const proved = new Map<string, number>()
  const maximumMatePlies = (position: string, remaining: number): number => {
    const key = position.split(' ').slice(0, 4).join(' ')
    const cached = proved.get(key)
    if (cached !== undefined) {
      // Reusing a structural proof still requires enough moves on this path.
      assert.ok(cached <= remaining, position)
      return cached
    }
    const chess = getChess(position)
    if (chess.isCheckmate()) return 0
    assert.equal(chess.isDraw(), false, position)
    assert.ok(remaining > 0, position)
    const moves = chess.turn() === 'w'
      ? getIdealTwoBishopsWhiteMoves(position)
      : chess.moves()
    assert.ok(moves.length > 0, position)
    const plies = 1 + Math.max(...moves.map((move) => {
      const next = getChess(position)
      next.move(move)
      return maximumMatePlies(next.fen(), remaining - 1)
    }))
    proved.set(key, plies)
    return plies
  }
  assert.ok(maximumMatePlies(fen, 100) <= 100)
})

test("rule r1 associates each Phase 2 king square with Black's actual corner", () => {
  const correctFen = '7k/5K2/8/8/8/8/B7/1B6 w - - 0 1'
  const wrongCornerFen = '7k/2K5/8/8/8/8/B7/1B6 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedCorrectFen = transformFen(correctFen, transform)
    const transformedWrongFen = transformFen(wrongCornerFen, transform)
    const correctMove = getChess(transformedCorrectFen)
      .moves({ verbose: true })
      .find(
        (candidate) =>
          candidate.from === transformSquare('b1', transform) &&
          candidate.to === transformSquare('c2', transform),
      )?.san
    const wrongMove = getChess(transformedWrongFen)
      .moves({ verbose: true })
      .find(
        (candidate) =>
          candidate.from === transformSquare('b1', transform) &&
          candidate.to === transformSquare('c2', transform),
      )?.san
    assert.ok(correctMove, transform.name)
    assert.ok(wrongMove, transform.name)
    assert.equal(
      scoreTwoBishopsWhiteMove(transformedCorrectFen, correctMove)
        .ruleR1KingSquarePenalty,
      0,
      transform.name,
    )
    assert.equal(
      scoreTwoBishopsWhiteMove(transformedWrongFen, wrongMove)
        .ruleR1KingSquarePenalty,
      1,
      transform.name,
    )
  }
})

test('rule r10 recognizes adjacent walls and its four-diagonal floor', () => {
  assert.deepEqual(getAdjacentDiagonalWallTargetCorners(['d1', 'd2'], 'h1'), [
    'h1',
  ])
  assert.deepEqual(getAdjacentDiagonalWallTargetCorners(['f1', 'h2'], 'h1'), [])
  assert.deepEqual(getAdjacentDiagonalWallTargetCorners(['d4', 'f4'], 'h1'), [])
})

test('rule r10 shrinks a wall that only appeared to be at its floor', () => {
  const fen = '6k1/8/8/8/7K/8/3BB3/8 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const from = transformSquare('e2', transform)
    const to = transformSquare('d3', transform)
    const move = getChess(transformedFen)
      .moves({ verbose: true })
      .find((candidate) => candidate.from === from && candidate.to === to)?.san
    const rejected = getChess(transformedFen)
      .moves({ verbose: true })
      .find(
        (candidate) =>
          candidate.from === transformSquare('e2', transform) &&
          candidate.to === transformSquare('g4', transform),
      )?.san
    assert.ok(move, transform.name)
    assert.ok(rejected, transform.name)
    assert.ok(
      scoreTwoBishopsWhiteMove(transformedFen, move).ruleR10DiagonalCount <
        scoreTwoBishopsWhiteMove(transformedFen, rejected)
          .ruleR10DiagonalCount,
      transform.name,
    )
  }
})

test('rule r10 makes Be3 uniquely best when White finishes on the boundary', () => {
  assert.deepEqual(
    getIdealTwoBishopsWhiteMoves('8/8/8/8/5K2/8/5Bk1/3B4 w - - 0 1'),
    ['Be3'],
  )
})

test('rule r10 recognizes a checking wall that forces Black inside', () => {
  const score = scoreTwoBishopsWhiteMove(
    '8/8/8/3k4/8/4K3/1BB5/8 w - - 16 9',
    'Bb3+',
  )
  assert.equal(score.ruleR10TargetPenalty, 0)
  assert.equal(score.ruleR10DiagonalCount, 6)
})

test('r9 accomplishes Ke5 opposition ahead of exempt Bh3 despite its better r10 target', () => {
  const fen = '8/2BB4/8/3K2k1/8/8/8/8 w - - 0 1'
  const rule = twoBishopsWhiteRules.find(({ id }) => id === 'rule r10')!
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const chess = getChess(transformedFen)
    const move = chess
      .moves({ verbose: true })
      .find(
        (candidate) =>
          candidate.from === transformSquare('c7', transform) &&
          candidate.to === transformSquare('d8', transform),
      )?.san
    assert.ok(move, transform.name)
    const score = scoreTwoBishopsWhiteMove(transformedFen, move)
    assert.equal(score.ruleR10TargetPenalty, 0, transform.name)
    assert.equal(score.ruleR10DiagonalCount, 10, transform.name)
    assert.deepEqual(score.ruleR10TargetSquares, [transformSquare('d8', transform)], transform.name)
    const closerTargetMove = chess.moves({ verbose: true }).find(
      (candidate) =>
        candidate.from === transformSquare('d5', transform) &&
        candidate.to === transformSquare('e4', transform),
    )?.san
    assert.ok(closerTargetMove, transform.name)
    const screenedMove = chess.moves({ verbose: true }).find(
      (candidate) => candidate.from === transformSquare('d5', transform) &&
        candidate.to === transformSquare('e5', transform),
    )!.san
    const screened = scoreTwoBishopsWhiteMove(transformedFen, screenedMove)
    const intact = scoreTwoBishopsWhiteMove(transformedFen, closerTargetMove)
    // Ke5 may screen the b8–h2 outer wall; it retains five diagonals.
    assert.equal(screened.ruleR10DiagonalCount, 5, transform.name)
    assert.equal(intact.ruleR10DiagonalCount, 5, transform.name)
    assert.equal(intact.ruleR10KingDistance, 1, transform.name)
    assert.equal(screened.ruleR10KingDistance, 99, transform.name)
    assert.ok(compareScoresByRules(intact, screened, [rule]) < 0, transform.name)
    assert.deepEqual(screened.ruleR10TargetSquares, [], transform.name)
    assert.deepEqual(screened.ruleR9TargetSquares, [transformSquare('e5', transform)], transform.name)
    assert.equal(screened.ruleR9Penalty, 0, transform.name)
    assert.equal(intact.ruleR9Penalty, 1, transform.name)
    assert.equal(twoBishopsWhiteRules.find((candidate) =>
      compareScoresByRules(screened, intact, [candidate]) !== 0)?.id, 'rule r9', transform.name)
    const screenedPosition = getChess(transformedFen)
    screenedPosition.move(screenedMove)
    assert.equal(screenedPosition.isAttacked(transformSquare('h2', transform), 'w'),
      false, transform.name)
    const intactPosition = getChess(transformedFen)
    intactPosition.move(closerTargetMove)
    assert.equal(intactPosition.isAttacked(transformSquare('h2', transform), 'w'),
      true, transform.name)
    const bishopMove = chess.moves({ verbose: true }).find(
      (candidate) => candidate.from === transformSquare('d7', transform) &&
        candidate.to === transformSquare('h3', transform),
    )!.san
    const bishopScore = scoreTwoBishopsWhiteMove(transformedFen, bishopMove)
    assert.equal(bishopScore.ruleR9Applies, false, transform.name)
    assert.equal(bishopScore.ruleR10DiagonalCount, 5, transform.name)
    assert.deepEqual(bishopScore.ruleR10TargetSquares, [transformSquare('f4', transform)], transform.name)
    assert.ok(compareScoresByRules(bishopScore, screened, [rule]) < 0, transform.name)
    assert.deepEqual(
      getIdealTwoBishopsWhiteMoves(transformedFen),
      [screenedMove],
      transform.name,
    )
    chess.move(move)
    // Kf4 crosses to the wider side of the wall despite White's check.
    const escape = chess.moves({ verbose: true }).find(
      (reply) => reply.to === transformSquare('f4', transform),
    )
    assert.ok(escape, transform.name)
  }
})

test('r10 preserves the screened Kd4 wall but prefers Kf4 toward an inside-wall target', () => {
  const fen = '8/8/8/7k/8/2B1K3/2B5/8 w - - 2 2'
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const chess = getChess(transformedFen)
    const moves = chess.moves({ verbose: true })
    const move = (from: 'c2' | 'c3' | 'e3', to: 'd2' | 'd4' | 'e4' | 'f4') => moves.find(
      (candidate) => candidate.from === transformSquare(from, transform) &&
        candidate.to === transformSquare(to, transform),
    )!.san
    const bishopMove = move('c3', 'd2')
    const bishop = scoreTwoBishopsWhiteMove(transformedFen, bishopMove)
    const king = scoreTwoBishopsWhiteMove(transformedFen, move('e3', 'd4'))
    const intactMove = move('c2', 'e4')
    const intact = scoreTwoBishopsWhiteMove(transformedFen, intactMove)
    assert.equal(bishop.ruleR10DiagonalCount, 10, transform.name)
    // Kd4 may screen outer a1–h8 and has no unscreened closest target.
    assert.equal(king.ruleR10DiagonalCount, 6, transform.name)
    assert.deepEqual(king.ruleR10TargetSquares, [], transform.name)
    assert.ok(compareScoresByRules(king, bishop, twoBishopsWhiteRules.filter(r => r.id === 'rule r8' || r.id === 'rule r10')) < 0, transform.name)
    assert.equal(intact.ruleR10DiagonalCount, 6, transform.name)
    assert.ok(compareScoresByRules(king, intact, twoBishopsWhiteRules.filter(r => r.id === 'rule r8' || r.id === 'rule r10')) > 0, transform.name)
    assert.ok(compareTwoBishopsWhiteScores(king, intact) > 0, transform.name)
    const approachMove = move('e3', 'f4')
    const approach = scoreTwoBishopsWhiteMove(transformedFen, approachMove)
    assert.equal(approach.ruleR25KingDistance, 5, transform.name)
    assert.equal(intact.ruleR25KingDistance, 13, transform.name)
    assert.ok(compareTwoBishopsWhiteScores(king, approach) > 0, transform.name)
    assert.deepEqual(getIdealTwoBishopsWhiteMoves(transformedFen), [approachMove],
      transform.name)
    const screenedPosition = getChess(transformedFen)
    screenedPosition.move(move('e3', 'd4'))
    assert.equal(screenedPosition.isAttacked(transformSquare('h8', transform), 'w'),
      false, transform.name)
    chess.move(bishopMove)
    assert.ok(chess.moves({ verbose: true }).some(
      (reply) => reply.to === transformSquare('h6', transform)), transform.name)
  }
})

test('r10 requires an unreachable inner wall and permits the Kc5 outer screen symmetrically', () => {
  const fen = '8/8/BB6/8/1K6/8/8/3k4 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const chess = getChess(transformedFen)
    const moves = chess.moves({ verbose: true })
    const move = (from: 'a6' | 'b6' | 'b4', to: 'a5' | 'c3' | 'c4' | 'c5') => moves.find(
      (candidate) => candidate.from === transformSquare(from, transform) &&
        candidate.to === transformSquare(to, transform),
    )!.san
    const bishop = move('b6', 'a5')
    const king = move('b4', 'c3')
    assert.equal(scoreTwoBishopsWhiteMove(transformedFen, bishop).ruleR10DiagonalCount,
      99, transform.name)
    assert.equal(scoreTwoBishopsWhiteMove(transformedFen, king).ruleR10DiagonalCount,
      5, transform.name)
    chess.move(bishop)
    assert.ok(chess.moves({ verbose: true }).some(
      (reply) => reply.to === transformSquare('d2', transform)), transform.name)
    assert.ok(compareTwoBishopsWhiteScores(
      scoreTwoBishopsWhiteMove(transformedFen, king),
      scoreTwoBishopsWhiteMove(transformedFen, bishop),
    ) < 0, transform.name)
    // Kc5 may screen outer b6–g1; the inner wall remains clear.
    const screenedMove = move('b4', 'c5')
    const screened = scoreTwoBishopsWhiteMove(transformedFen, screenedMove)
    assert.equal(screened.ruleR10DiagonalCount, 5, transform.name)
    assert.equal(screened.ruleR10TargetPenalty, 1, transform.name)
    assert.deepEqual(screened.ruleR10TargetSquares, [], transform.name)
    assert.equal(screened.ruleR10KingDistance, 99, transform.name)
    const screenedPosition = getChess(transformedFen)
    screenedPosition.move(screenedMove)
    assert.equal(screenedPosition.isAttacked(transformSquare('g1', transform), 'w'),
      false, transform.name)
    const preferredMove = move('a6', 'c4')
    assert.equal(scoreTwoBishopsWhiteMove(transformedFen, preferredMove).ruleR10DiagonalCount,
      5, transform.name)
    assert.deepEqual(getIdealTwoBishopsWhiteMoves(transformedFen), [king], transform.name)
  }
})

test('rule r10 retains enclosure credit when White screens only the outer wall', () => {
  const fen = '8/8/8/8/5K2/8/3B4/3B3k w - - 0 1'
  const rule = twoBishopsWhiteRules.find(({ id }) => id === 'rule r10')!
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const moves = getChess(transformedFen).moves({ verbose: true })
    const moveTo = (target: 'e3' | 'f5') => moves.find(
      (candidate) =>
        candidate.from === transformSquare('f4', transform) &&
        candidate.to === transformSquare(target, transform),
    )?.san
    const screenedMove = moveTo('e3')
    const intactMove = moveTo('f5')
    assert.ok(screenedMove, transform.name)
    assert.ok(intactMove, transform.name)
    const screened = scoreTwoBishopsWhiteMove(transformedFen, screenedMove)
    const intact = scoreTwoBishopsWhiteMove(transformedFen, intactMove)
    // Outer screening alone does not change the four-diagonal enclosure.
    assert.equal(screened.ruleR10TargetPenalty, 0, transform.name)
    assert.equal(intact.ruleR10TargetPenalty, 0, transform.name)
    assert.equal(screened.ruleR10DiagonalCount, 4, transform.name)
    assert.equal(intact.ruleR10DiagonalCount, 4, transform.name)
    assert.equal(compareScoresByRules(intact, screened, [rule]), 0, transform.name)
  }
})

test('rule r10 rejects Bf3 when Kc4 escapes to the smaller side symmetrically', () => {
  const fen = '8/8/8/3k4/8/8/4B3/2K3B1 w - - 20 11'
  const rule = twoBishopsWhiteRules.find(({ id }) => id === 'rule r10')!
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const chess = getChess(transformedFen)
    const moves = chess.moves({ verbose: true })
    const move = (from: 'e2' | 'c1', to: 'f3' | 'c2' | 'd2') => moves.find(
      (candidate) => candidate.from === transformSquare(from, transform) &&
        candidate.to === transformSquare(to, transform),
    )!.san
    const bishopMove = move('e2', 'f3')
    const bishop = scoreTwoBishopsWhiteMove(transformedFen, bishopMove)
    const king = scoreTwoBishopsWhiteMove(transformedFen, move('c1', 'c2'))
    assert.equal(bishop.ruleR10DiagonalCount, 99, transform.name)
    assert.equal(king.ruleR10DiagonalCount, 8, transform.name)
    assert.ok(compareScoresByRules(king, bishop, [rule]) < 0, transform.name)
    const diagonalKing = scoreTwoBishopsWhiteMove(transformedFen, move('c1', 'd2'))
    assert.deepEqual(king.ruleR10TargetSquares, [transformSquare('c4', transform)], transform.name)
    assert.deepEqual(diagonalKing.ruleR10TargetSquares, king.ruleR10TargetSquares, transform.name)
    assert.equal(king.ruleR10KingDistance, 2, transform.name)
    assert.equal(diagonalKing.ruleR10KingDistance, 2, transform.name)
    assert.ok(compareScoresByRules(king, diagonalKing, [rule]) < 0, transform.name)
    assert.deepEqual(getIdealTwoBishopsWhiteMoves(transformedFen),
      [move('c1', 'c2')], transform.name)
    chess.move(bishopMove)
    assert.ok(chess.moves({ verbose: true }).some(
      (reply) => reply.to === transformSquare('c4', transform)), transform.name)
  }
})

test('walls require both diagonals to have length at least four', () => {
  assert.deepEqual(getAdjacentDiagonalWallTargetCorners(['h5', 'h6'], 'e7'), [
    'a8',
  ])
})

test('rule r10 distinguishes a wall from a result with no wall', () => {
  const fen = 'K7/B7/B7/3k4/8/8/8/8 w - - 2 2'
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const expected = getChess(transformedFen)
      .moves({ verbose: true })
      .find(
        (candidate) =>
          candidate.from === transformSquare('a7', transform) &&
          candidate.to === transformSquare('b6', transform),
      )?.san
    const rejected = getChess(transformedFen)
      .moves({ verbose: true })
      .find(
        (candidate) =>
          candidate.from === transformSquare('a6', transform) &&
          candidate.to === transformSquare('c8', transform),
      )?.san
    assert.ok(expected, transform.name)
    assert.ok(rejected, transform.name)
    assert.ok(
      scoreTwoBishopsWhiteMove(transformedFen, expected)
        .ruleR10DiagonalCount <
        scoreTwoBishopsWhiteMove(transformedFen, rejected)
          .ruleR10DiagonalCount,
      transform.name,
    )
  }
})

test('rule r10 scores only the outer bishop edge and has no Phase 2 exemption or distance requirement', () => {
  const r10 = twoBishopsWhiteRules.find(({ id }) => id === 'rule r10')!
  assert.equal(
    scoreTwoBishopsWhiteMove('8/8/8/8/4K3/6k1/3B4/3B4 w - - 12 7', 'Kd4')
      .ruleR10OuterBishopPenalty,
    0,
  )
  const fen = 'K7/8/8/5B2/3B4/8/8/7k w - - 0 1'
  const interior = scoreTwoBishopsWhiteMove(fen, 'Bg6')
  const edge = scoreTwoBishopsWhiteMove(fen, 'Bb1')
  // Both moves relocate the inner bishop. Outer Bd4 stays off h1's edges,
  // so r10 does not distinguish them.
  assert.equal(interior.ruleR10OuterBishopPenalty, 0)
  assert.equal(edge.ruleR10OuterBishopPenalty, 0)
  assert.equal(compareScoresByRules(interior, edge, [r10]), 0)

  const phaseTwoInnerFen = '8/8/8/8/3K4/8/2BBk3/8 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(phaseTwoInnerFen, transform)
    const move = getChess(transformedFen)
      .moves({ verbose: true })
      .find(
        (candidate) =>
          candidate.from === transformSquare('d2', transform) &&
          candidate.to === transformSquare('h6', transform),
      )?.san
    assert.ok(move, transform.name)
    // Outer Bc2 is off h1's edges even though it is only two king steps
    // from Black on e2. Inner Bh6 does not affect the edge preference.
    assert.equal(
      scoreTwoBishopsWhiteMove(transformedFen, move).ruleR10OuterBishopPenalty,
      0,
      transform.name,
    )
  }

  const cases = [
    {
      fen: '8/8/8/4K3/BB6/8/8/7k w - - 0 1',
      move: 'Kd5',
      penalty: 0,
    },
    {
      fen: '8/6BB/8/4K3/8/8/8/7k w - - 0 1',
      move: 'Kd5',
      // Inner Bh7 is on h1's edge; outer Bg7 is distant and off that edge.
      penalty: 0,
    },
    {
      fen: '8/8/8/8/7k/4B3/4BK2/8 w - - 0 1',
      move: 'Bc1',
      // Outer Bc1 remains on its Phase 2 diagonal and five steps away,
      // but h1's first-rank edge is no longer exempt.
      penalty: 1,
    },
  ] as const
  for (const { fen: caseFen, move, penalty } of cases) {
    const originalMove = getChess(caseFen)
      .moves({ verbose: true })
      .find((candidate) => candidate.san === move)!
    for (const transform of SQUARE_TRANSFORMS) {
      const transformedFen = transformFen(caseFen, transform)
      const transformedMove = getChess(transformedFen)
        .moves({ verbose: true })
        .find(
          (candidate) =>
            candidate.from === transformSquare(originalMove.from, transform) &&
            candidate.to === transformSquare(originalMove.to, transform),
        )?.san
      assert.ok(transformedMove, transform.name)
      assert.equal(
        scoreTwoBishopsWhiteMove(transformedFen, transformedMove)
          .ruleR10OuterBishopPenalty,
        penalty,
        transform.name,
      )
    }
  }
})

test('rule r10 retains the smaller resulting wall when a bishop move creates an outer screen', () => {
  const fen = '8/8/8/8/4K3/6k1/3B4/3B4 w - - 0 1'
  const unchangedWall = scoreTwoBishopsWhiteMove(fen, 'Be3')
  const changedWall = scoreTwoBishopsWhiteMove(fen, 'Bc2')
  assert.equal(unchangedWall.ruleR10TargetPenalty, 0)
  assert.equal(unchangedWall.ruleR10DiagonalCount, 4)
  assert.deepEqual(unchangedWall.ruleR10TargetSquares, ['f4'])
  assert.equal(unchangedWall.ruleR10KingDistance, 1)
  // Bc2 leaves the stationary king on outer c2–h7, retaining five diagonals.
  assert.equal(changedWall.ruleR10TargetPenalty, 0)
  assert.equal(changedWall.ruleR10DiagonalCount, 5)
  assert.deepEqual(changedWall.ruleR10TargetSquares, ['e4'])
  assert.equal(changedWall.ruleR10KingDistance, 1)
})

test('rule r10 excludes an occupied sole candidate without invalidating the wall', () => {
  const fen = '8/8/8/8/4K3/6k1/3B4/3B4 w - - 0 1'
  const occupied = scoreTwoBishopsWhiteMove(fen, 'Bf4+')
  assert.equal(occupied.ruleR10TargetPenalty, 1)
  assert.equal(occupied.ruleR10DiagonalCount, 4)
  assert.deepEqual(occupied.ruleR10TargetSquares, [])
  assert.equal(occupied.ruleR10KingDistance, 99)
  assert.equal(
    scoreTwoBishopsWhiteMove(fen, 'Bg5').ruleR10TargetPenalty,
    0,
  )
})

test('rule r10 retains unoccupied peers when an equally closest candidate is occupied', () => {
  for (const occupied of [false, true]) {
    const fen = occupied
      ? '8/8/8/4K3/8/4Bk2/2B5/8 w - - 0 1'
      : '8/8/8/4K3/8/5k2/2BB4/8 w - - 0 1'
    // White guards e4 so Black cannot cross both walls after Bd1+.
    for (const transform of SQUARE_TRANSFORMS) {
      const transformedFen = transformFen(fen, transform)
      const move = getChess(transformedFen).moves({ verbose: true }).find(
        (candidate) => candidate.from === transformSquare('c2', transform) &&
          candidate.to === transformSquare('d1', transform),
      )!.san
      const score = scoreTwoBishopsWhiteMove(transformedFen, move)
      assert.equal(score.ruleR10TargetPenalty, 0, transform.name)
      assert.deepEqual([...score.ruleR10TargetSquares].sort(),
        (occupied ? ['f4'] as const : ['e3', 'f4'] as const).map((square) => transformSquare(square, transform)).sort(),
        transform.name)
      assert.equal(score.ruleR10KingDistance, 1, transform.name)
      const result = getChess(transformedFen)
      result.move(move)
      assert.equal(result.get(transformSquare('e3', transform))?.type === 'b', occupied,
        transform.name)
      for (const target of score.ruleR10TargetSquares) {
        assert.equal(kingDistance(transformSquare('f3', transform), target), 1)
      }
    }
  }
})

test('rule r10 excludes screened targets even when the king controls them', () => {
  // Bg4 and Bd2 define one orientation. Both outer screens are permitted.
  const fen = '8/8/8/8/5KB1/8/3B4/7k w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    for (const to of ['e3', 'g5'] as const) {
      const move = getChess(transformedFen).moves({ verbose: true }).find(
        (candidate) => candidate.from === transformSquare('f4', transform) &&
          candidate.to === transformSquare(to, transform),
      )?.san
      assert.ok(move, transform.name)
      const score = scoreTwoBishopsWhiteMove(transformedFen, move)
      assert.equal(score.ruleR10TargetPenalty, 0, transform.name)
      assert.equal(score.ruleR10DiagonalCount, 4, transform.name)
      assert.deepEqual([...score.ruleR10TargetSquares].sort(),
        (to === 'e3' ? ['e3'] as const : ['e3', 'f4'] as const).map((square) => transformSquare(square, transform)).sort(),
        transform.name)
      assert.equal(score.ruleR10KingDistance, 1, transform.name)
    }
  }
})

test('rule r10 allows a target when White is inside the wall', () => {
  const score = scoreTwoBishopsWhiteMove(
    '8/8/8/8/5K2/7k/3BB3/8 w - - 0 1',
    'Kf3',
  )
  assert.equal(score.ruleR10TargetPenalty, 0)
  assert.deepEqual(score.ruleR10TargetSquares, ['f4', 'g5'])
  assert.equal(score.ruleR10KingDistance, 1)
})

test('r9 prefers Kd6 opposition despite its screened r10 target candidates', () => {
  const fen = '8/8/5k2/3K4/1B6/1B6/8/8 w - - 0 1'
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Kd6'])
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const onTargetMove = getChess(transformedFen)
      .moves({ verbose: true })
      .find(
        (candidate) =>
          candidate.from === transformSquare('d5', transform) &&
          candidate.to === transformSquare('d6', transform),
      )?.san
    assert.ok(onTargetMove, transform.name)
    const onTarget = scoreTwoBishopsWhiteMove(transformedFen, onTargetMove)
    // Kd6 may screen outer a3–f8 and retains the eight-diagonal profile.
    assert.equal(onTarget.ruleR10TargetPenalty, 1, transform.name)
    assert.equal(onTarget.ruleR10DiagonalCount, 8, transform.name)
    assert.deepEqual(onTarget.ruleR10TargetSquares, [], transform.name)
    const screenedPosition = getChess(transformedFen)
    screenedPosition.move(onTargetMove)
    assert.equal(screenedPosition.isAttacked(transformSquare('f8', transform), 'w'),
      false, transform.name)
    const outsideMove = getChess(transformedFen)
      .moves({ verbose: true })
      .find(
        (candidate) =>
          candidate.from === transformSquare('d5', transform) &&
          candidate.to === transformSquare('c6', transform),
      )?.san
    assert.ok(outsideMove, transform.name)
    const outside = scoreTwoBishopsWhiteMove(transformedFen, outsideMove)
    assert.equal(outside.ruleR10TargetPenalty, 0, transform.name)
    assert.equal(outside.ruleR10DiagonalCount, 8, transform.name)
    assert.ok(compareScoresByRules(onTarget, outside, twoBishopsWhiteRules.filter(r => r.id === 'rule r8' || r.id === 'rule r10')) > 0, transform.name)
    const intactPosition = getChess(transformedFen)
    intactPosition.move(outsideMove)
    assert.equal(intactPosition.isAttacked(transformSquare('f8', transform), 'w'),
      true, transform.name)
    const narrowerMove = getChess(transformedFen)
      .moves({ verbose: true })
      .find((candidate) =>
        candidate.from === transformSquare('b4', transform) &&
        candidate.to === transformSquare('c3', transform),
      )!.san
    const narrower = scoreTwoBishopsWhiteMove(transformedFen, narrowerMove)
    assert.equal(narrower.ruleR10TargetPenalty, 0, transform.name)
    assert.equal(narrower.ruleR10DiagonalCount, 10, transform.name)
    const approachMove = getChess(transformedFen).moves({ verbose: true }).find(
      (candidate) => candidate.from === transformSquare('d5', transform) &&
        candidate.to === transformSquare('c4', transform),
    )!.san
    const approach = scoreTwoBishopsWhiteMove(transformedFen, approachMove)
    // Both Kd6 on the screened outer wall and Kc6 outside it retain the
    // wall. Kd6 screens every closest candidate, while Kc6 targets e7.
    // R9 still prefers Kd6's opposition before r10 compares those targets.
    assert.equal(onTarget.ruleR10KingDistance, 99, transform.name)
    assert.equal(outside.ruleR10KingDistance, 2, transform.name)
    assert.ok(compareScoresByRules(outside, approach, twoBishopsWhiteRules.filter(r => r.id === 'rule r8' || r.id === 'rule r10')) < 0, transform.name)
    assert.deepEqual(getIdealTwoBishopsWhiteMoves(transformedFen), [onTargetMove],
      transform.name)
    assert.deepEqual(
      [...outside.ruleR10TargetSquares].sort(),
      (['e7'] as const).map((square) => transformSquare(square, transform)).sort(),
      transform.name,
    )
  }
})

test('rule r10 selects Ke4 toward the outer-wall square adjacent to Black', () => {
  const fen = '3k4/8/8/4B3/5K2/7B/8/8 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const move = getChess(transformedFen).moves({ verbose: true }).find(
      (candidate) => candidate.from === transformSquare('f4', transform) &&
        candidate.to === transformSquare('e4', transform),
    )?.san
    assert.ok(move, transform.name)
    assert.deepEqual(getIdealTwoBishopsWhiteMoves(transformedFen), [move], transform.name)
    assert.deepEqual(scoreTwoBishopsWhiteMove(transformedFen, move).ruleR10TargetSquares,
      [transformSquare('c7', transform)], transform.name)
  }
})

test('rule r10 has no target without adjacent inner and outer walls', () => {
  const score = scoreTwoBishopsWhiteMove(
    '8/8/8/8/5K2/7k/3B1B2/8 w - - 0 1',
    'Kf5',
  )
  assert.equal(score.ruleR10TargetPenalty, 1)
  assert.deepEqual(score.ruleR10TargetSquares, [])
  assert.equal(score.ruleR10DiagonalCount, 99)
})

test('r8 orders fewer diagonals before White king-step proximity with inside-wall targets', () => {
  const cases = [
    {
      fen: '8/8/8/8/4K3/6k1/3B4/3B4 w - - 0 1',
      preferred: 'Bf4+',
      rejected: 'Bc2',
      preferredScore: [0, 4, 1],
      // Ke4 may screen Bc2's outer wall, retaining five diagonals and a target.
      rejectedScore: [0, 5, 1],
    },
    {
      fen: '8/8/8/8/4K3/6k1/3B4/3B4 w - - 0 1',
      preferred: 'Be3',
      rejected: 'Bc2',
      preferredScore: [0, 4, 1],
      rejectedScore: [0, 5, 1],
    },
    {
      // From d5, target f4 is two king steps away; the larger enclosure's
      // e4 target is one king step away, but diagonal count takes precedence.
      fen: '8/8/8/3K4/8/6k1/3B4/3B4 w - - 0 1',
      preferred: 'Bg5',
      rejected: 'Bc2',
      preferredScore: [0, 4, 2],
      rejectedScore: [0, 5, 1],
    },
    {
      fen: '8/8/8/8/4K3/6k1/3B4/3B4 w - - 0 1',
      preferred: 'Ke5',
      rejected: 'Kd5',
      preferredScore: [0, 4, 1],
      rejectedScore: [0, 4, 2],
    },
    {
      // Kc2 keeps the smaller wall with target c5 despite White being inside.
      // Ke2 screens that inner wall legally and ties at three king steps from c5.
      fen: '8/8/8/8/1k6/3BB3/3K4/8 w - - 0 1',
      preferred: 'Kc2',
      rejected: 'Ke2',
      preferredScore: [0, 5, 3],
      rejectedScore: [0, 5, 3],
    },
  ] as const
  for (const { fen, preferred, rejected, preferredScore, rejectedScore } of cases) {
    const first = scoreTwoBishopsWhiteMove(fen, preferred)
    const second = scoreTwoBishopsWhiteMove(fen, rejected)
    assert.deepEqual(
      [first.ruleR10TargetPenalty, first.ruleR10DiagonalCount, first.ruleR10KingDistance],
      preferredScore,
      preferred,
    )
    assert.deepEqual(
      [second.ruleR10TargetPenalty, second.ruleR10DiagonalCount, second.ruleR10KingDistance],
      rejectedScore,
      rejected,
    )
    const comparison = compareScoresByRules(first, second,
      twoBishopsWhiteRules.filter(r => r.id === 'rule r8' || r.id === 'rule r10'))
    if (preferred === 'Kc2') assert.equal(comparison, 0, preferred)
    else assert.ok(comparison < 0, preferred)
  }
})

test('r10 prefers the smaller Bb3 wall over Ke6 reaching the outer wall', () => {
  const fen = '8/7k/8/5K2/8/8/BB6/8 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const moves = getChess(transformedFen).moves({ verbose: true })
    const move = (from: 'a2' | 'b2' | 'f5', to: 'b3' | 'e6' | 'f6' | 'b1') => moves.find(
      (candidate) => candidate.from === transformSquare(from, transform) &&
        candidate.to === transformSquare(to, transform),
    )!.san
    const bishop = scoreTwoBishopsWhiteMove(transformedFen, move('a2', 'b3'))
    const king = scoreTwoBishopsWhiteMove(transformedFen, move('f5', 'e6'))
    assert.equal(bishop.ruleR10TargetPenalty, 0, transform.name)
    assert.equal(king.ruleR10TargetPenalty, 1, transform.name)
    assert.equal(bishop.ruleR10DiagonalCount, 7, transform.name)
    assert.equal(king.ruleR10DiagonalCount, 8, transform.name)
    assert.deepEqual(king.ruleR10TargetSquares, [], transform.name)
    assert.ok(compareTwoBishopsWhiteScores(bishop, king) < 0, transform.name)
    const result = getChess(transformedFen)
    result.move(move('f5', 'e6'))
    assert.ok(result.moves({ verbose: true }).some(
      (reply) => reply.to === transformSquare('g8', transform)), transform.name)
    assert.deepEqual(getIdealTwoBishopsWhiteMoves(transformedFen),
      [move('a2', 'b3')], transform.name)
  }
})

test('rule r10 prefers the smaller Bc3 wall over the Kd3 king move', () => {
  const fen = '8/8/7k/8/8/4K3/2BB4/8 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const moves = getChess(transformedFen).moves({ verbose: true })
    const move = (from: 'e3' | 'd2', to: 'e4' | 'd4' | 'c3' | 'd3') => moves.find(
      (candidate) => candidate.from === transformSquare(from, transform) &&
        candidate.to === transformSquare(to, transform),
    )!.san
    const king = scoreTwoBishopsWhiteMove(transformedFen, move('e3', 'e4'))
    const bishop = scoreTwoBishopsWhiteMove(transformedFen, move('d2', 'c3'))
    assert.equal(king.ruleR10DiagonalCount, 10, transform.name)
    assert.equal(bishop.ruleR10DiagonalCount, 6, transform.name)
    assert.deepEqual([...king.ruleR10TargetSquares].sort(), (['c2', 'd1'] as const).map((square) => transformSquare(square, transform)).sort(), transform.name)
    assert.ok(compareTwoBishopsWhiteScores(bishop, king) < 0, transform.name)
    const target = scoreTwoBishopsWhiteMove(transformedFen, move('e3', 'd4'))
    assert.equal(target.ruleR10TargetPenalty, 0, transform.name)
    assert.equal(target.ruleR10DiagonalCount, 10, transform.name)
    assert.deepEqual([...target.ruleR10TargetSquares].sort(), (['c2', 'd1'] as const).map((square) => transformSquare(square, transform)).sort(), transform.name)
    const result = getChess(transformedFen)
    result.move(move('e3', 'e4'))
    assert.ok(result.moves({ verbose: true }).some(
      (reply) => reply.to === transformSquare('g7', transform)), transform.name)
    const approachMove = move('e3', 'd3')
    const approach = scoreTwoBishopsWhiteMove(transformedFen, approachMove)
    assert.ok(compareTwoBishopsWhiteScores(bishop, approach) < 0, transform.name)
    assert.deepEqual(getIdealTwoBishopsWhiteMoves(transformedFen), [move('d2', 'c3')],
      transform.name)
  }
})

test('r10 permits unreachable inner and outer screens, and prefers Bg3 off the corner edge', () => {
  const fen = '8/6k1/3K4/8/8/7B/7B/8 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const moves = getChess(transformedFen).moves({ verbose: true })
    const move = (from: 'd6' | 'h2', to: 'e5' | 'e6' | 'd5' | 'g3') => moves.find(
      (candidate) => candidate.from === transformSquare(from, transform) &&
        candidate.to === transformSquare(to, transform),
    )!.san
    const bishop = scoreTwoBishopsWhiteMove(transformedFen, move('h2', 'g3'))
    assert.equal(bishop.ruleR10OuterBishopPenalty, 0, transform.name)
    assert.equal(bishop.ruleR10DiagonalCount, 5, transform.name)
    assert.deepEqual(bishop.ruleR10TargetSquares, [transformSquare('e5', transform)], transform.name)
    const clearKing = scoreTwoBishopsWhiteMove(transformedFen, move('d6', 'd5'))
    assert.equal(clearKing.ruleR10DiagonalCount, 5, transform.name)
    assert.deepEqual(clearKing.ruleR10TargetSquares, [transformSquare('e5', transform)],
      transform.name)
    assert.equal(clearKing.ruleR10KingDistance, 1, transform.name)
    assert.ok(compareTwoBishopsWhiteScores(bishop, clearKing) < 0, transform.name)
    for (const to of ['e5', 'e6'] as const) {
      const king = scoreTwoBishopsWhiteMove(transformedFen, move('d6', to))
      assert.deepEqual(king.ruleR10TargetSquares,
        [transformSquare('e5', transform)], transform.name)
      assert.equal(king.ruleR10TargetPenalty, 0, transform.name)
      assert.equal(king.ruleR10KingDistance, 1, transform.name)
      // Both screens retain the pair because Black cannot enter the inner wall.
      assert.equal(king.ruleR10DiagonalCount, 5, transform.name)
      assert.equal(king.ruleR10OuterBishopPenalty, 1, transform.name)
      assert.ok(compareTwoBishopsWhiteScores(bishop, king) < 0, transform.name)
    }
    const best = move('h2', 'g3')
    assert.equal(scoreTwoBishopsWhiteMove(transformedFen, best).ruleR10OuterBishopPenalty, 0,
      transform.name)
    assert.deepEqual(getIdealTwoBishopsWhiteMoves(transformedFen), [best], transform.name)
  }
})


test('rule r6.4 selects the Bf6 choke ahead of wall preferences', () => {
  const fen = '4B3/6K1/4k3/8/7B/8/8/8 w - - 0 1'
  const rule = twoBishopsWhiteRules.find(({ id }) => id === 'rule r6.4')!
  assert.equal(rule.helpText,
    "Play the choke move. When the inner wall has five squares and touches neither of the target corner's edges, if White's king is outside the wall, prefer the inner-wall bishop on the long diagonal.")
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const moves = getChess(transformedFen).moves({ verbose: true })
    const san = (from: 'h4' | 'e8', to: 'f6' | 'h5') => moves.find(
      (move) => move.from === transformSquare(from, transform) &&
        move.to === transformSquare(to, transform))!.san
    const choke = scoreTwoBishopsWhiteMove(transformedFen, san('h4', 'f6'))
    const outer = scoreTwoBishopsWhiteMove(transformedFen, san('e8', 'h5'))
    assert.equal(choke.ruleR6_4Applies, true, transform.name)
    assert.equal(choke.ruleR6_4Penalty, 0, transform.name)
    assert.equal(outer.ruleR6_4Penalty, 1, transform.name)
    assert.ok(compareScoresByRules(choke, outer, [rule]) < 0, transform.name)
    assert.equal(choke.ruleR10DiagonalCount, 10, transform.name)
    assert.equal(outer.ruleR10DiagonalCount, 10, transform.name)
    assert.equal(choke.ruleR10OuterBishopPenalty, 0, transform.name)
    assert.equal(outer.ruleR10OuterBishopPenalty, 0, transform.name)
    assert.ok(compareTwoBishopsWhiteScores(choke, outer) < 0, transform.name)
    assert.deepEqual(getIdealTwoBishopsWhiteMoves(transformedFen), [san('h4', 'f6')], transform.name)
  }
})

test('rule r6.4 stays inactive for the wrong wall length or a wall touching target-corner edges', () => {
  for (const [fen, from, to] of [
    ['8/4B1K1/8/4k3/8/7B/8/8 w - - 0 1', 'g7', 'f8'], // Six-square inner wall.
    ['8/8/8/8/7k/4B3/4BK2/8 w - - 0 1', 'f2', 'f1'], // Five squares, touching h1's edges.
    ['7k/8/8/8/8/2B2B2/8/K7 w - - 0 1', 'a1', 'a2'], // No adjacent walls.
  ] as const) {
    for (const transform of SQUARE_TRANSFORMS) {
      const transformedFen = transformFen(fen, transform)
      const move = getChess(transformedFen).moves({ verbose: true }).find(
        (candidate) => candidate.from === transformSquare(from, transform) &&
          candidate.to === transformSquare(to, transform))!.san
      const score = scoreTwoBishopsWhiteMove(transformedFen, move)
      assert.equal(score.ruleR6_4Applies, false, `${fen} ${transform.name}`)
      assert.equal(score.ruleR6_4Penalty, 0, `${fen} ${transform.name}`)
    }
  }
})

test('rule r6.4 credits retaining the inner bishop on the long diagonal symmetrically', () => {
  const fen = '4B3/6K1/4kB2/8/8/8/8/8 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const moves = getChess(transformedFen).moves({ verbose: true })
    for (const [from, to, penalty] of [['g7', 'h7', 0], ['f6', 'g5', 1]] as const) {
      const move = moves.find((candidate) => candidate.from === transformSquare(from, transform) &&
        candidate.to === transformSquare(to, transform))!.san
      const score = scoreTwoBishopsWhiteMove(transformedFen, move)
      assert.equal(score.ruleR6_4Applies, true, transform.name)
      assert.equal(score.ruleR6_4Penalty, penalty, transform.name)
    }
  }
})

test('rule r25 uses White-to-Black squared Euclidean distance', () => {
  const fen = '8/8/2K5/5B2/3B4/8/8/7k w - - 0 1'
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Kd5').ruleR25KingDistance, 32)
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Kb5').ruleR25KingDistance, 52)
})

test('rule r30 maximizes the nearer bishop distance, then the farther one', () => {
  const fen = '8/8/8/8/3K4/8/2BBk3/8 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const moveTo = (target: 'f4' | 'g5') =>
      getChess(transformedFen)
        .moves({ verbose: true })
        .find(
          (candidate) =>
            candidate.from === transformSquare('d2', transform) &&
            candidate.to === transformSquare(target, transform),
        )?.san
    const nearMove = moveTo('f4')
    const farMove = moveTo('g5')
    assert.ok(nearMove, transform.name)
    assert.ok(farMove, transform.name)
    const near = scoreTwoBishopsWhiteMove(transformedFen, nearMove)
    const far = scoreTwoBishopsWhiteMove(transformedFen, farMove)
    assert.equal(
      far.ruleR30NearerBishopDistance,
      near.ruleR30NearerBishopDistance,
      transform.name,
    )
    assert.ok(
      far.ruleR30FartherBishopDistance > near.ruleR30FartherBishopDistance,
      transform.name,
    )
  }
})

test('rule r30 then minimizes the farther bishop distance to White', () => {
  const fen = '8/6K1/8/1k6/1B6/1B6/8/8 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const moveTo = (target: 'e7' | 'd2') =>
      getChess(transformedFen)
        .moves({ verbose: true })
        .find(
          (candidate) =>
            candidate.from === transformSquare('b4', transform) &&
            candidate.to === transformSquare(target, transform),
        )?.san
    const closeMove = moveTo('e7')
    const farMove = moveTo('d2')
    assert.ok(closeMove, transform.name)
    assert.ok(farMove, transform.name)
    const close = scoreTwoBishopsWhiteMove(transformedFen, closeMove)
    const far = scoreTwoBishopsWhiteMove(transformedFen, farMove)
    assert.equal(
      close.ruleR30NearerBishopDistance,
      far.ruleR30NearerBishopDistance,
      transform.name,
    )
    assert.equal(
      close.ruleR30FartherBishopDistance,
      far.ruleR30FartherBishopDistance,
      transform.name,
    )
    assert.equal(
      close.ruleR30FartherWhiteKingDistance,
      far.ruleR30FartherWhiteKingDistance,
      transform.name,
    )
    assert.ok(
      close.ruleR30NearerWhiteKingDistance <
        far.ruleR30NearerWhiteKingDistance,
      transform.name,
    )
  }
})

test('mate remains the highest priority', () => {
  const fen = '8/3B4/8/8/5B2/8/5K2/7k w - - 4 3'
  for (const san of getIdealTwoBishopsWhiteMoves(fen)) {
    const chess = getChess(fen)
    chess.move(san)
    assert.equal(chess.isCheckmate(), true, san)
  }
})

test('selection reports which retained rule filtered each move', () => {
  const fen = 'K7/8/8/5B2/3B4/8/8/7k w - - 0 1'
  const analysis = analyzeTwoBishopsWhiteSelection(fen)
  assert.deepEqual(Object.keys(analysis.ruleFilterCounts), ACTIVE_RULE_IDS)
  assert.equal(
    Object.values(analysis.ruleFilterCounts).reduce(
      (total, count) => total + count,
      0,
    ),
    getChess(fen).moves().length - analysis.idealWhiteMoves.length,
  )
})


test('rule r10 compares the target squares after the move', () => {
  const fen = '8/8/6B1/4K3/8/4B3/8/3k4 w - - 2 2'
  const r10 = twoBishopsWhiteRules.find(({ id }) => id === 'rule r10')!
  assert.equal(r10.subpriorities?.length, 3)
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const moves = getChess(transformedFen).moves({ verbose: true })
    const san = (from: 'e5' | 'g6', to: 'd4' | 'd3') => moves.find(
      (move) => move.from === transformSquare(from, transform) &&
        move.to === transformSquare(to, transform),
    )!.san
    const king = scoreTwoBishopsWhiteMove(transformedFen, san('e5', 'd4'))
    const bishop = scoreTwoBishopsWhiteMove(transformedFen, san('g6', 'd3'))
    assert.equal(king.ruleR10DiagonalCount, 5, transform.name)
    assert.equal(bishop.ruleR10DiagonalCount, 5, transform.name)
    assert.deepEqual(king.ruleR10TargetSquares, [transformSquare('c2', transform)])
    assert.equal(king.ruleR10KingDistance, 2, transform.name)
    assert.deepEqual([...bishop.ruleR10TargetSquares].sort(),
      (['e3', 'f2'] as const).map((square) => transformSquare(square, transform)).sort(),
      transform.name)
    assert.equal(bishop.ruleR10KingDistance, 2, transform.name)
    assert.equal(king.ruleR10OuterBishopPenalty, 0, transform.name)
    assert.equal(bishop.ruleR10OuterBishopPenalty, 0, transform.name)
    assert.ok(compareScoresByRules(bishop, king, [r10]) < 0, transform.name)
    assert.deepEqual(getIdealTwoBishopsWhiteMoves(transformedFen),
      [san('g6', 'd3')], transform.name)
  }
})

test('rule r6.2 selects the flank step symmetrically ahead of r10', () => {
  const starts = [
    { fen: '8/8/8/2B5/k1BK4/8/8/8 w - - 0 1', from: 'd4', to: 'c3' },
    { fen: '8/8/8/3B4/1k1BK3/8/8/8 w - - 0 1', from: 'e4', to: 'd3' },
  ] as const
  const flankRule = twoBishopsWhiteRules.find(({ id }) => id === 'rule r6.2')!
  assert.match(flankRule.helpText, /^Play the flank step\./)
  for (const { fen, from, to } of starts) {
    for (const transform of SQUARE_TRANSFORMS) {
      const transformedFen = transformFen(fen, transform)
      const moves = getChess(transformedFen).moves({ verbose: true })
      const flank = moves.find((move) =>
        move.from === transformSquare(from, transform) &&
        move.to === transformSquare(to, transform))!.san
      const score = scoreTwoBishopsWhiteMove(transformedFen, flank)
      assert.equal(score.ruleR6_2Applies, true, transform.name)
      assert.equal(score.ruleR6_2Penalty, 0, transform.name)
      for (const move of moves.filter(({ san }) => san !== flank)) {
        const other = scoreTwoBishopsWhiteMove(transformedFen, move.san)
        assert.ok(compareScoresByRules(score, other, [flankRule]) < 0, transform.name)
      }
      if (from === 'd4') {
        const bishopMove = moves.find((move) =>
          move.from === transformSquare('c4', transform) &&
          move.to === transformSquare('f7', transform))!.san
        const bishop = scoreTwoBishopsWhiteMove(transformedFen, bishopMove)
        // Both moves retain five diagonals, target b3, and an off-edge
        // outer bishop. Distance from that bishop to Black no longer
        // matters in r10, so target proximity selects Kc3 over Bf7.
        assert.equal(score.ruleR10DiagonalCount, 5, transform.name)
        assert.equal(bishop.ruleR10DiagonalCount, 5, transform.name)
        assert.deepEqual(score.ruleR10TargetSquares, [transformSquare('b3', transform)],
          transform.name)
        assert.deepEqual(bishop.ruleR10TargetSquares, score.ruleR10TargetSquares,
          transform.name)
        assert.equal(score.ruleR10KingDistance, 1, transform.name)
        assert.equal(bishop.ruleR10KingDistance, 2, transform.name)
        assert.equal(score.ruleR10OuterBishopPenalty, 0, transform.name)
        assert.equal(bishop.ruleR10OuterBishopPenalty, 0, transform.name)
        assert.equal(twoBishopsWhiteRules.find((rule) =>
          compareScoresByRules(bishop, score, [rule]) !== 0)?.id,
        'rule r6.2', transform.name)
        assert.ok(compareTwoBishopsWhiteScores(score, bishop) < 0, transform.name)
        assert.deepEqual(getIdealTwoBishopsWhiteMoves(transformedFen), [flank], transform.name)
      }
    }
  }
})

test('rule r6.2 stays inactive unless every flank-step condition holds', () => {
  const cases = [
    ['same half', '8/8/8/8/k1BK4/2B5/8/8 w - - 0 1'],
    ['nonadjacent bishops', '8/2B5/8/8/k1BK4/8/8/8 w - - 0 1'],
    ['king not adjacent to both bishops', '8/8/8/2B5/k1B1K3/8/8/8 w - - 0 1'],
    ['kings not in line', '8/8/8/k1B5/2BK4/8/8/8 w - - 0 1'],
    ['kings four steps apart', '8/8/8/3B4/k2BK3/8/8/8 w - - 0 1'],
    ['kings on the same side', '8/8/8/2B5/2BK2k1/8/8/8 w - - 0 1'],
  ] as const
  for (const [name, fen] of cases) {
    for (const transform of SQUARE_TRANSFORMS) {
      const transformedFen = transformFen(fen, transform)
      for (const san of getChess(transformedFen).moves()) {
        const score = scoreTwoBishopsWhiteMove(transformedFen, san)
        assert.equal(score.ruleR6_2Applies, false, `${name}: ${transform.name}`)
        assert.equal(score.ruleR6_2Penalty, 0, `${name}: ${transform.name}`)
      }
    }
  }
})


test('closest distant targets exclude occupied candidates and restore them when vacated', () => {
  const fen = '8/4k3/8/3BB3/3K4/8/8/8 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const moves = getChess(transformedFen).moves({ verbose: true })
    const san = (from: 'd4' | 'd5', to: 'c5' | 'g2') => moves.find(
      (move) => move.from === transformSquare(from, transform) &&
        move.to === transformSquare(to, transform))!.san
    const occupied = scoreTwoBishopsWhiteMove(transformedFen, san('d4', 'c5'))
    assert.deepEqual([...occupied.ruleR10TargetSquares].sort(),
      (['c6'] as const).map((square) => transformSquare(square, transform)).sort(),
      transform.name)
    assert.equal(occupied.ruleR10KingDistance, 1, transform.name)
    const opened = scoreTwoBishopsWhiteMove(transformedFen, san('d5', 'g2'))
    assert.deepEqual([...opened.ruleR10TargetSquares].sort(),
      (['c6', 'd5'] as const).map((square) => transformSquare(square, transform)).sort(),
      transform.name)
    for (const target of opened.ruleR10TargetSquares) {
      assert.equal(kingDistance(transformSquare('e7', transform), target), 2)
    }
    assert.equal(opened.ruleR10KingDistance, 1, transform.name)
    assert.deepEqual(getIdealTwoBishopsWhiteMoves(transformedFen),
      [san('d5', 'g2')], transform.name)
  }
})


test('r10 retains screened outer-wall targets and puts bishop edge placement before Euclidean proximity', () => {
  const fen = '8/1k6/4K3/8/8/B7/B7/8 w - - 0 1'
  const r10 = twoBishopsWhiteRules.find(({ id }) => id === 'rule r10')!
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const moves = getChess(transformedFen).moves({ verbose: true })
    const san = (from: 'a2' | 'e6', to: 'b3' | 'd5' | 'e5') => moves.find(
      (move) => move.from === transformSquare(from, transform) &&
        move.to === transformSquare(to, transform))!.san
    const bishop = scoreTwoBishopsWhiteMove(transformedFen, san('a2', 'b3'))
    const king = scoreTwoBishopsWhiteMove(transformedFen, san('e6', 'd5'))
    assert.equal(bishop.ruleR10OuterBishopPenalty, 0, transform.name)
    assert.equal(king.ruleR10OuterBishopPenalty, 1, transform.name)
    assert.equal(bishop.ruleR10DiagonalCount, king.ruleR10DiagonalCount, transform.name)
    assert.equal(king.ruleR10DiagonalCount, 5, transform.name)
    for (const screened of [bishop, king]) {
      assert.equal(screened.ruleR10TargetPenalty, 0, transform.name)
      assert.deepEqual(screened.ruleR10TargetSquares,
        [transformSquare('d5', transform)], transform.name)
    }
    assert.equal(bishop.ruleR10KingDistance, 1, transform.name)
    assert.equal(king.ruleR10KingDistance, 1, transform.name)
    // The a2–g8 outer wall remains valid through either king screen. Bb3
    // places its outer bishop off the edge before target proximity is compared.
    assert.ok(compareScoresByRules(bishop, king, [r10]) < 0, transform.name)
    const clearKing = scoreTwoBishopsWhiteMove(transformedFen, san('e6', 'e5'))
    assert.equal(clearKing.ruleR10DiagonalCount, 5, transform.name)
    assert.deepEqual(clearKing.ruleR10TargetSquares, [transformSquare('d5', transform)],
      transform.name)
    assert.equal(clearKing.ruleR10KingDistance, 1, transform.name)
    assert.ok(compareScoresByRules(bishop, clearKing, [r10]) < 0, transform.name)
    assert.deepEqual(getIdealTwoBishopsWhiteMoves(transformedFen),
      [san('a2', 'b3')], transform.name)
  }
})


test('r8 prefers fewer diagonals before moving bishops off the edge symmetrically', () => {
  const fen = '8/4k3/6K1/8/8/8/BB6/8 w - - 2 2'
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const moves = getChess(transformedFen).moves({ verbose: true })
    const san = (from: 'a2' | 'b2', to: 'b3' | 'a3') => moves.find(
      (move) => move.from === transformSquare(from, transform) &&
        move.to === transformSquare(to, transform))!.san
    const narrower = scoreTwoBishopsWhiteMove(transformedFen, san('b2', 'a3'))
    const interior = scoreTwoBishopsWhiteMove(transformedFen, san('a2', 'b3'))
    assert.equal(narrower.ruleR10DiagonalCount, 5, transform.name)
    assert.equal(interior.ruleR10DiagonalCount, 6, transform.name)
    assert.equal(narrower.ruleR10OuterBishopPenalty, 1, transform.name)
    assert.equal(interior.ruleR10OuterBishopPenalty, 0, transform.name)
    assert.ok(compareScoresByRules(narrower, interior, twoBishopsWhiteRules.filter(r => r.id === 'rule r8' || r.id === 'rule r10')) < 0, transform.name)
    assert.deepEqual(getIdealTwoBishopsWhiteMoves(transformedFen),
      [san('b2', 'a3')], transform.name)
  }
})


test('r10 again counts the unreachable inner-screen wall in the former exemption', () => {
  const fen = '8/6B1/8/8/5K1k/8/2B5/8 w - - 2 2'
  const r10 = twoBishopsWhiteRules.find(({ id }) => id === 'rule r10')!
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const chess = getChess(transformedFen)
    const move = (from: 'g7' | 'c2', to: 'h6' | 'd3') => chess.moves({ verbose: true }).find(
      (candidate) => candidate.from === transformSquare(from, transform) &&
        candidate.to === transformSquare(to, transform))!.san
    const bishopMove = move('g7', 'h6')
    const screened = scoreTwoBishopsWhiteMove(transformedFen, bishopMove)
    const unchanged = scoreTwoBishopsWhiteMove(transformedFen, move('c2', 'd3'))
    assert.equal(screened.ruleR10DiagonalCount, 5, transform.name)
    assert.deepEqual([...screened.ruleR10TargetSquares].sort(), (['f5', 'g6'] as const).map((square) => transformSquare(square, transform)).sort(), transform.name)
    assert.equal(unchanged.ruleR10DiagonalCount, 6, transform.name)
    assert.equal(r10.applies, undefined)
    assert.ok(compareScoresByRules(unchanged, screened, [r10]) > 0, transform.name)
    chess.move(bishopMove)
    assert.ok(!chess.moves({ verbose: true }).some(
      (reply) => reply.to === transformSquare('c1', transform)))
    let from = transformSquare('h4', transform)
    for (const square of ['h3', 'g2', 'f1', 'e1', 'd2', 'c1'] as const) {
      const to = transformSquare(square, transform)
      const fields = chess.fen().split(' ')
      fields[1] = 'b'
      chess.load(fields.join(' '))
      assert.ok(chess.move({ from, to }), `${transform.name}: ${square}`)
      from = to
    }
  }
})

test('r10 allows an inner screen when White controls its only hidden square', () => {
  const fen = '8/6B1/8/8/7k/8/2BK4/8 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const chess = getChess(transformedFen)
    const move = chess.moves({ verbose: true }).find(
      (candidate) => candidate.from === transformSquare('g7', transform) &&
        candidate.to === transformSquare('h6', transform))!.san
    const score = scoreTwoBishopsWhiteMove(transformedFen, move)
    assert.equal(score.ruleR10DiagonalCount, 5, transform.name)
    assert.deepEqual([...score.ruleR10TargetSquares].sort(), (['f5', 'g6'] as const).map((square) => transformSquare(square, transform)).sort(), transform.name)
    chess.move(move)
    // Kd2 guards the only hidden square c1, so Black cannot enter it.
    assert.ok(chess.isAttacked(transformSquare('c1', transform), 'w'))
  }
})

test('r10 allows the guarded Ke2 inner screen and prefers Kc2 toward the inside-wall target', () => {
  const fen = '8/8/8/8/1k6/3BB3/3K4/8 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const moves = getChess(transformedFen).moves({ verbose: true })
    const san = (to: 'e2' | 'c2') => moves.find(
      (move) => move.from === transformSquare('d2', transform) &&
        move.to === transformSquare(to, transform))!.san
    const edgeKing = scoreTwoBishopsWhiteMove(transformedFen, san('e2'))
    const otherKing = scoreTwoBishopsWhiteMove(transformedFen, san('c2'))
    // Ke2 hides f1 from Bd3 on the a6–f1 inner wall despite guarding f1.
    // The original five-diagonal enclosure remains valid.
    assert.equal(edgeKing.ruleR10DiagonalCount, 5, transform.name)
    assert.equal(otherKing.ruleR10DiagonalCount, 5, transform.name)
    assert.deepEqual(edgeKing.ruleR10TargetSquares, [transformSquare('c5', transform)],
      transform.name)
    assert.ok(compareTwoBishopsWhiteScores(otherKing, edgeKing) < 0, transform.name)
    const bishopMove = moves.find(
      (move) => move.from === transformSquare('d3', transform) &&
        move.to === transformSquare('h7', transform))!.san
    const bishop = scoreTwoBishopsWhiteMove(transformedFen, bishopMove)
    assert.equal(bishop.ruleR10DiagonalCount, 8, transform.name)
    assert.deepEqual(bishop.ruleR10TargetSquares, [transformSquare('d2', transform)],
      transform.name)
    assert.ok(compareTwoBishopsWhiteScores(bishop, edgeKing) > 0, transform.name)
    assert.ok(compareTwoBishopsWhiteScores(otherKing, bishop) < 0, transform.name)
    const retreatMove = moves.find(
      (move) => move.from === transformSquare('d3', transform) &&
        move.to === transformSquare('f1', transform))!.san
    const retreat = scoreTwoBishopsWhiteMove(transformedFen, retreatMove)
    assert.equal(retreat.ruleR10DiagonalCount, 5, transform.name)
    assert.deepEqual(retreat.ruleR10TargetSquares, [transformSquare('c5', transform)], transform.name)
    assert.deepEqual(otherKing.ruleR10TargetSquares, [transformSquare('c5', transform)], transform.name)
    // Both retain outer a7–g1 and beyond diagonal a8–h1.
    // Kd2 is five squared units from that diagonal; Kc2 is eight.
    assert.equal(retreat.ruleR24_5KingDistance, 5, transform.name)
    assert.equal(otherKing.ruleR24_5KingDistance, 8, transform.name)
    assert.equal(bishop.ruleR24_5KingDistance, 1, transform.name)
    assert.equal(twoBishopsWhiteRules.find((rule) =>
      compareScoresByRules(retreat, otherKing, [rule]) !== 0)?.id,
    'rule r10', transform.name)
    assert.ok(compareTwoBishopsWhiteScores(retreat, otherKing) > 0, transform.name)
    assert.deepEqual(getIdealTwoBishopsWhiteMoves(transformedFen), [san('c2')], transform.name)
  }
})

test('r10 allows the unreachable Bh5 inner screen and prefers its smaller wall', () => {
  const fen = '8/8/6B1/8/8/5K1k/3B4/8 w - - 0 1'
  const r10 = twoBishopsWhiteRules.find(({ id }) => id === 'rule r10')!
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const moves = getChess(transformedFen).moves({ verbose: true })
    const san = (from: 'd2' | 'f3' | 'g6', to: 'e3' | 'e4' | 'h5') => moves.find(
      (move) => move.from === transformSquare(from, transform) &&
        move.to === transformSquare(to, transform))!.san
    const king = scoreTwoBishopsWhiteMove(transformedFen, san('f3', 'e4'))
    const bishop = scoreTwoBishopsWhiteMove(transformedFen, san('g6', 'h5'))
    assert.equal(bishop.ruleR10DiagonalCount, 4, transform.name)
    assert.equal(king.ruleR10DiagonalCount, 5, transform.name)
    assert.equal(bishop.ruleR10OuterBishopPenalty, 0, transform.name)
    assert.equal(king.ruleR10OuterBishopPenalty, 0, transform.name)
    assert.deepEqual(king.ruleR10TargetSquares, [transformSquare('f5', transform)],
      transform.name)
    assert.equal(king.ruleR10KingDistance, 1, transform.name)
    assert.deepEqual([...bishop.ruleR10TargetSquares].sort(), (['f4', 'g5'] as const).map((square) => transformSquare(square, transform)).sort(), transform.name)
    assert.ok(compareScoresByRules(king, bishop, [r10]) > 0, transform.name)
    const intact = scoreTwoBishopsWhiteMove(transformedFen, san('d2', 'e3'))
    assert.equal(intact.ruleR10DiagonalCount, 5, transform.name)
    assert.ok(compareScoresByRules(intact, bishop, [r10]) > 0, transform.name)
    assert.ok(compareScoresByRules(king, intact, [r10]) < 0, transform.name)
    assert.ok(compareTwoBishopsWhiteScores(king, intact) < 0, transform.name)
    assert.deepEqual(getIdealTwoBishopsWhiteMoves(transformedFen),
      [san('g6', 'h5')], transform.name)
  }
})

test('r10 does not count a wall as screened when White occupies its endpoint', () => {
  const fen = '8/8/6B1/8/8/7k/3B4/3K4 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const move = getChess(transformedFen).moves({ verbose: true }).find(
      (candidate) => candidate.from === transformSquare('g6', transform) &&
        candidate.to === transformSquare('h5', transform))!.san
    assert.equal(scoreTwoBishopsWhiteMove(transformedFen, move).ruleR10DiagonalCount,
      4, transform.name)
  }
})


test('an outer-wall king qualifies a target when no farther than Black', () => {
  const cases = [
    { fen: '8/6B1/8/8/8/2K5/2B5/6k1 w - - 0 1', black: 'g1', target: 'd4', distance: 2, blackDistance: 3 },
    { fen: '8/6B1/8/8/8/2K5/2B4k/8 w - - 0 1', black: 'h2', target: 'e5', distance: 3, blackDistance: 3 },
    { fen: '8/6B1/8/8/7k/2K5/2B5/8 w - - 0 1', black: 'h4', target: 'f6', distance: 4, blackDistance: 2 },
  ] as const
  for (const { fen, black, target, distance, blackDistance } of cases) {
    for (const transform of SQUARE_TRANSFORMS) {
      const transformedFen = transformFen(fen, transform)
      const move = getChess(transformedFen).moves({ verbose: true }).find(
        (candidate) => candidate.from === transformSquare('c3', transform) &&
          candidate.to === transformSquare('b2', transform))!.san
      const transformedTarget = transformSquare(target, transform)
      assert.equal(kingDistance(transformSquare(black, transform), transformedTarget), blackDistance)
      assert.equal(kingDistance(transformSquare('b2', transform), transformedTarget), distance)
      const score = scoreTwoBishopsWhiteMove(transformedFen, move)
      assert.equal(score.ruleR10DiagonalCount, 6, transform.name)
      assert.deepEqual(score.ruleR10TargetSquares,
        distance <= blackDistance ? [transformedTarget] : [], transform.name)
    }
  }
})

test('central outer-wall eligibility and target proximity use king steps', () => {
  const cases = [
    { fen: '8/6B1/8/8/4K2k/8/2B5/8 w - - 0 1', from: 'e4', to: 'e5', distance: 1, proximity: 1 },
    { fen: '8/6B1/8/8/4K2k/8/2B5/8 w - - 0 1', from: 'e4', to: 'd4', distance: 2, proximity: 2 },
    { fen: '8/6B1/8/8/7k/3K4/2B5/8 w - - 0 1', from: 'd3', to: 'c3', distance: 3, proximity: 99 },
  ] as const
  for (const { fen, from, to, distance, proximity } of cases) {
    for (const transform of SQUARE_TRANSFORMS) {
      const transformedFen = transformFen(fen, transform)
      const move = getChess(transformedFen).moves({ verbose: true }).find(
        (candidate) => candidate.from === transformSquare(from, transform) &&
          candidate.to === transformSquare(to, transform))!.san
      const target = transformSquare('f6', transform)
      assert.equal(kingDistance(transformSquare('h4', transform), target), 2)
      assert.equal(kingDistance(transformSquare(to, transform), target), distance)
      const score = scoreTwoBishopsWhiteMove(transformedFen, move)
      assert.equal(score.ruleR10DiagonalCount, 6, `${transform.name}: ${to}`)
      assert.deepEqual(score.ruleR10TargetSquares,
        distance <= 2 ? [target] : [], `${transform.name}: ${to}`)
      assert.equal(score.ruleR10KingDistance,
        proximity, `${transform.name}: ${to}`)
      const result = getChess(transformedFen)
      result.move(move)
      // The a1–h8 outer wall remains eligible even with uncontrolled a1 hidden.
      assert.equal(result.isAttacked(transformSquare('a1', transform), 'w'), false,
        `${transform.name}: ${to}`)
    }
  }
})

test('r10 selects Bh6 in the former rotated exemption', () => {
  const fen = '8/6B1/8/8/5K1k/8/2B5/8 w - - 2 2'
  const r10 = twoBishopsWhiteRules.find(({ id }) => id === 'rule r10')!
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const moves = getChess(transformedFen).moves({ verbose: true })
    const san = (from: 'c2' | 'f4' | 'g7', to: 'e4' | 'e5' | 'h6' | 'a4') => moves.find(
      (move) => move.from === transformSquare(from, transform) &&
        move.to === transformSquare(to, transform))!.san
    const king = scoreTwoBishopsWhiteMove(transformedFen, san('f4', 'e5'))
    const bishop = scoreTwoBishopsWhiteMove(transformedFen, san('g7', 'h6'))
    assert.deepEqual(king.ruleR10TargetSquares, [transformSquare('f6', transform)],
      transform.name)
    assert.equal(king.ruleR10KingDistance, 1, transform.name)
    assert.equal(king.ruleR10DiagonalCount, 6, transform.name)
    assert.equal(bishop.ruleR10DiagonalCount, 5, transform.name)
    assert.ok(compareTwoBishopsWhiteScores(king, bishop) > 0, transform.name)
    assert.equal(r10.applies, undefined)
    assert.ok(compareScoresByRules(king, bishop, [r10]) > 0, transform.name)
    const intact = scoreTwoBishopsWhiteMove(transformedFen, san('c2', 'e4'))
    assert.equal(intact.ruleR10DiagonalCount, 6, transform.name)
    assert.ok(compareScoresByRules(king, intact, [r10]) < 0, transform.name)
    assert.ok(compareTwoBishopsWhiteScores(king, intact) < 0, transform.name)
    assert.deepEqual(getIdealTwoBishopsWhiteMoves(transformedFen),
      [san('g7', 'h6')], transform.name)
  }
})


test('outer-wall eligibility compares White distance separately for tied target candidates', () => {
  const cases = [
    // Black is three steps from both e3/f4; White is three/two steps away.
    { fen: '8/8/8/6K1/8/8/3B4/3B3k w - - 0 1', from: 'g5', to: 'h6', targets: ['e3', 'f4'] },
    // Black is three steps from both e5/f6; White is three/four steps away.
    { fen: '8/6B1/8/8/8/1K5k/2B5/8 w - - 0 1', from: 'b3', to: 'b2', targets: ['e5'] },
  ] as const
  for (const { fen, from, to, targets } of cases) {
    for (const transform of SQUARE_TRANSFORMS) {
      const transformedFen = transformFen(fen, transform)
      const move = getChess(transformedFen).moves({ verbose: true }).find(
        (candidate) => candidate.from === transformSquare(from, transform) &&
          candidate.to === transformSquare(to, transform))!.san
      const score = scoreTwoBishopsWhiteMove(transformedFen, move)
      assert.deepEqual([...score.ruleR10TargetSquares].sort(),
        targets.map((square) => transformSquare(square, transform)).sort(), transform.name)
    }
  }
})

test('r9 selects Kb4 opposition despite losing its screened r10 target', () => {
  const fen = '5BB1/8/8/1K6/8/8/1k6/8 w - - 24 13'
  const r10 = twoBishopsWhiteRules.find(({ id }) => id === 'rule r10')!
  const r25 = twoBishopsWhiteRules.find(({ id }) => id === 'rule r25')!
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const moves = getChess(transformedFen).moves({ verbose: true })
    const move = (to: 'a4' | 'b4') => moves.find((candidate) =>
      candidate.from === transformSquare('b5', transform) &&
      candidate.to === transformSquare(to, transform))!.san
    const onWall = scoreTwoBishopsWhiteMove(transformedFen, move('b4'))
    const outside = scoreTwoBishopsWhiteMove(transformedFen, move('a4'))
    for (const score of [onWall, outside]) {
      assert.equal(score.ruleR10DiagonalCount, 8, transform.name)
      assert.deepEqual(score.ruleR10TargetSquares, score === onWall ? [] : [transformSquare('a3', transform)])
    }
    assert.equal(onWall.ruleR10KingDistance, 99, transform.name)
    assert.equal(outside.ruleR10KingDistance, 1, transform.name)
    assert.ok(compareScoresByRules(outside, onWall, [r10]) < 0, transform.name)
    assert.ok(compareScoresByRules(onWall, outside, [r25]) < 0, transform.name)
    assert.deepEqual(onWall.ruleR9TargetSquares, [transformSquare('b4', transform)], transform.name)
    assert.equal(onWall.ruleR9Penalty, 0, transform.name)
    assert.equal(outside.ruleR9Penalty, 1, transform.name)
    assert.equal(twoBishopsWhiteRules.find((rule) =>
      compareScoresByRules(onWall, outside, [rule]) !== 0)?.id, 'rule r9', transform.name)
    assert.deepEqual(getIdealTwoBishopsWhiteMoves(transformedFen), [move('b4')], transform.name)
  }
})

test('rule r19 requires three king steps from Black when White is adjacent to the outer wall', () => {
  const fen = '8/8/8/3k4/8/8/3KBB2/8 w - - 2 2'
  const r19 = twoBishopsWhiteRules.find(({ id }) => id === 'rule r19')!
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const qualifying = getChess(transformedFen)
      .moves({ verbose: true })
      .find(
        (candidate) =>
          candidate.from === transformSquare('d2', transform) &&
          candidate.to === transformSquare('c3', transform),
      )?.san
    const rejected = getChess(transformedFen)
      .moves({ verbose: true })
      .find(
        (candidate) =>
          candidate.from === transformSquare('e2', transform) &&
          candidate.to === transformSquare('d3', transform),
      )?.san
    assert.ok(qualifying, `qualifying ${transform.name}`)
    assert.ok(rejected, `rejected ${transform.name}`)
    const qualifyingScore = scoreTwoBishopsWhiteMove(transformedFen, qualifying)
    const rejectedScore = scoreTwoBishopsWhiteMove(transformedFen, rejected)
    assert.equal(qualifyingScore.ruleR19Applies, true, transform.name)
    assert.equal(rejectedScore.ruleR19Applies, true, transform.name)
    assert.equal(
      qualifyingScore.ruleR19Penalty,
      0,
      `qualifying ${transform.name}`,
    )
    assert.equal(
      rejectedScore.ruleR19Penalty,
      1,
      `rejected ${transform.name}`,
    )
    assert.ok(compareScoresByRules(qualifyingScore, rejectedScore, [r19]) < 0, transform.name)
  }
})
