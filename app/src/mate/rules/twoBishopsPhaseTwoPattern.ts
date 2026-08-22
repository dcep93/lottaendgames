import type { Move, Square } from 'chess.js'
import {
  SQUARE_TRANSFORMS,
  findPiece,
  getChess,
  positionKey,
  transformFen,
  transformSquare,
} from '../chess'
import { TWO_BISHOPS_PHASE_TWO_START_FEN } from './twoBishopsPhaseTwoPatternData'

type PhaseTwoPatternGraph = {
  readonly positions: ReadonlySet<string>
  readonly whiteMoves: ReadonlyMap<string, readonly string[]>
}

const FIRST_WAITING_DIAGONAL = ['d8', 'e7', 'f6', 'g5', 'h4'] as const
const SECOND_WAITING_DIAGONAL = ['d1', 'e2', 'f3', 'g4', 'h5'] as const
const BLACK_DESTINATIONS = ['h3', 'h2', 'h3', 'h2', 'h1', 'h2', 'h1'] as const
const MATE_IN_EIGHT_ISH_C_START_FEN =
  '8/8/8/7B/7B/5K2/8/6k1 w - - 0 1'
const MATE_IN_EIGHT_ISH_F_START_FEN =
  '8/8/8/8/8/5K1k/8/3BB3 w - - 0 1'
const MATE_IN_EIGHT_ISH_G_START_FEN =
  '8/8/8/8/8/8/3BBK1k/8 w - - 4 3'
const MATE_IN_EIGHT_ISH_F_WAITING_DIAGONAL = [
  'c8',
  'd7',
  'e6',
  'f5',
] as const
const MATE_IN_EIGHT_ISH_F_BLACK_DESTINATIONS = [
  'h2',
  'h3',
  'h4',
  'h3',
  'h2',
  'h1',
  'h2',
  'h1',
] as const
const MATE_IN_EIGHT_ISH_C_WAIT_AND_CHECK = [
  ['g5', 'e3'],
  ['f6', 'd4'],
  ['e7', 'c5'],
  ['d8', 'b6'],
] as const satisfies readonly (readonly [Square, Square])[]
const MATE_IN_EIGHT_ISH_B_MOVES = [
  ['f3', 'f2', true],
  ['h2', 'h1', false],
  ['f2', 'f1', true],
  ['h1', 'h2', false],
  ['d1', 'g4', true],
  ['h2', 'h1', false],
  ['e1', 'h4', true],
  ['h1', 'h2', false],
  ['f1', 'f2', true],
  ['h2', 'h1', false],
  ['h4', 'g5', true],
  ['h1', 'h2', false],
  ['g5', 'f4', true],
  ['h2', 'h1', false],
  ['g4', 'f3', true],
] as const satisfies readonly (readonly [Square, Square, boolean])[]
const MATE_IN_EIGHT_ISH_E_MOVES = [
  ['f3', 'f2', true],
  ['h2', 'h3', false],
  ['f2', 'f1', true],
  ['h3', 'h2', false],
  ['d1', 'g4', true],
  ['h2', 'h1', false],
  ['e1', 'h4', true],
  ['h1', 'h2', false],
  ['f1', 'f2', true],
  ['h2', 'h1', false],
  ['g4', 'f5', true],
  ['h1', 'h2', false],
  ['h4', 'g3', true],
  ['h2', 'h1', false],
  ['f5', 'e4', true],
] as const satisfies readonly (readonly [Square, Square, boolean])[]

let graph: PhaseTwoPatternGraph | undefined

function transformedSquares(
  squares: readonly Square[],
  transform: (typeof SQUARE_TRANSFORMS)[number],
): ReadonlySet<Square> {
  return new Set(squares.map((square) => transformSquare(square, transform)))
}

function isWaitingMove(
  move: Move,
  diagonal: ReadonlySet<Square>,
  afterFen: string,
  allowCheck = false,
): boolean {
  const after = getChess(afterFen)
  return (
    move.piece === 'b' &&
    diagonal.has(move.from) &&
    diagonal.has(move.to) &&
    (allowCheck || !after.isCheck()) &&
    !after.isCheckmate()
  )
}

function buildGraph(): PhaseTwoPatternGraph {
  const positions = new Set<string>()
  const whiteMoves = new Map<string, Set<string>>()
  const recordWhiteMoveByKey = (key: string, san: string): void => {
    const moveSet = whiteMoves.get(key) ?? new Set<string>()
    moveSet.add(san)
    whiteMoves.set(key, moveSet)
  }
  const recordWhiteMove = (fen: string, san: string): void =>
    recordWhiteMoveByKey(positionKey(fen), san)

  for (const transform of SQUARE_TRANSFORMS) {
    const startFen = transformFen(TWO_BISHOPS_PHASE_TWO_START_FEN, transform)
    const firstWaitingDiagonal = transformedSquares(
      FIRST_WAITING_DIAGONAL,
      transform,
    )
    const secondWaitingDiagonal = transformedSquares(
      SECOND_WAITING_DIAGONAL,
      transform,
    )
    const blackDestinations = BLACK_DESTINATIONS.map((square) =>
      transformSquare(square, transform),
    )
    const exactFirstFrom = transformSquare('e1', transform)
    const exactFirstTo = transformSquare('h4', transform)
    const exactKingFrom = transformSquare('f3', transform)
    const exactKingTo = transformSquare('f2', transform)
    const exactFifthTo = transformSquare('g4', transform)
    const alternateKingReplyAfterKf2 = transformSquare('h1', transform)
    const memo = new Map<string, boolean>()

    const visit = (fen: string, stage: number): boolean => {
      const key = `${stage}:${positionKey(fen)}`
      const cached = memo.get(key)
      if (cached !== undefined) return cached

      const chess = getChess(fen)
      if (chess.turn() !== 'w') {
        memo.set(key, false)
        return false
      }

      let succeeds = false
      for (const move of chess.moves({ verbose: true })) {
        const afterWhite = getChess(fen)
        afterWhite.move(move)
        const afterWhiteFen = afterWhite.fen()
        const matches =
          stage === 0
            ? move.from === exactFirstFrom && move.to === exactFirstTo
            : stage === 1
              ? isWaitingMove(move, firstWaitingDiagonal, afterWhiteFen)
              : stage === 2
                ? move.piece === 'k' &&
                  move.from === exactKingFrom &&
                  move.to === exactKingTo
                : stage === 3
                  ? findPiece(fen, 'b', 'k')?.square ===
                    alternateKingReplyAfterKf2
                    ? isWaitingMove(
                        move,
                        secondWaitingDiagonal,
                        afterWhiteFen,
                        true,
                      ) ||
                      isWaitingMove(
                        move,
                        firstWaitingDiagonal,
                        afterWhiteFen,
                        true,
                      )
                    : isWaitingMove(
                        move,
                        secondWaitingDiagonal,
                        afterWhiteFen,
                      )
                  : stage === 4
                    ? move.piece === 'b' &&
                      move.to === exactFifthTo &&
                      !afterWhite.isCheck()
                    : stage === 5
                      ? isWaitingMove(move, firstWaitingDiagonal, afterWhiteFen)
                      : stage === 6
                        ? move.piece === 'b' &&
                          afterWhite.isCheck() &&
                          !afterWhite.isCheckmate()
                        : move.piece === 'b' && afterWhite.isCheckmate()
        if (!matches) continue

        let downstream = stage === 7
        if (stage < 7) {
          const replies = afterWhite.moves({ verbose: true })
          const allowedBlackDestinations =
            stage === 2
              ? [blackDestinations[stage], alternateKingReplyAfterKf2]
              : [blackDestinations[stage]]
          const matchingReplies = replies.filter(
            (reply) => allowedBlackDestinations.includes(reply.to),
          )
          if (stage === 6 && replies.length !== 1) continue
          downstream = matchingReplies.some((reply) => {
            const afterBlack = getChess(afterWhiteFen)
            afterBlack.move(reply)
            return visit(afterBlack.fen(), stage + 1)
          })
        }
        if (!downstream) continue

        succeeds = true
        positions.add(positionKey(afterWhiteFen))
        if (stage < 7) {
          for (const reply of afterWhite.moves({ verbose: true })) {
            const allowedBlackDestinations =
              stage === 2
                ? [blackDestinations[stage], alternateKingReplyAfterKf2]
                : [blackDestinations[stage]]
            if (!allowedBlackDestinations.includes(reply.to)) continue
            const afterBlack = getChess(afterWhiteFen)
            afterBlack.move(reply)
            if (visit(afterBlack.fen(), stage + 1)) {
              positions.add(positionKey(afterBlack.fen()))
            }
          }
        }
        const moveSet = whiteMoves.get(positionKey(fen)) ?? new Set<string>()
        moveSet.add(move.san)
        whiteMoves.set(positionKey(fen), moveSet)
      }

      if (succeeds) positions.add(positionKey(fen))
      memo.set(key, succeeds)
      return succeeds
    }

    visit(startFen, 0)

    const playFlowMove = (
      chess: ReturnType<typeof getChess>,
      from: Square,
      to: Square,
      recordWhite: boolean,
    ): Move => {
      const move = chess
        .moves({ verbose: true })
        .find((candidate) => candidate.from === from && candidate.to === to)
      if (!move) {
        throw new Error(`Missing mate in 8 ish move ${from}-${to}`)
      }
      const beforeFen = chess.fen()
      chess.move(move)
      positions.add(positionKey(beforeFen))
      positions.add(positionKey(chess.fen()))
      if (recordWhite) recordWhiteMove(beforeFen, move.san)
      return move
    }

    for (const [waitingTo, checkingTo] of MATE_IN_EIGHT_ISH_C_WAIT_AND_CHECK) {
      const flow = getChess(
        transformFen(MATE_IN_EIGHT_ISH_C_START_FEN, transform),
      )
      playFlowMove(
        flow,
        transformSquare('f3', transform),
        transformSquare('g3', transform),
        true,
      )
      playFlowMove(
        flow,
        transformSquare('g1', transform),
        transformSquare('f1', transform),
        false,
      )
      playFlowMove(
        flow,
        transformSquare('g3', transform),
        transformSquare('h3', transform),
        true,
      )
      playFlowMove(
        flow,
        transformSquare('f1', transform),
        transformSquare('g1', transform),
        false,
      )
      playFlowMove(
        flow,
        transformSquare('h5', transform),
        transformSquare('e2', transform),
        true,
      )
      playFlowMove(
        flow,
        transformSquare('g1', transform),
        transformSquare('h1', transform),
        false,
      )
      playFlowMove(
        flow,
        transformSquare('h4', transform),
        transformSquare(waitingTo, transform),
        true,
      )
      playFlowMove(
        flow,
        transformSquare('h1', transform),
        transformSquare('g1', transform),
        false,
      )
      const check = playFlowMove(
        flow,
        transformSquare(waitingTo, transform),
        transformSquare(checkingTo, transform),
        true,
      )
      if (!check.san.endsWith('+')) {
        throw new Error('Mate in 8 ish C move 5 must check')
      }
      playFlowMove(
        flow,
        transformSquare('g1', transform),
        transformSquare('h1', transform),
        false,
      )
      const mate = playFlowMove(
        flow,
        transformSquare('e2', transform),
        transformSquare('f3', transform),
        true,
      )
      if (!mate.san.endsWith('#') || !flow.isCheckmate()) {
        throw new Error('Mate in 8 ish C must end in mate')
      }
    }

    const flowB = getChess(startFen)
    for (const [from, to, recordWhite] of MATE_IN_EIGHT_ISH_B_MOVES) {
      playFlowMove(
        flowB,
        transformSquare(from, transform),
        transformSquare(to, transform),
        recordWhite,
      )
    }
    if (!flowB.isCheckmate()) {
      throw new Error('Mate in 8 ish B must end in mate')
    }

    const flowE = getChess(startFen)
    for (const [from, to, recordWhite] of MATE_IN_EIGHT_ISH_E_MOVES) {
      playFlowMove(
        flowE,
        transformSquare(from, transform),
        transformSquare(to, transform),
        recordWhite,
      )
    }
    if (!flowE.isCheckmate()) {
      throw new Error('Mate in 8 ish E must end in mate')
    }

    const flowFStartFen = transformFen(
      MATE_IN_EIGHT_ISH_F_START_FEN,
      transform,
    )
    const flowFWaitingDiagonal = transformedSquares(
      MATE_IN_EIGHT_ISH_F_WAITING_DIAGONAL,
      transform,
    )
    const flowFBlackDestinations =
      MATE_IN_EIGHT_ISH_F_BLACK_DESTINATIONS.map((square) =>
        transformSquare(square, transform),
      )
    const flowFMemo = new Map<string, boolean>()
    const visitFlowF = (fen: string, stage: number): boolean => {
      const key = `${stage}:${positionKey(fen)}`
      const cached = flowFMemo.get(key)
      if (cached !== undefined) return cached

      const chess = getChess(fen)
      if (chess.turn() !== 'w') {
        flowFMemo.set(key, false)
        return false
      }

      let succeeds = false
      for (const move of chess.moves({ verbose: true })) {
        const afterWhite = getChess(fen)
        afterWhite.move(move)
        const afterWhiteFen = afterWhite.fen()
        const matches =
          stage === 0
            ? move.from === transformSquare('d1', transform) &&
              move.to === transformSquare('e2', transform)
            : stage === 1
              ? move.piece === 'k' &&
                move.from === transformSquare('f3', transform) &&
                move.to === transformSquare('f2', transform)
              : stage === 2
                ? move.from === transformSquare('e1', transform) &&
                  move.to === transformSquare('d2', transform)
                : stage === 3
                  ? move.from === transformSquare('e2', transform) &&
                    [
                      transformSquare('d1', transform),
                      transformSquare('f3', transform),
                    ].includes(move.to)
                  : stage === 4
                    ? move.from === transformSquare('d2', transform) &&
                      move.to === transformSquare('g5', transform)
                    : stage === 5
                      ? move.piece === 'b' &&
                        move.to === transformSquare('g4', transform)
                      : stage === 6
                        ? move.piece === 'b' &&
                          move.from === transformSquare('g4', transform) &&
                          flowFWaitingDiagonal.has(move.to)
                        : stage === 7
                          ? move.piece === 'b' &&
                            afterWhite.isCheck() &&
                            !afterWhite.isCheckmate()
                          : move.piece === 'b' && afterWhite.isCheckmate()
        if (!matches) continue

        let downstream = stage === 8
        if (stage < 8) {
          const replies = afterWhite.moves({ verbose: true })
          const matchingReplies = replies.filter(
            (reply) => reply.to === flowFBlackDestinations[stage],
          )
          if (stage === 7 && replies.length !== 1) continue
          downstream = matchingReplies.some((reply) => {
            const afterBlack = getChess(afterWhiteFen)
            afterBlack.move(reply)
            return visitFlowF(afterBlack.fen(), stage + 1)
          })
        }
        if (!downstream) continue

        succeeds = true
        positions.add(positionKey(fen))
        positions.add(positionKey(afterWhiteFen))
        recordWhiteMove(fen, move.san)
      }

      if (succeeds) positions.add(positionKey(fen))
      flowFMemo.set(key, succeeds)
      return succeeds
    }

    if (!visitFlowF(flowFStartFen, 0)) {
      throw new Error('Mate in 8 ish F must end in mate')
    }

    const flowGStartFen = transformFen(
      MATE_IN_EIGHT_ISH_G_START_FEN,
      transform,
    )
    const flowGMemo = new Map<string, boolean>()
    const flowGBlackDestinations = ['h1', 'h2', 'h1'].map((square) =>
      transformSquare(square as Square, transform),
    )
    const visitFlowG = (fen: string, stage: number): boolean => {
      const key = `${stage}:${positionKey(fen)}`
      const cached = flowGMemo.get(key)
      if (cached !== undefined) return cached

      const chess = getChess(fen)
      if (chess.turn() !== 'w') {
        flowGMemo.set(key, false)
        return false
      }

      let succeeds = false
      for (const move of chess.moves({ verbose: true })) {
        const afterWhite = getChess(fen)
        afterWhite.move(move)
        const afterWhiteFen = afterWhite.fen()
        const matches =
          stage === 0
            ? move.piece === 'b' &&
              move.from === transformSquare('e2', transform) &&
              move.to === transformSquare('g4', transform)
            : stage === 1
              ? move.piece === 'b' &&
                move.from === transformSquare('g4', transform) &&
                flowFWaitingDiagonal.has(move.to)
              : stage === 2
                ? move.piece === 'b' &&
                  afterWhite.isCheck() &&
                  !afterWhite.isCheckmate()
                : move.piece === 'b' && afterWhite.isCheckmate()
        if (!matches) continue

        let downstream = stage === 3
        if (stage < 3) {
          const replies = afterWhite.moves({ verbose: true })
          const matchingReplies = replies.filter(
            (reply) => reply.to === flowGBlackDestinations[stage],
          )
          if (stage === 2 && replies.length !== 1) continue
          downstream = matchingReplies.some((reply) => {
            const afterBlack = getChess(afterWhiteFen)
            afterBlack.move(reply)
            return visitFlowG(afterBlack.fen(), stage + 1)
          })
        }
        if (!downstream) continue

        succeeds = true
        positions.add(positionKey(fen))
        positions.add(positionKey(afterWhiteFen))
        recordWhiteMove(fen, move.san)
      }

      if (succeeds) positions.add(positionKey(fen))
      flowGMemo.set(key, succeeds)
      return succeeds
    }

    if (!visitFlowG(flowGStartFen, 0)) {
      throw new Error('Mate in 8 ish G must end in mate')
    }
  }

  return {
    positions,
    whiteMoves: new Map(
      [...whiteMoves].map(([key, moves]) => [key, [...moves].sort()]),
    ),
  }
}

function getGraph(): PhaseTwoPatternGraph {
  graph ??= buildGraph()
  return graph
}

export function isTwoBishopsPhaseTwoPatternPosition(fen: string): boolean {
  return getGraph().positions.has(positionKey(fen))
}

export function getTwoBishopsPhaseTwoPatternMoves(
  fen: string,
): readonly string[] {
  return getGraph().whiteMoves.get(positionKey(fen)) ?? []
}
