import assert from 'node:assert/strict'
import test from 'node:test'
import {
  SQUARE_TRANSFORMS,
  getChess,
  transformFen,
  transformSquare,
} from '../chess'
import {
  analyzeTwoBishopsWhiteSelection,
  compareTwoBishopsWhiteScores,
  getAdjacentDiagonalWallTargetCorners,
  getIdealTwoBishopsWhiteMoves,
  isTwoBishopsPhaseTwoPosition,
  scoreTwoBishopsWhiteMove,
  twoBishopsRuleSet,
  twoBishopsWhiteRules,
} from './twoBishops'

const ACTIVE_RULE_IDS = [
  'mate',
  'bishops safe',
  'no stalemate',
  'rule r4',
  'rule r5',
  'rule r6',
  'rule r9',
  'rule r10',
  'rule r12',
  'rule r17',
  'rule r19',
  'rule r20',
  'rule r25',
  'rule r30',
]

test('Two Bishops exposes only the simplified experiment policy', () => {
  assert.deepEqual(
    twoBishopsWhiteRules.map(({ id }) => id),
    ACTIVE_RULE_IDS,
  )
  assert.deepEqual(twoBishopsRuleSet.help.notes, [
    'Phase 2 is recognized when rule r4 matches: the bishops occupy their Phase 2 diagonals, White occupies its Phase 2 square, and Black occupies one of the four edge squares in the corner cage, under rotation or reflection.',
  ])
  assert.deepEqual(
    twoBishopsRuleSet.help.noteBoards.map(({ id }) => id),
    ['two-bishops-phase-two', 'two-bishops-rule-r12'],
  )
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
    "With bishops on their Phase 2 diagonals, then prefer Bishops on their Phase 2 squares, then prefer king proximity to its Phase 2 square, without entering Black's area.",
  )
  assert.equal(
    twoBishopsWhiteRules.find(({ id }) => id === 'rule r9')?.helpText,
    "If White's king is inside the smallest adjacent diagonals that enclose Black, unless they are phase 2 diagonals, walk the king toward the inside square edge-adjacent to the inner bishop and farther from Black's king. Then place the outer bishop in line with the other two pieces, then walk the king through the wall to the side opposite Black's king.",
  )
  assert.equal(
    twoBishopsWhiteRules.find(({ id }) => id === 'rule r10')?.helpText,
    'Prefer controlling adjacent diagonals leaving Black as few diagonals as possible within its corner, but at least 4.',
  )
  assert.equal(
    twoBishopsWhiteRules.find(({ id }) => id === 'rule r12')?.helpText,
    "Prefer bishops off the target corner's edge, except the Phase 2 diagonal.",
  )
  assert.equal(
    twoBishopsWhiteRules.find(({ id }) => id === 'rule r17')?.helpText,
    'Prefer king proximity to the diagonal one beyond the outer wall.',
  )
  assert.equal(
    twoBishopsWhiteRules.find(({ id }) => id === 'rule r19')?.helpText,
    'Prefer a shrinkable wall.',
  )
  assert.equal(
    twoBishopsWhiteRules.find(({ id }) => id === 'rule r20')?.helpText,
    'Prefer adjacent bishops.',
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

test('rule r5 does not override r19 before the two-edge cage exists', () => {
  const fen = '8/8/8/8/3K2k1/8/2BB4/8 w - - 2 2'
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const from = transformSquare('d4', transform)
    const to = transformSquare('e5', transform)
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

test('rule r6 ignores king proximity until both Phase 2 diagonals are occupied', () => {
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
      assert.equal(score.ruleR6KingAreaPenalty, 0, transform.name)
      assert.equal(score.ruleR6KingDistance, 0, transform.name)
    }
  }
})

test('rule r6 is inactive until both Phase 2 diagonals are occupied', () => {
  const fen = '4k3/8/8/8/8/4B3/4K3/3B4 w - - 2 2'
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const scores = getChess(transformedFen)
      .moves()
      .map((move) => scoreTwoBishopsWhiteMove(transformedFen, move))
    assert.ok(
      scores.every((score) => !score.ruleR6Applies),
      transform.name,
    )
    assert.equal(
      analyzeTwoBishopsWhiteSelection(transformedFen).ruleFilterCounts[
        'rule r6'
      ],
      0,
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

test('rule r9 walks the king to staging before aligning the outer bishop', () => {
  const fen = '8/8/8/1k6/8/4B3/2K3B1/8 w - - 0 1'
  assert.ok(
    scoreTwoBishopsWhiteMove(fen, 'Kd2').ruleR9Penalty <
      scoreTwoBishopsWhiteMove(fen, 'Kb3').ruleR9Penalty,
  )
})

test('rule r9 stays neutral on Phase 2 diagonals', () => {
  const fen = '8/8/8/8/5K2/8/3B2k1/3B4 w - - 0 1'
  const scores = getChess(fen)
    .moves()
    .map((move) => scoreTwoBishopsWhiteMove(fen, move).ruleR9Penalty)
  assert.deepEqual([...new Set(scores)], [0])
})

test('rule r9 remains active when nominal Phase 2 diagonals do not enclose Black', () => {
  const fen = '8/8/7k/8/2B1K3/2B5/8/8 w - - 2 2'
  const analysis = analyzeTwoBishopsWhiteSelection(fen)
  assert.ok(analysis.ruleFilterCounts['rule r9'] > 0)
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
    assert.ok(move, transform.name)
    assert.deepEqual(
      getIdealTwoBishopsWhiteMoves(transformedFen),
      [move],
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
  assert.equal(score.ruleR10Penalty, 0)
  assert.equal(score.ruleR10DiagonalCount, 6)
})

test('rule r12 only penalizes the target corner edges outside its Phase 2 diagonal', () => {
  assert.equal(
    scoreTwoBishopsWhiteMove('8/8/8/8/4K3/6k1/3B4/3B4 w - - 12 7', 'Kd4')
      .ruleR12EdgePenalty,
    0,
  )
  const fen = 'K7/8/8/5B2/3B4/8/8/7k w - - 0 1'
  const interior = scoreTwoBishopsWhiteMove(fen, 'Bg6')
  const edge = scoreTwoBishopsWhiteMove(fen, 'Bb1')
  assert.equal(interior.ruleR12EdgePenalty, 0)
  assert.equal(edge.ruleR12EdgePenalty, 1)
  assert.ok(compareTwoBishopsWhiteScores(interior, edge) < 0)

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
          .ruleR12EdgePenalty,
        penalty,
        transform.name,
      )
    }
  }
})

test('rule r17 prefers the king nearer the diagonal beyond the outer wall', () => {
  const fen = '8/8/8/8/5K2/7k/3BB3/8 w - - 0 1'
  const nearer = scoreTwoBishopsWhiteMove(fen, 'Kf5')
  const farther = scoreTwoBishopsWhiteMove(fen, 'Kf3')
  assert.ok(nearer.ruleR17KingDistance < farther.ruleR17KingDistance)
})

test('rule r19 recognizes both safe checking wall shrinks symmetrically', () => {
  const fen = '8/8/8/4K3/8/3B1k2/3B4/8 w - - 2 2'
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    for (const target of ['g6', 'c2'] as const) {
      const move = getChess(transformedFen)
        .moves({ verbose: true })
        .find(
          (candidate) =>
            candidate.from === transformSquare('d3', transform) &&
            candidate.to === transformSquare(target, transform),
        )?.san
      assert.ok(move, `${target} ${transform.name}`)
      assert.equal(
        scoreTwoBishopsWhiteMove(transformedFen, move).ruleR19Penalty,
        0,
        `${target} ${transform.name}`,
      )
    }
    assert.ok(
      analyzeTwoBishopsWhiteSelection(transformedFen).ruleFilterCounts[
        'rule r19'
      ] > 0,
      transform.name,
    )
  }
})

test('rule r19 uses the inner-bishop waiting preparation symmetrically', () => {
  const fen = '8/8/8/8/3K4/8/2BBk3/8 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const expected = getChess(transformedFen)
      .moves({ verbose: true })
      .find(
        (candidate) =>
          candidate.from === transformSquare('d2', transform) &&
          candidate.to === transformSquare('g5', transform),
      )?.san
    assert.ok(expected, transform.name)
    assert.deepEqual(
      analyzeTwoBishopsWhiteSelection(transformedFen).idealWhiteMoves,
      [expected],
      transform.name,
    )
  }
})

test('rule r19 makes Bg6 the shrink preparation symmetrically', () => {
  const fen = '8/8/8/8/2K5/8/1BBk4/8 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const expected = getChess(transformedFen)
      .moves({ verbose: true })
      .find(
        (candidate) =>
          candidate.from === transformSquare('c2', transform) &&
          candidate.to === transformSquare('g6', transform),
      )?.san
    assert.ok(expected, transform.name)
    assert.deepEqual(
      analyzeTwoBishopsWhiteSelection(transformedFen).idealWhiteMoves,
      [expected],
      transform.name,
    )
  }
})

test('rule r19 translates the Bg6 preparation geometry symmetrically', () => {
  const fen = '1B6/1B1K4/1k6/8/8/8/8/8 w - - 2 2'
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const expected = getChess(transformedFen)
      .moves({ verbose: true })
      .find(
        (candidate) =>
          candidate.from === transformSquare('b7', transform) &&
          candidate.to === transformSquare('f3', transform),
      )?.san
    assert.ok(expected, transform.name)
    assert.deepEqual(
      analyzeTwoBishopsWhiteSelection(transformedFen).idealWhiteMoves,
      [expected],
      transform.name,
    )
  }
})

test('an available r19 shrink is executed instead of restarting r5 preparation', () => {
  const fen = '8/8/8/4K3/6k1/8/2BB4/8 w - - 2 2'
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
    assert.deepEqual(
      analyzeTwoBishopsWhiteSelection(transformedFen).idealWhiteMoves,
      [expected],
      transform.name,
    )
  }
})

test('rule r20 scores adjacent bishops ahead of separated bishops', () => {
  const fen = '4B3/4B3/1k1K4/8/8/8/8/8 w - - 2 2'
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Bd7').ruleR20Penalty, 0)
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Bc6').ruleR20Penalty, 1)
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
