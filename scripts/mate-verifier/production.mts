import {
  MATE_CATALOG,
  TWO_KNIGHTS_PAWN_POSITIONS,
} from '../../app/src/mate/catalog.ts'
import {
  SQUARE_TRANSFORMS,
  allSquares,
  boardFenFromPlacements,
  getChess,
  getEndgamePiecePlacements,
  getSquareTransform,
  kingDistance,
  transformFen,
  transformSquare,
  validateMatePosition,
  type EndgamePiecePlacement,
  type SquareTransform,
} from '../../app/src/mate/chess.ts'
import { getMateRuleSet } from '../../app/src/mate/rules/index.ts'
import {
  getMateTerminalOutcome,
  type MateTerminalOutcome,
} from '../../app/src/mate/session.ts'
import type { MateId } from '../../app/src/mate/types.ts'
import type {
  MateVerificationAdapter,
  MateVerificationBranch,
  MateVerificationFailureKind,
  MateVerificationRoot,
} from './types.mts'

export type ProductionMateVerificationState = string

const TWO_KNIGHTS_PAWN_TRANSFORMS = Object.freeze([
  getSquareTransform('identity'),
  getSquareTransform('mirrorFile'),
])

const STANDARD_PIECES: Readonly<
  Record<
    Exclude<MateId, 'two-knights-pawn'>,
    readonly EndgamePiecePlacement[]
  >
> = Object.freeze({
  queen: Object.freeze([
    piece('b', 'k'),
    piece('w', 'k'),
    piece('w', 'q'),
  ]),
  rook: Object.freeze([
    piece('b', 'k'),
    piece('w', 'k'),
    piece('w', 'r'),
  ]),
  'two-bishops': Object.freeze([
    piece('b', 'k'),
    piece('w', 'k'),
    piece('w', 'b'),
    piece('w', 'b'),
  ]),
  'bishop-knight': Object.freeze([
    piece('b', 'k'),
    piece('w', 'k'),
    piece('w', 'b'),
    piece('w', 'n'),
  ]),
})

export function createProductionMateAdapter(
  mateId: MateId,
): MateVerificationAdapter<ProductionMateVerificationState> {
  const ruleSet = getMateRuleSet(mateId)
  return {
    key: (state) => canonicalVerifierPositionKey(mateId, state),
    render: (state) => state,
    expand: (state) => {
      const white = getChess(normalizeVerifierState(state))
      const idealWhiteMoves = [...new Set(ruleSet.idealWhiteMoves(white.fen()))]
      if (idealWhiteMoves.length === 0) {
        return {
          blackReplies: 0,
          branches: [
            failureBranch(
              'rule-gap',
              `No optimal White move in ${white.fen()}`,
              [],
              [],
              [white.fen()],
            ),
          ],
          whiteChoices: 0,
        }
      }

      const legalWhiteMoves = new Set(white.moves())
      const branches: MateVerificationBranch<string>[] = []
      let blackReplies = 0
      for (const whiteSan of idealWhiteMoves) {
        if (!legalWhiteMoves.has(whiteSan)) {
          branches.push(
            failureBranch(
              'illegal-white-move',
              `Rule set returned illegal White move ${whiteSan}`,
              [whiteSan],
              [],
              [white.fen()],
            ),
          )
          continue
        }

        const afterWhite = getChess(white.fen())
        const whiteMove = afterWhite.move(whiteSan)
        if (whiteMove === null) {
          branches.push(
            failureBranch(
              'illegal-white-move',
              `Rule set returned unplayable White move ${whiteSan}`,
              [whiteSan],
              [],
              [afterWhite.fen()],
            ),
          )
          continue
        }
        const afterWhiteState = normalizeVerifierState(afterWhite.fen())
        const whiteReset = resetsHalfmoveClock(whiteMove)
        const afterWhiteOutcome = getMateTerminalOutcome(mateId, afterWhite.fen())
        if (afterWhiteOutcome === 'checkmate') {
          branches.push({
            kind: 'mate',
            moves: [whiteMove.san],
            resetsHalfmoveClock: [whiteReset],
            states: [afterWhiteState],
          })
          continue
        }
        if (afterWhiteOutcome !== undefined) {
          branches.push(
            failureBranch(
              terminalFailureKind(afterWhiteOutcome, 'white'),
              `White move ${whiteMove.san} ended as ${afterWhiteOutcome}`,
              [whiteMove.san],
              [whiteReset],
              [afterWhiteState],
            ),
          )
          continue
        }

        const legalBlackMoves = afterWhite.moves()
        if (legalBlackMoves.length === 0) {
          branches.push(
            failureBranch(
              'no-legal-black-move',
              `Non-terminal position has no legal Black move after ${whiteMove.san}`,
              [whiteMove.san],
              [whiteReset],
              [afterWhiteState],
            ),
          )
          continue
        }

        blackReplies += legalBlackMoves.length
        for (const blackSan of legalBlackMoves) {
          const afterBlack = getChess(afterWhite.fen())
          const blackMove = afterBlack.move(blackSan)
          if (blackMove === null) {
            branches.push(
              failureBranch(
                'no-legal-black-move',
                `chess.js rejected listed Black move ${blackSan}`,
                [whiteMove.san, blackSan],
                [whiteReset],
                [afterWhiteState, afterWhiteState],
              ),
            )
            continue
          }
          const afterBlackState = normalizeVerifierState(afterBlack.fen())
          const resets = [whiteReset, resetsHalfmoveClock(blackMove)]
          const afterBlackOutcome = getMateTerminalOutcome(mateId, afterBlack.fen())
          if (afterBlackOutcome !== undefined) {
            branches.push(
              failureBranch(
                terminalFailureKind(afterBlackOutcome, 'black'),
                `Black response ${blackMove.san} ended as ${afterBlackOutcome}`,
                [whiteMove.san, blackMove.san],
                resets,
                [afterWhiteState, afterBlackState],
              ),
            )
            continue
          }
          branches.push({
            kind: 'continue',
            moves: [whiteMove.san, blackMove.san],
            next: afterBlackState,
            resetsHalfmoveClock: resets,
            states: [afterWhiteState, afterBlackState],
          })
        }
      }

      return {
        blackReplies,
        branches,
        whiteChoices: idealWhiteMoves.length,
      }
    },
  }
}

export function* enumerateProductionMateRoots(
  mateId: MateId,
): Generator<MateVerificationRoot<ProductionMateVerificationState>> {
  const seen = new Set<string>()
  for (const root of enumerateRawProductionMateRoots(mateId)) {
    const key = canonicalVerifierPositionKey(mateId, root.state)
    if (seen.has(key)) continue
    seen.add(key)
    yield root
  }
}

export function normalizeVerifierState(fen: string): string {
  const canonical = getChess(fen).fen().split(' ')
  return `${canonical.slice(0, 4).join(' ')} 0 1`
}

export function canonicalVerifierPositionKey(
  mateId: MateId,
  fen: string,
): string {
  const normalized = normalizeVerifierState(fen)
  const [, turn = 'w', castling = '-', enPassant = '-'] =
    normalized.split(' ')
  if (castling !== '-') {
    throw new Error('Mate verifier symmetry does not support castling rights')
  }
  const placements = getEndgamePiecePlacements(normalized)
  let canonical: string | undefined
  for (const transform of verifierTransforms(mateId)) {
    const board = boardFenFromPlacements(
      placements.map((placement) => ({
        ...placement,
        square: transformSquare(placement.square, transform),
      })),
    )
    const transformedEnPassant =
      enPassant === '-'
        ? '-'
        : transformSquare(
            enPassant as Parameters<typeof transformSquare>[0],
            transform,
          )
    const candidate = `${board} ${turn} - ${transformedEnPassant}`
    if (canonical === undefined || candidate < canonical) canonical = candidate
  }
  if (canonical === undefined) {
    throw new Error(`No verifier symmetries registered for ${mateId}`)
  }
  return canonical
}

function verifierTransforms(mateId: MateId): readonly SquareTransform[] {
  return mateId === 'two-knights-pawn'
    ? TWO_KNIGHTS_PAWN_TRANSFORMS
    : SQUARE_TRANSFORMS
}

function* enumerateRawProductionMateRoots(
  mateId: MateId,
): Generator<MateVerificationRoot<ProductionMateVerificationState>> {
  yield* enumerateTrainRoots(mateId)
  if (mateId === 'two-knights-pawn') {
    yield* enumerateTwoKnightsPawnRoots()
    return
  }
  yield* enumerateUnrestrictedStandardRoots(mateId)
}

function* enumerateTrainRoots(
  mateId: MateId,
): Generator<MateVerificationRoot<string>> {
  if (mateId === 'two-knights-pawn') return
  const entry = MATE_CATALOG.find((candidate) => candidate.id === mateId)
  if (entry === undefined) throw new Error(`Unknown mate set ${mateId}`)
  const seen = new Set<string>()
  for (const [seedIndex, seed] of entry.trainSeeds.entries()) {
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = getChess(transformFen(seed, transform)).fen()
      if (seen.has(fen)) continue
      seen.add(fen)
      yield makeRoot(
        fen,
        `train seed ${seedIndex + 1} via ${transform.name}`,
      )
    }
  }
}

function* enumerateTwoKnightsPawnRoots(): Generator<
  MateVerificationRoot<string>
> {
  const seen = new Set<string>()
  for (const [mode, sources] of [
    ['standard', TWO_KNIGHTS_PAWN_POSITIONS.standard],
    ['train', TWO_KNIGHTS_PAWN_POSITIONS.train],
  ] as const) {
    for (const [sourceIndex, source] of sources.entries()) {
      for (const transformName of source.transformNames) {
        const fen = getChess(
          transformFen(source.fen, getSquareTransform(transformName)),
        ).fen()
        if (seen.has(fen)) continue
        seen.add(fen)
        yield makeRoot(
          fen,
          `${mode} source ${sourceIndex + 1} via ${transformName}`,
        )
      }
    }
  }
}

function* enumerateUnrestrictedStandardRoots(
  mateId: Exclude<MateId, 'two-knights-pawn'>,
): Generator<MateVerificationRoot<string>> {
  const squares = allSquares()
  const pieces = STANDARD_PIECES[mateId]
  const used = new Set<string>()
  const placements: EndgamePiecePlacement[] = []

  function* visit(pieceIndex: number): Generator<MateVerificationRoot<string>> {
    if (pieceIndex === pieces.length) {
      const fen = `${boardFenFromPlacements(placements)} w - - 0 1`
      if (!validateMatePosition(mateId, fen).ok) return
      yield makeRoot(fen, 'standard exhaustive placement')
      return
    }

    const template = pieces[pieceIndex]!
    const previous = placements[pieceIndex - 1]
    const identicalToPrevious =
      previous !== undefined &&
      previous.color === template.color &&
      previous.type === template.type
    const minimumSquareIndex = identicalToPrevious
      ? squares.indexOf(previous.square) + 1
      : 0

    for (
      let squareIndex = minimumSquareIndex;
      squareIndex < squares.length;
      squareIndex += 1
    ) {
      const square = squares[squareIndex]!
      if (used.has(square)) continue
      if (
        template.type === 'k' &&
        previous?.type === 'k' &&
        kingDistance(previous.square, square) <= 1
      ) {
        continue
      }
      used.add(square)
      placements.push({ ...template, square })
      yield* visit(pieceIndex + 1)
      placements.pop()
      used.delete(square)
    }
  }

  yield* visit(0)
}

function makeRoot(fen: string, source: string): MateVerificationRoot<string> {
  const canonical = getChess(fen).fen()
  const halfmoveClock = Number(canonical.split(' ')[4] ?? 0)
  return {
    fen: canonical,
    halfmoveClock,
    source,
    state: normalizeVerifierState(canonical),
  }
}

function piece(
  color: EndgamePiecePlacement['color'],
  type: EndgamePiecePlacement['type'],
): EndgamePiecePlacement {
  return { color, isPawn: type === 'p', square: 'a1', type }
}

function resetsHalfmoveClock(move: {
  readonly captured?: string
  readonly piece: string
}): boolean {
  return move.piece === 'p' || move.captured !== undefined
}

function terminalFailureKind(
  outcome: MateTerminalOutcome,
  mover: 'black' | 'white',
): Exclude<MateVerificationFailureKind, 'cycle'> {
  if (outcome === 'checkmate') {
    return mover === 'black' ? 'white-checkmated' : 'unsupported'
  }
  return outcome
}

function failureBranch(
  failureKind: Exclude<MateVerificationFailureKind, 'cycle'>,
  message: string,
  moves: readonly string[],
  resetsHalfmoveClock: readonly boolean[],
  states: readonly string[],
): MateVerificationBranch<string> {
  return {
    failureKind,
    kind: 'failure',
    message,
    moves,
    resetsHalfmoveClock,
    states,
  }
}
