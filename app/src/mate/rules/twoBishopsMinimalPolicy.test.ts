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
  'rule r3',
  'rule r4',
  'rule r5',
  'rule r6',
  'rule r8',
  'rule r10',
  'rule r11',
  'rule r12',
  'rule r18.5',
  'rule r19',
  'rule r22',
  'rule r25',
  'rule r30',
]

test('Two Bishops exposes only the simplified experiment policy', () => {
  assert.deepEqual(
    twoBishopsWhiteRules.map(({ id }) => id),
    ACTIVE_RULE_IDS,
  )
  assert.deepEqual(twoBishopsRuleSet.help.notes, [
    "The target square is an outer-wall square adjacent to Black's king. All such squares are candidates. If any candidate is occupied by a bishop, that wall has no target. White's king must be outside the wall or on the target square.",
    'Phase 2 is recognized when rule r4 matches an established mating-pattern geometry: either the exact Phase 2 template or a bishop move that forces Black from the edge into its associated corner, under rotation or reflection.',
  ])
  assert.deepEqual(
    twoBishopsRuleSet.help.noteBoards.map(({ id }) => id),
    ['two-bishops-target-square', 'two-bishops-phase-two', 'two-bishops-rule-r18.5'],
  )
  assert.equal(twoBishopsRuleSet.help.noteBoards[0]?.noteIndex, 0)
  assert.equal(
    twoBishopsWhiteRules.find(({ id }) => id === 'rule r4')?.helpText,
    'Phase 2: Execute the mating pattern.',
  )
  assert.equal(
    twoBishopsWhiteRules.find(({ id }) => id === 'rule r5')?.helpText,
    'Prefer bishops on adjacent squares on their Phase 2 diagonals, enclosing Black on 2 edge squares, then prefer the White king on the Phase 2 square in line with those bishops.',
  )
  assert.equal(
    twoBishopsWhiteRules.find(({ id }) => id === 'rule r6')?.helpText,
    "Prefer bishops on their Phase 2 diagonals, then prefer Bishops on their Phase 2 squares, then prefer the shortest king path to its Phase 2 square without entering Black's area, then Euclidean proximity.",
  )
  assert.equal(
    twoBishopsWhiteRules.find(({ id }) => id === 'rule r3')?.helpText,
    "Prefer White's king out of the corner.",
  )
  assert.equal(
    twoBishopsWhiteRules.find(({ id }) => id === 'rule r8')?.helpText,
    "With Black's king in the corner, prefer White's king on a Phase 2 square associated with that corner.",
  )
  assert.equal(
    twoBishopsWhiteRules.find(({ id }) => id === 'rule r18.5')?.helpText,
    "Prefer bishops off the target corner's edge, except the Phase 2 diagonals.",
  )
  assert.equal(
    twoBishopsWhiteRules.find(({ id }) => id === 'rule r10')?.helpText,
    "Prefer fewer diagonals for Black's king, then Black's king further from the inner wall, then White king's step proximity to the target square.",
  )
  assert.equal(
    twoBishopsWhiteRules.find(({ id }) => id === 'rule r12')?.helpText,
    "Without a target square, prefer White’s king closer to the diagonal one beyond the outer wall.",
  )
  assert.equal(
    twoBishopsWhiteRules.find(({ id }) => id === 'rule r19')?.helpText,
    "Prefer the outer bishop at least 3 steps away from Black's king.",
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
    const alternative = (from: 'e8' | 'f8', to: 'd7' | 'e7') => chess.moves({ verbose: true }).find(
      (move) => move.from === transformSquare(from, transform) &&
        move.to === transformSquare(to, transform),
    )!.san
    assert.equal(scoreTwoBishopsWhiteMove(chess.fen(), alternative('e8', 'd7')).ruleR4Penalty,
      0, transform.name)
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
      preferred: 'Kd2',
      rejected: 'Ke4',
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
  const fen = '8/8/8/8/8/8/3BK1k1/3B4 w - - 2 2'
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

test("rule r8 associates each Phase 2 king square with Black's actual corner", () => {
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
        .ruleR8KingSquarePenalty,
      0,
      transform.name,
    )
    assert.equal(
      scoreTwoBishopsWhiteMove(transformedWrongFen, wrongMove)
        .ruleR8KingSquarePenalty,
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

test('rule r10 counts the wider escape after Bd8+ symmetrically', () => {
  const fen = '8/2BB4/8/3K2k1/8/8/8/8 w - - 0 1'
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
    assert.equal(score.ruleR10DiagonalCount, 9, transform.name)
    const preferred = chess.moves({ verbose: true }).find(
      (candidate) =>
        candidate.from === transformSquare('d5', transform) &&
        candidate.to === transformSquare('e4', transform),
    )?.san
    assert.ok(preferred, transform.name)
    assert.deepEqual(
      getIdealTwoBishopsWhiteMoves(transformedFen),
      [preferred],
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

test('rule r10 rejects the Kh6 inner wall after Bd2 and uses the other orientation', () => {
  const fen = '8/8/8/7k/8/2B1K3/2B5/8 w - - 2 2'
  const rule = twoBishopsWhiteRules.find(({ id }) => id === 'rule r10')!
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const chess = getChess(transformedFen)
    const moves = chess.moves({ verbose: true })
    const move = (from: 'c3' | 'e3', to: 'd2' | 'd4') => moves.find(
      (candidate) => candidate.from === transformSquare(from, transform) &&
        candidate.to === transformSquare(to, transform),
    )!.san
    const bishopMove = move('c3', 'd2')
    const bishop = scoreTwoBishopsWhiteMove(transformedFen, bishopMove)
    const king = scoreTwoBishopsWhiteMove(transformedFen, move('e3', 'd4'))
    assert.equal(bishop.ruleR10DiagonalCount, 10, transform.name)
    assert.equal(king.ruleR10DiagonalCount, 6, transform.name)
    assert.ok(compareScoresByRules(king, bishop, [rule]) < 0, transform.name)
    chess.move(bishopMove)
    assert.ok(chess.moves({ verbose: true }).some(
      (reply) => reply.to === transformSquare('h6', transform)), transform.name)
  }
})

test('rule r10 requires an unreachable inner wall and prefers Kc3 over Ba5 symmetrically', () => {
  const fen = '8/8/BB6/8/1K6/8/8/3k4 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const chess = getChess(transformedFen)
    const moves = chess.moves({ verbose: true })
    const move = (from: 'b6' | 'b4', to: 'a5' | 'c3' | 'c5') => moves.find(
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
    assert.deepEqual(getIdealTwoBishopsWhiteMoves(transformedFen), [move('b4', 'c5')], transform.name)
  }
})

test('rule r10 counts reply sides separately even when White screens the bishop wall', () => {
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
    assert.equal(screened.ruleR10TargetPenalty, 1, transform.name)
    assert.equal(intact.ruleR10TargetPenalty, 1, transform.name)
    assert.equal(screened.ruleR10DiagonalCount, 4, transform.name)
    assert.equal(intact.ruleR10DiagonalCount, 4, transform.name)
    assert.equal(compareScoresByRules(screened, intact, [rule]), 0, transform.name)
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

test('rule r18.5 only penalizes the target corner edges outside its Phase 2 diagonals', () => {
  assert.equal(
    scoreTwoBishopsWhiteMove('8/8/8/8/4K3/6k1/3B4/3B4 w - - 12 7', 'Kd4')
      .ruleR18Point5EdgePenalty,
    0,
  )
  const fen = 'K7/8/8/5B2/3B4/8/8/7k w - - 0 1'
  const interior = scoreTwoBishopsWhiteMove(fen, 'Bg6')
  const edge = scoreTwoBishopsWhiteMove(fen, 'Bb1')
  assert.equal(interior.ruleR18Point5EdgePenalty, 0)
  assert.equal(edge.ruleR18Point5EdgePenalty, 1)
  assert.ok(compareTwoBishopsWhiteScores(interior, edge) < 0)

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
    assert.equal(
      scoreTwoBishopsWhiteMove(transformedFen, move).ruleR18Point5EdgePenalty,
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
          .ruleR18Point5EdgePenalty,
        penalty,
        transform.name,
      )
    }
  }
})

test('rule r10 finds the target on the resulting outer wall', () => {
  const fen = '8/8/8/8/4K3/6k1/3B4/3B4 w - - 0 1'
  const unchangedWall = scoreTwoBishopsWhiteMove(fen, 'Be3')
  const changedWall = scoreTwoBishopsWhiteMove(fen, 'Bc2')
  assert.equal(unchangedWall.ruleR10TargetPenalty, 0)
  assert.equal(unchangedWall.ruleR10DiagonalCount, 4)
  assert.deepEqual(unchangedWall.ruleR10TargetSquares, ['f4'])
  assert.equal(unchangedWall.ruleR10KingDistance, 1)
  assert.equal(changedWall.ruleR10TargetPenalty, 1)
  // Screening the bishop does not make any immediate reply exceed five diagonals.
  assert.equal(changedWall.ruleR10DiagonalCount, 5)
  assert.deepEqual(changedWall.ruleR10TargetSquares, [])
  assert.equal(changedWall.ruleR10KingDistance, 99)
})

test('rule r10 has no target when the adjacent candidate holds a bishop', () => {
  const fen = '8/8/8/8/4K3/6k1/3B4/3B4 w - - 0 1'
  const blocked = scoreTwoBishopsWhiteMove(fen, 'Bf4+')
  assert.equal(blocked.ruleR10TargetPenalty, 1)
  assert.equal(blocked.ruleR10DiagonalCount, 4)
  assert.deepEqual(blocked.ruleR10TargetSquares, [])
  assert.equal(blocked.ruleR10KingDistance, 99)
  assert.equal(
    scoreTwoBishopsWhiteMove(fen, 'Bg5').ruleR10TargetPenalty,
    0,
  )
})

test('rule r10 retains every adjacent outer-wall candidate and invalidates an occupied set', () => {
  for (const occupied of [false, true]) {
    const fen = occupied
      ? '8/8/6K1/8/8/4Bk2/2B5/8 w - - 0 1'
      : '8/8/6K1/8/8/5k2/2BB4/8 w - - 0 1'
    for (const transform of SQUARE_TRANSFORMS) {
      const transformedFen = transformFen(fen, transform)
      const move = getChess(transformedFen).moves({ verbose: true }).find(
        (candidate) => candidate.from === transformSquare('c2', transform) &&
          candidate.to === transformSquare('d1', transform),
      )!.san
      const score = scoreTwoBishopsWhiteMove(transformedFen, move)
      assert.equal(score.ruleR10TargetPenalty, occupied ? 1 : 0, transform.name)
      assert.deepEqual([...score.ruleR10TargetSquares].sort(), occupied ? [] :
        (['e3', 'f4'] as const).map((square) => transformSquare(square, transform)).sort(),
        transform.name)
      for (const target of score.ruleR10TargetSquares) {
        assert.equal(kingDistance(transformSquare('f3', transform), target), 1)
      }
    }
  }
})

test('rule r10 has no target on a distant wall even when White stands on it', () => {
  const fen = '8/8/8/8/5K2/8/3B4/3B3k w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    for (const to of ['e3', 'g5'] as const) {
      const move = getChess(transformedFen).moves({ verbose: true }).find(
        (candidate) => candidate.from === transformSquare('f4', transform) &&
          candidate.to === transformSquare(to, transform),
      )?.san
      assert.ok(move, transform.name)
      const score = scoreTwoBishopsWhiteMove(transformedFen, move)
      assert.equal(score.ruleR10TargetPenalty, 1, transform.name)
      assert.deepEqual(score.ruleR10TargetSquares, [], transform.name)
    }
  }
})

test('rule r10 rejects a target when White is inside the wall', () => {
  const score = scoreTwoBishopsWhiteMove(
    '8/8/8/8/5K2/7k/3BB3/8 w - - 0 1',
    'Kf3',
  )
  assert.equal(score.ruleR10TargetPenalty, 1)
  assert.deepEqual(score.ruleR10TargetSquares, [])
  assert.equal(score.ruleR10KingDistance, 99)
})

test('rule r10 requires the king to stand outside or on a Black-adjacent target', () => {
  const fen = '8/5k2/8/3K4/1B6/1B6/8/8 w - - 0 1'
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Kc6+'])
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
    assert.equal(onTarget.ruleR10TargetPenalty, 1, transform.name)
    assert.equal(onTarget.ruleR10DiagonalCount, 9, transform.name)
    assert.deepEqual(
      onTarget.ruleR10TargetSquares,
      [],
      transform.name,
    )
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
    const narrowerMove = getChess(transformedFen)
      .moves({ verbose: true })
      .find((candidate) =>
        candidate.from === transformSquare('b4', transform) &&
        candidate.to === transformSquare('c3', transform),
      )!.san
    const narrower = scoreTwoBishopsWhiteMove(transformedFen, narrowerMove)
    assert.equal(narrower.ruleR10TargetPenalty, 1, transform.name)
    assert.equal(narrower.ruleR10DiagonalCount, 10, transform.name)
    assert.deepEqual(
      getIdealTwoBishopsWhiteMoves(transformedFen),
      [outsideMove],
      transform.name,
    )
    assert.deepEqual(
      [...outside.ruleR10TargetSquares].sort(),
      (['e7', 'f8'] as const).map((square) => transformSquare(square, transform)).sort(),
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

test('rule r10 orders fewer diagonals before White king steps even without a target', () => {
  const rule = twoBishopsWhiteRules.find(({ id }) => id === 'rule r10')!
  const cases = [
    {
      fen: '8/8/8/8/4K3/6k1/3B4/3B4 w - - 0 1',
      preferred: 'Bf4+',
      rejected: 'Bc2',
      preferredScore: [1, 4, 99],
      rejectedScore: [1, 5, 99],
    },
    {
      fen: '8/8/8/8/4K3/6k1/3B4/3B4 w - - 0 1',
      preferred: 'Be3',
      rejected: 'Bc2',
      preferredScore: [0, 4, 1],
      rejectedScore: [1, 5, 99],
    },
    {
      fen: '8/8/8/8/4K3/6k1/3B4/3B4 w - - 0 1',
      preferred: 'Ke5',
      rejected: 'Kd5',
      preferredScore: [0, 4, 1],
      rejectedScore: [0, 4, 2],
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
    assert.ok(compareScoresByRules(first, second, [rule]) < 0, preferred)
    assert.ok(compareScoresByRules(second, first, [rule]) > 0, rejected)
  }
})

test('rule r12 approaches the h1 wall but r10 counts the reachable outer diagonal', () => {
  const fen = '8/7k/8/5K2/8/8/BB6/8 w - - 0 1'
  const rule = twoBishopsWhiteRules.find(({ id }) => id === 'rule r12')!
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const moves = getChess(transformedFen).moves({ verbose: true })
    const move = (from: 'a2' | 'b2' | 'f5', to: 'b3' | 'e6' | 'f6' | 'b1') => moves.find(
      (candidate) => candidate.from === transformSquare(from, transform) &&
        candidate.to === transformSquare(to, transform),
    )!.san
    const bishop = scoreTwoBishopsWhiteMove(transformedFen, move('a2', 'b3'))
    const king = scoreTwoBishopsWhiteMove(transformedFen, move('f5', 'e6'))
    assert.equal(bishop.ruleR10TargetPenalty, 1, transform.name)
    assert.equal(king.ruleR10TargetPenalty, 1, transform.name)
    assert.equal(bishop.ruleR10DiagonalCount, 7, transform.name)
    assert.equal(king.ruleR10DiagonalCount, 8, transform.name)
    assert.equal(bishop.ruleR12KingDistance, 2, transform.name)
    assert.equal(king.ruleR12KingDistance, 1, transform.name)
    assert.ok(compareScoresByRules(king, bishop, [rule]) < 0, transform.name)
    const result = getChess(transformedFen)
    result.move(move('f5', 'e6'))
    assert.ok(result.moves({ verbose: true }).some(
      (reply) => reply.to === transformSquare('g8', transform)), transform.name)
    assert.deepEqual(getIdealTwoBishopsWhiteMoves(transformedFen),
      [move('b2', 'f6')], transform.name)
    const farther = scoreTwoBishopsWhiteMove(transformedFen, move('b2', 'f6'))
    const nearer = scoreTwoBishopsWhiteMove(transformedFen, move('a2', 'b1'))
    assert.equal(farther.ruleR10DiagonalCount, nearer.ruleR10DiagonalCount)
    assert.equal(farther.ruleR10BlackInnerWallDistance, 1)
    assert.equal(nearer.ruleR10BlackInnerWallDistance, 0)
    assert.ok(compareScoresByRules(farther, nearer,
      [twoBishopsWhiteRules.find(({ id }) => id === 'rule r10')!]) < 0)
  }
})

test('rule r10 prefers fewer diagonals before the r12 beyond-wall distance', () => {
  const fen = '8/8/7k/8/8/4K3/2BB4/8 w - - 0 1'
  const rule = twoBishopsWhiteRules.find(({ id }) => id === 'rule r12')!
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const moves = getChess(transformedFen).moves({ verbose: true })
    const move = (from: 'e3' | 'd2', to: 'e4' | 'd4' | 'c3') => moves.find(
      (candidate) => candidate.from === transformSquare(from, transform) &&
        candidate.to === transformSquare(to, transform),
    )!.san
    const king = scoreTwoBishopsWhiteMove(transformedFen, move('e3', 'e4'))
    const bishop = scoreTwoBishopsWhiteMove(transformedFen, move('d2', 'c3'))
    assert.equal(king.ruleR12KingDistance, 1, transform.name)
    assert.equal(bishop.ruleR12KingDistance, 2, transform.name)
    assert.equal(king.ruleR10DiagonalCount, 9, transform.name)
    assert.equal(bishop.ruleR10DiagonalCount, 6, transform.name)
    assert.ok(compareScoresByRules(king, bishop, [rule]) < 0, transform.name)
    assert.ok(compareTwoBishopsWhiteScores(bishop, king) < 0, transform.name)
    const target = scoreTwoBishopsWhiteMove(transformedFen, move('e3', 'd4'))
    assert.equal(rule.applies?.(target), false, transform.name)
    assert.deepEqual(getIdealTwoBishopsWhiteMoves(transformedFen),
      [move('d2', 'c3')], transform.name)
  }
})

test('adjacent targets remove Ke5 preference, leaving Kd5 ahead of Bg3 under r12', () => {
  const fen = '8/6k1/3K4/8/8/7B/7B/8 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const moves = getChess(transformedFen).moves({ verbose: true })
    const move = (from: 'd6' | 'h2', to: 'e5' | 'e6' | 'd5' | 'g3') => moves.find(
      (candidate) => candidate.from === transformSquare(from, transform) &&
        candidate.to === transformSquare(to, transform),
    )!.san
    const bishop = scoreTwoBishopsWhiteMove(transformedFen, move('h2', 'g3'))
    assert.equal(bishop.ruleR18Point5EdgePenalty, 0, transform.name)
    for (const to of ['e5', 'e6'] as const) {
      const king = scoreTwoBishopsWhiteMove(transformedFen, move('d6', to))
      assert.deepEqual(king.ruleR10TargetSquares, [], transform.name)
      assert.equal(king.ruleR12KingDistance, 1, transform.name)
      assert.equal(king.ruleR10DiagonalCount, bishop.ruleR10DiagonalCount, transform.name)
      assert.ok(compareTwoBishopsWhiteScores(bishop, king) < 0, transform.name)
    }
    const best = move('d6', 'd5')
    assert.equal(scoreTwoBishopsWhiteMove(transformedFen, best).ruleR12KingDistance, 0,
      transform.name)
    assert.deepEqual(getIdealTwoBishopsWhiteMoves(transformedFen), [best], transform.name)
  }
})

test('rule r12 is inactive with a target or without an eligible outer wall', () => {
  const rule = twoBishopsWhiteRules.find(({ id }) => id === 'rule r12')!
  const withTarget = scoreTwoBishopsWhiteMove('3k4/8/8/4B3/5K2/7B/8/8 w - - 0 1', 'Ke4')
  const noWall = scoreTwoBishopsWhiteMove('8/8/8/8/5K2/7k/3B1B2/8 w - - 0 1', 'Kf5')
  assert.equal(rule.applies?.(withTarget), false)
  assert.equal(rule.applies?.(noWall), false)
})

test('rule r19 requires the outer bishop to remain three king steps from Black', () => {
  const fen = '8/8/8/3k4/8/8/3KBB2/8 w - - 2 2'
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
    assert.equal(
      scoreTwoBishopsWhiteMove(transformedFen, qualifying).ruleR19Penalty,
      0,
      `qualifying ${transform.name}`,
    )
    assert.equal(
      scoreTwoBishopsWhiteMove(transformedFen, rejected).ruleR19Penalty,
      1,
      `rejected ${transform.name}`,
    )
  }
})

test('rule r22 chooses Be5 by straight-line distance and excludes a square closer to Black', () => {
  const fen = '2k2K2/8/8/8/8/6B1/6B1/8 w - - 0 1'
  const rule = twoBishopsWhiteRules.find(({ id }) => id === 'rule r22')!
  assert.equal(rule.helpText,
    "If the White king is inside Black's diagonals, place the inner bishop on the non-edge wall diagonal square closest to White's king but not closer to Black's king. Then, walk the king behind that bishop.")
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const chess = getChess(transformedFen)
    const move = (from: 'g3' | 'f8', to: 'e5' | 'd6' | 'f4' | 'f7') =>
      chess.moves({ verbose: true }).find(
        (candidate) => candidate.from === transformSquare(from, transform) &&
          candidate.to === transformSquare(to, transform),
      )!.san
    const preferred = move('g3', 'e5')
    const score = scoreTwoBishopsWhiteMove(transformedFen, preferred)
    assert.equal(score.ruleR22Applies, true, transform.name)
    assert.equal(score.ruleR22BishopPenalty, 0, transform.name)
    assert.deepEqual(getIdealTwoBishopsWhiteMoves(transformedFen), [preferred], transform.name)
    for (const [from, to] of [['g3', 'd6'], ['g3', 'f4'], ['f8', 'f7']] as const) {
      const other = scoreTwoBishopsWhiteMove(transformedFen, move(from, to))
      assert.equal(other.ruleR22BishopPenalty, 1, transform.name)
      assert.ok(compareScoresByRules(score, other, [rule]) < 0, transform.name)
    }
  }
})

test('rule r22 walks behind Be5 to f5 inside Black area and farther from Black', () => {
  const fen = '8/4k3/8/4B3/5K2/8/6B1/8 w - - 0 1'
  const rule = twoBishopsWhiteRules.find(({ id }) => id === 'rule r22')!
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const chess = getChess(transformedFen)
    const move = (to: 'f5' | 'e4' | 'g4') => chess.moves({ verbose: true }).find(
      (candidate) => candidate.from === transformSquare('f4', transform) &&
        candidate.to === transformSquare(to, transform),
    )!.san
    const score = scoreTwoBishopsWhiteMove(transformedFen, move('f5'))
    assert.equal(score.ruleR22Applies, true, transform.name)
    assert.equal(score.ruleR22BishopPenalty, 0, transform.name)
    assert.equal(score.ruleR22KingDistance, 0, transform.name)
    for (const to of ['e4', 'g4'] as const) {
      const other = scoreTwoBishopsWhiteMove(transformedFen, move(to))
      assert.equal(other.ruleR22KingDistance, 1, transform.name)
      assert.ok(compareScoresByRules(score, other, [rule]) < 0, transform.name)
    }
  }
})

test('rule r22 is inactive outside the smallest wall or without adjacent walls', () => {
  for (const [fen, move] of [
    ['2B5/2B5/5k2/8/1K6/8/8/8 w - - 0 1', 'Ka4'],
    ['7k/8/8/8/8/2B2B2/8/K7 w - - 0 1', 'Ka2'],
  ]) {
    const score = scoreTwoBishopsWhiteMove(fen!, move!)
    assert.equal(score.ruleR22Applies, false)
    assert.equal(score.ruleR22BishopPenalty, 0)
    assert.equal(score.ruleR22KingDistance, 0)
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


test('rule r10 selects the farther inner wall before target proximity and releases the king loop symmetrically', () => {
  const fen = '8/4k3/8/3BB3/3K4/8/8/8 w - - 0 1'
  const r10 = twoBishopsWhiteRules.find(({ id }) => id === 'rule r10')!
  const r12 = twoBishopsWhiteRules.find(({ id }) => id === 'rule r12')!
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const moves = getChess(transformedFen).moves({ verbose: true })
    const san = (from: 'd4' | 'd5', to: 'c5' | 'e4' | 'g2') => moves.find(
      (move) => move.from === transformSquare(from, transform) &&
        move.to === transformSquare(to, transform),
    )!.san
    const progress = scoreTwoBishopsWhiteMove(transformedFen, san('d4', 'c5'))
    const loop = scoreTwoBishopsWhiteMove(transformedFen, san('d4', 'e4'))
    for (const score of [progress, loop]) {
      assert.equal(score.ruleR10DiagonalCount, 6, transform.name)
      assert.equal(score.ruleR10BlackInnerWallDistance, 2, transform.name)
      assert.deepEqual(score.ruleR10TargetSquares, [], transform.name)
    }
    assert.equal(compareScoresByRules(progress, loop, [r10]), 0, transform.name)
    assert.equal(progress.ruleR12KingDistance, 0, transform.name)
    assert.equal(loop.ruleR12KingDistance, 1, transform.name)
    assert.ok(compareScoresByRules(progress, loop, [r12]) < 0, transform.name)
    // Bg2 shares the preferred wall and wins later under bishop safety spacing.
    assert.deepEqual(getIdealTwoBishopsWhiteMoves(transformedFen),
      [san('d5', 'g2')], transform.name)
  }
})


test('rule r11 plays the flank step across both board halves under every symmetry', () => {
  const starts = [
    { fen: '8/8/8/2B5/k1BK4/8/8/8 w - - 0 1', from: 'd4', to: 'c3' },
    { fen: '8/8/8/3B4/1k1BK3/8/8/8 w - - 0 1', from: 'e4', to: 'd3' },
  ] as const
  const r11 = twoBishopsWhiteRules.find(({ id }) => id === 'rule r11')!
  assert.match(r11.helpText, /^Play the flank step\./)
  for (const { fen, from, to } of starts) {
    for (const transform of SQUARE_TRANSFORMS) {
      const transformedFen = transformFen(fen, transform)
      const moves = getChess(transformedFen).moves({ verbose: true })
      const flank = moves.find((move) =>
        move.from === transformSquare(from, transform) &&
        move.to === transformSquare(to, transform))!.san
      const score = scoreTwoBishopsWhiteMove(transformedFen, flank)
      assert.equal(score.ruleR11Applies, true, transform.name)
      assert.equal(score.ruleR11Penalty, 0, transform.name)
      for (const move of moves.filter(({ san }) => san !== flank)) {
        const other = scoreTwoBishopsWhiteMove(transformedFen, move.san)
        assert.ok(compareScoresByRules(score, other, [r11]) < 0, transform.name)
      }
      if (from === 'd4') {
        assert.deepEqual(getIdealTwoBishopsWhiteMoves(transformedFen), [flank], transform.name)
      }
    }
  }
})

test('rule r11 stays inactive unless every flank-step condition holds', () => {
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
        assert.equal(score.ruleR11Applies, false, `${name}: ${transform.name}`)
        assert.equal(score.ruleR11Penalty, 0, `${name}: ${transform.name}`)
      }
    }
  }
})
