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
  isKnightMove,
  kingDistance,
  squareCoords,
  squareFromCoords,
  transformFen,
  transformSquare,
  validateMatePosition,
  type EndgamePiecePlacement,
  type SquareTransform,
} from '../../app/src/mate/chess.ts'
import { getMateRuleSet } from '../../app/src/mate/rules/index.ts'
import { isViableTwoBishopsStart } from '../../app/src/mate/positions.ts'
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

export type ProductionMateStateKeyMode = 'identity' | 'symmetry'

export type ProductionMateAdapterOptions = {
  readonly stateKeyMode?: ProductionMateStateKeyMode
  readonly transitionCache?: ProductionMateTransitionCache
}

export type ProductionLegalTransition = {
  readonly outcome: MateTerminalOutcome | undefined
  readonly resetsHalfmoveClock: boolean
  readonly san: string
  readonly state: string
}

export type ProductionMateTransitionCache = {
  readonly getLegalTransitions: (
    mateId: MateId,
    state: string,
    compute: () => readonly ProductionLegalTransition[],
  ) => readonly ProductionLegalTransition[]
}

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
  options: ProductionMateAdapterOptions = {},
): MateVerificationAdapter<ProductionMateVerificationState> {
  const ruleSet = getMateRuleSet(mateId)
  const stateKeyMode = options.stateKeyMode ?? 'symmetry'
  const expandUncached = (
    state: ProductionMateVerificationState,
  ): import('./types.mts').MateVerificationExpansion<string> => {
    const whiteState = normalizeVerifierState(state)
    const white = getChess(whiteState)
    const idealWhiteMoves = [
      ...new Set(ruleSet.idealWhiteMoves(white.fen())),
    ]
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

    const legalWhiteTransitions = getLegalTransitions(
      mateId,
      whiteState,
      options.transitionCache,
    )
    const legalWhiteMoves = new Map(
      legalWhiteTransitions.map((transition) => [
        transition.san,
        transition,
      ]),
    )
    const branches: MateVerificationBranch<string>[] = []
    let blackReplies = 0
    for (const whiteSan of idealWhiteMoves) {
      const whiteMove = legalWhiteMoves.get(whiteSan)
      if (whiteMove === undefined) {
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

      if (whiteMove.outcome === 'checkmate') {
        branches.push({
          kind: 'mate',
          moves: [whiteMove.san],
          resetsHalfmoveClock: [whiteMove.resetsHalfmoveClock],
          states: [whiteMove.state],
        })
        continue
      }
      if (whiteMove.outcome !== undefined) {
        branches.push(
          failureBranch(
            terminalFailureKind(whiteMove.outcome, 'white'),
            `White move ${whiteMove.san} ended as ${whiteMove.outcome}`,
            [whiteMove.san],
            [whiteMove.resetsHalfmoveClock],
            [whiteMove.state],
          ),
        )
        continue
      }

      const legalBlackMoves = getLegalTransitions(
        mateId,
        whiteMove.state,
        options.transitionCache,
      )
      if (legalBlackMoves.length === 0) {
        branches.push(
          failureBranch(
            'no-legal-black-move',
            `Non-terminal position has no legal Black move after ${whiteMove.san}`,
            [whiteMove.san],
            [whiteMove.resetsHalfmoveClock],
            [whiteMove.state],
          ),
        )
        continue
      }

      blackReplies += legalBlackMoves.length
      for (const blackMove of legalBlackMoves) {
        const resets = [
          whiteMove.resetsHalfmoveClock,
          blackMove.resetsHalfmoveClock,
        ]
        if (blackMove.outcome !== undefined) {
          branches.push(
            failureBranch(
              terminalFailureKind(blackMove.outcome, 'black'),
              `Black response ${blackMove.san} ended as ${blackMove.outcome}`,
              [whiteMove.san, blackMove.san],
              resets,
              [whiteMove.state, blackMove.state],
            ),
          )
          continue
        }
        branches.push({
          kind: 'continue',
          moves: [whiteMove.san, blackMove.san],
          next: blackMove.state,
          resetsHalfmoveClock: resets,
          states: [whiteMove.state, blackMove.state],
        })
      }
    }

    return {
      blackReplies,
      branches,
      whiteChoices: idealWhiteMoves.length,
    }
  }
  return {
    key:
      stateKeyMode === 'identity'
        ? identityVerifierPositionKey
        : (state) => canonicalVerifierPositionKey(mateId, state),
    render: (state) => state,
    expand: expandUncached,
  }
}

function getLegalTransitions(
  mateId: MateId,
  state: string,
  cache: ProductionMateTransitionCache | undefined,
): readonly ProductionLegalTransition[] {
  const normalized = normalizeVerifierState(state)
  const compute = (): readonly ProductionLegalTransition[] => {
    const chess = getChess(normalized)
    return chess.moves().map((san) => {
      const after = getChess(normalized)
      const move = after.move(san)
      if (move === null) {
        throw new Error(`chess.js rejected listed move ${san}`)
      }
      return {
        outcome: getMateTerminalOutcome(mateId, after.fen()),
        resetsHalfmoveClock: resetsHalfmoveClock(move),
        san: move.san,
        state: normalizeVerifierState(after.fen()),
      }
    })
  }
  return cache === undefined
    ? compute()
    : cache.getLegalTransitions(mateId, normalized, compute)
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

export function identityVerifierPositionKey(fen: string): string {
  return normalizeVerifierState(fen).split(' ').slice(0, 4).join(' ')
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
      if (mateId === 'bishop-knight') {
        if (!isLegalBishopKnightRootPlacement(placements)) return
        yield {
          fen,
          halfmoveClock: 0,
          source: 'standard exhaustive placement',
          state: fen,
        }
        return
      }
      if (!validateMatePosition(mateId, fen).ok) return
      if (mateId === 'two-bishops' && !isViableTwoBishopsStart(fen)) return
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
        mateId === 'bishop-knight' &&
        pieceIndex === 0 &&
        square !== canonicalSquareOrbitRepresentative(square)
      ) {
        continue
      }
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

function canonicalSquareOrbitRepresentative(
  square: EndgamePiecePlacement['square'],
): EndgamePiecePlacement['square'] {
  return SQUARE_TRANSFORMS.map((transform) =>
    transformSquare(square, transform),
  ).sort()[0]!
}

export function isLegalBishopKnightRootPlacement(
  placements: readonly EndgamePiecePlacement[],
): boolean {
  const blackKing = placements.find(
    ({ color, type }) => color === 'b' && type === 'k',
  )
  const whiteKing = placements.find(
    ({ color, type }) => color === 'w' && type === 'k',
  )
  const bishop = placements.find(
    ({ color, type }) => color === 'w' && type === 'b',
  )
  const knight = placements.find(
    ({ color, type }) => color === 'w' && type === 'n',
  )
  if (!blackKing || !whiteKing || !bishop || !knight) return false
  if (kingDistance(blackKing.square, whiteKing.square) <= 1) return false

  const occupied = new Set(placements.map(({ square }) => square))
  if (
    isKnightMove(knight.square, blackKing.square) ||
    bishopAttacksSquare(bishop.square, blackKing.square, occupied)
  ) {
    return false
  }

  return allSquares().some((destination) => {
    if (kingDistance(blackKing.square, destination) !== 1) return false
    if (kingDistance(whiteKing.square, destination) <= 1) return false

    const knightRemains = destination !== knight.square
    if (knightRemains && isKnightMove(knight.square, destination)) {
      return false
    }

    const bishopRemains = destination !== bishop.square
    if (bishopRemains) {
      const afterCapture = new Set(occupied)
      afterCapture.delete(blackKing.square)
      afterCapture.delete(destination)
      if (bishopAttacksSquare(bishop.square, destination, afterCapture)) {
        return false
      }
    }
    return true
  })
}

function bishopAttacksSquare(
  bishopSquare: EndgamePiecePlacement['square'],
  targetSquare: EndgamePiecePlacement['square'],
  occupied: ReadonlySet<string>,
): boolean {
  const bishop = squareCoords(bishopSquare)
  const target = squareCoords(targetSquare)
  const fileDelta = target.file - bishop.file
  const rankDelta = target.rank - bishop.rank
  if (Math.abs(fileDelta) !== Math.abs(rankDelta) || fileDelta === 0) {
    return false
  }
  const fileStep = Math.sign(fileDelta)
  const rankStep = Math.sign(rankDelta)
  for (let distance = 1; distance < Math.abs(fileDelta); distance += 1) {
    const square = squareFromCoords(
      bishop.file + fileStep * distance,
      bishop.rank + rankStep * distance,
    )
    if (square && occupied.has(square)) return false
  }
  return true
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
