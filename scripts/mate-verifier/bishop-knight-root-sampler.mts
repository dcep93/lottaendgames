import { readFileSync } from "node:fs";
import {
  boardFenFromPlacements,
  edgeDistance,
  findPiece,
  getChess,
  isKnightMove,
  kingDistance,
  squareColor,
  validateMatePosition,
  type EndgamePiecePlacement,
} from "../../app/src/mate/chess.ts";
import {
  getKnightAndBishopKeySquarePatternScore,
  getKnightAndBishopLookupWhiteMoves,
  getKnightAndBishopPhaseLabel,
  knightAndBishopWhiteMoveReachesLookupPath,
} from "../../app/src/mate/rules/bishopKnight.ts";
import {
  canonicalVerifierPositionKey,
  normalizeVerifierState,
  type ProductionMateVerificationState,
} from "./production.mts";
import type { MateVerificationRoot } from "./types.mts";

type Square = EndgamePiecePlacement["square"];

export type BishopKnightRootSample = {
  readonly candidateRoots: number;
  readonly corpusRoots: number;
  readonly roots: readonly MateVerificationRoot<ProductionMateVerificationState>[];
  readonly seed: number;
  readonly strata: Readonly<Record<string, number>>;
};

type Candidate = {
  readonly root: MateVerificationRoot<ProductionMateVerificationState>;
  readonly stratum: string;
};

const ALL_SQUARES = Array.from({ length: 64 }, (_, index) => {
  const file = String.fromCharCode("a".charCodeAt(0) + (index % 8));
  const rank = Math.floor(index / 8) + 1;
  return `${file}${rank}` as Square;
});

const DEFAULT_CORPUS_URL = new URL(
  "./bishop-knight-adversarial-roots.json",
  import.meta.url,
);

export function sampleBishopKnightRoots(
  count: number,
  seed: number,
  corpusFens: readonly string[] = readAdversarialBishopKnightRoots(),
): BishopKnightRootSample {
  if (!Number.isSafeInteger(count) || count <= 0) {
    throw new Error("Bishop + Knight sample count must be a positive integer");
  }
  if (!Number.isSafeInteger(seed) || seed < 0 || seed > 0xffff_ffff) {
    throw new Error("Bishop + Knight sample seed must be a uint32");
  }

  const random = mulberry32(seed);
  const seen = new Set<string>();
  const selected: Candidate[] = [];
  let corpusRoots = 0;
  for (const fen of corpusFens) {
    const candidate = candidateFromFen(fen, "adversarial corpus");
    if (!candidate) continue;
    const key = canonicalVerifierPositionKey(
      "bishop-knight",
      candidate.root.state,
    );
    if (seen.has(key)) continue;
    seen.add(key);
    selected.push(candidate);
    corpusRoots += 1;
    if (selected.length === count) {
      return finishSample(selected, seed, 0, corpusRoots);
    }
  }

  const remaining = count - selected.length;
  const candidateTarget = Math.max(remaining * 3, remaining + 256);
  const pool: Candidate[] = [];
  const poolKeys = new Set(seen);
  const maximumAttempts = candidateTarget * 100;
  for (
    let attempts = 0;
    attempts < maximumAttempts && pool.length < candidateTarget;
    attempts += 1
  ) {
    const candidate = candidateFromFen(
      randomBishopKnightFen(random),
      `sample seed ${seed}`,
    );
    if (!candidate) continue;
    const key = canonicalVerifierPositionKey(
      "bishop-knight",
      candidate.root.state,
    );
    if (poolKeys.has(key)) continue;
    poolKeys.add(key);
    pool.push(candidate);
  }
  if (pool.length < remaining) {
    throw new Error(
      `Only generated ${pool.length} unique legal candidates for a ${count}-root sample`,
    );
  }

  const shortlistTarget = Math.min(
    pool.length,
    Math.max(Math.ceil(remaining * 1.5), remaining + 64),
  );
  const shortlist = roundRobinStrata(pool, shortlistTarget, random);
  selected.push(...roundRobinStrata(shortlist, remaining, random));
  if (selected.length !== count) {
    throw new Error(`Selected ${selected.length} roots instead of ${count}`);
  }
  return finishSample(selected, seed, pool.length, corpusRoots);
}

export function readAdversarialBishopKnightRoots(): readonly string[] {
  const parsed: unknown = JSON.parse(readFileSync(DEFAULT_CORPUS_URL, "utf8"));
  if (
    !Array.isArray(parsed) ||
    parsed.some((value) => typeof value !== "string")
  ) {
    throw new Error(
      "Bishop + Knight adversarial corpus must be a JSON string array",
    );
  }
  return parsed;
}

function finishSample(
  selected: readonly Candidate[],
  seed: number,
  candidateRoots: number,
  corpusRoots: number,
): BishopKnightRootSample {
  const strata: Record<string, number> = {};
  for (const { stratum } of selected) {
    strata[stratum] = (strata[stratum] ?? 0) + 1;
  }
  return {
    candidateRoots,
    corpusRoots,
    roots: selected.map(({ root }) => root),
    seed,
    strata,
  };
}

function candidateFromFen(
  fen: string,
  source: string,
): Candidate | undefined {
  let canonicalInput: string;
  try {
    canonicalInput = getChess(fen).fen();
  } catch {
    return undefined;
  }
  if (!validateMatePosition("bishop-knight", canonicalInput).ok) {
    return undefined;
  }
  const canonicalKey = canonicalVerifierPositionKey(
    "bishop-knight",
    canonicalInput,
  );
  const state = normalizeVerifierState(`${canonicalKey} 0 1`);
  return {
    root: {
      fen: state,
      halfmoveClock: 0,
      source,
      state,
    },
    stratum: classifyBishopKnightRoot(state),
  };
}

function classifyBishopKnightRoot(fen: string): string {
  const blackKing = findPiece(fen, "b", "k")!;
  const whiteKing = findPiece(fen, "w", "k")!;
  const bishop = findPiece(fen, "w", "b")!;
  const knight = findPiece(fen, "w", "n")!;
  const chess = getChess(fen);
  const lookupMoves = getKnightAndBishopLookupWhiteMoves(fen);
  const reachesLookup =
    lookupMoves.length === 0 &&
    chess
      .moves()
      .some((san) => knightAndBishopWhiteMoveReachesLookupPath(fen, san));
  const kingGap = kingDistance(whiteKing.square, blackKing.square);
  const knightKingGap = kingDistance(knight.square, whiteKing.square);
  return [
    `phase${getKnightAndBishopPhaseLabel(fen)}`,
    lookupMoves.length > 0
      ? "lookup:direct"
      : reachesLookup
        ? "lookup:entry"
        : "lookup:none",
    `edge:${edgeDistance(blackKing.square)}`,
    `key:${getKnightAndBishopKeySquarePatternScore(fen)}`,
    `kings:${Math.min(4, kingGap)}`,
    `knight-king:${Math.min(3, knightKingGap)}`,
    edgeDistance(knight.square) === 0 ? "knight:edge" : "knight:inner",
    squareColor(bishop.square) === squareColor(blackKing.square)
      ? "bishop:same"
      : "bishop:opposite",
    isKnightMove(knight.square, blackKing.square)
      ? "knight:attacks"
      : "knight:quiet",
  ].join("|");
}

function randomBishopKnightFen(random: () => number): string {
  const indices = new Set<number>();
  while (indices.size < 4) indices.add(Math.floor(random() * 64));
  const [blackKing, whiteKing, bishop, knight] = [...indices].map(
    (index) => ALL_SQUARES[index]!,
  );
  const placements: EndgamePiecePlacement[] = [
    { color: "b", isPawn: false, square: blackKing!, type: "k" },
    { color: "w", isPawn: false, square: whiteKing!, type: "k" },
    { color: "w", isPawn: false, square: bishop!, type: "b" },
    { color: "w", isPawn: false, square: knight!, type: "n" },
  ];
  return `${boardFenFromPlacements(placements)} w - - 0 1`;
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b_79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 0x1_0000_0000;
  };
}

function shuffled<T>(values: readonly T[], random: () => number): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const value = result[index]!;
    result[index] = result[swapIndex]!;
    result[swapIndex] = value;
  }
  return result;
}

function roundRobinStrata(
  candidates: readonly Candidate[],
  count: number,
  random: () => number,
): Candidate[] {
  const buckets = new Map<string, Candidate[]>();
  for (const candidate of candidates) {
    const bucket = buckets.get(candidate.stratum);
    if (bucket) bucket.push(candidate);
    else buckets.set(candidate.stratum, [candidate]);
  }
  const bucketKeys = shuffled([...buckets.keys()].sort(), random);
  const offsets = new Map<string, number>();
  const selected: Candidate[] = [];
  while (selected.length < count) {
    let added = false;
    for (const key of bucketKeys) {
      const bucket = buckets.get(key)!;
      const offset = offsets.get(key) ?? 0;
      const candidate = bucket[offset];
      if (!candidate) continue;
      offsets.set(key, offset + 1);
      selected.push(candidate);
      added = true;
      if (selected.length === count) break;
    }
    if (!added) break;
  }
  return selected;
}
