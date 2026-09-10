import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import {
  SQUARE_TRANSFORMS,
  getChess,
  getSquareTransform,
  transformFen,
  transformSquare,
} from "../chess";
import {
  getIdealKnightAndBishopWhiteMoves,
  getKnightAndBishopOpponentCandidates,
  getKnightAndBishopPhaseLabel,
  getKnightAndBishopLookupEntryResultFen,
  getKnightAndBishopLookupWhiteMoves,
  getMateRuleSet,
  isKnightAndBishopLookupPhasePosition,
  isKnightAndBishopMatingNetWhiteTurnPosition,
  isKnightAndBishopWManeuverPosition,
  knightAndBishopWhiteMoveReachesLookupPath,
  knightAndBishopWhiteRules,
  scoreKnightAndBishopWhiteMove,
  wManeuverSetupDistance,
} from "./index";
import {
  BISHOP_KNIGHT_LOOKUP_ENTRIES,
  BISHOP_KNIGHT_PREPARE_STARTS,
} from "./bishopKnightData";

test("bishop-and-knight source data is an exact immutable snapshot", () => {
  assert.equal(BISHOP_KNIGHT_LOOKUP_ENTRIES.length, 119);
  assert.equal(
    new Set(BISHOP_KNIGHT_LOOKUP_ENTRIES.map(({ key }) => key)).size,
    119,
  );
  assert.deepEqual(BISHOP_KNIGHT_LOOKUP_ENTRIES[0], {
    key: "8/8/5KNk/5B2/8/8/8/8 w",
    from: "f5",
    to: "g4",
  });
  assert.deepEqual(BISHOP_KNIGHT_LOOKUP_ENTRIES.at(-1), {
    key: "6k1/2B5/6K1/5N2/8/8/8/8 w",
    from: "c7",
    to: "d6",
  });
  assert.equal(Object.isFrozen(BISHOP_KNIGHT_LOOKUP_ENTRIES), true);
  assert.equal(
    BISHOP_KNIGHT_LOOKUP_ENTRIES.every((entry) => Object.isFrozen(entry)),
    true,
  );
  assert.deepEqual(BISHOP_KNIGHT_PREPARE_STARTS, [
    "8/4k3/4B3/4K3/1N6/8/8/8 w - - 0 1",
    "8/4k3/4B3/4K3/8/2N5/8/8 w - - 0 1",
    "8/4k3/4B3/4K3/8/1N6/8/8 w - - 0 1",
    "8/4k3/4B3/4K3/8/6N1/8/8 w - - 0 1",
    "8/4k3/4B3/4K3/8/7N/8/8 w - - 0 1",
  ]);
  assert.equal(Object.isFrozen(BISHOP_KNIGHT_PREPARE_STARTS), true);
  assert.equal(
    createHash("sha256")
      .update(JSON.stringify(BISHOP_KNIGHT_LOOKUP_ENTRIES))
      .digest("hex"),
    "34f1c870084d4da936d45077daa896c9d06e256e4b4493c7ed4f98e72a6a32ad",
  );
});

test("lookup entries are legal and all square transforms round trip", () => {
  for (const entry of BISHOP_KNIGHT_LOOKUP_ENTRIES) {
    const [board, turn] = entry.key.split(" ");
    const chess = getChess(`${board} ${turn} - - 0 1`);
    assert.ok(chess.move({ from: entry.from, to: entry.to }), entry.key);

    for (const transform of SQUARE_TRANSFORMS) {
      const inverse = getSquareTransform(transform.inverseName);
      assert.equal(
        transformSquare(transformSquare(entry.from, transform), inverse),
        entry.from,
      );
      assert.equal(
        transformSquare(transformSquare(entry.to, transform), inverse),
        entry.to,
      );
    }
  }
  for (const fen of BISHOP_KNIGHT_PREPARE_STARTS) {
    assert.doesNotThrow(() => getChess(fen));
    assert.equal(getChess(fen).turn(), "w");
    assert.ok(getChess(fen).moves().length > 0);
  }
});

test("bishop-and-knight rules are registered", () => {
  const ruleSet = getMateRuleSet("bishop-knight");
  assert.equal(ruleSet.id, "bishop-knight");
  assert.deepEqual(ruleSet.whiteRuleDescriptions, [
    {
      id: "mate",
      shortLabel: "mate",
      helpText: "",
    },
    {
      id: "minors safe",
      shortLabel: "pieces safe",
      helpText: "",
    },
    {
      id: "no stalemate",
      shortLabel: "no stalemate",
      helpText: "",
    },
    {
      id: "mating net",
      shortLabel: "mating net",
      helpText:
        "Follow the recorded finishing move when available; otherwise enter the mating net.",
    },
    {
      id: "king closer",
      shortLabel: "king closer",
      helpText:
        "Before the wall is set, or after a far-away knight is central, bring White's king closer on the color opposite the bishop without moving it farther away.",
    },
  ]);
  assert.deepEqual(
    ruleSet.help.noteBoards.map(({ id }) => id),
    ["zone-x", "key-square"],
  );
  assert.deepEqual(ruleSet.help.noteBoards[0], {
    id: "zone-x",
    title: "edge cage",
    caption:
      "The bishop and knight fence Black along the edge while White's king closes in.",
    layout: { files: 8, ranks: 8, fileOffset: 0 },
    pieces: [
      { square: "f8", piece: "k" },
      { square: "e5", piece: "K" },
      { square: "e6", piece: "B" },
      { square: "c6", piece: "N" },
    ],
    highlights: [
      { square: "e8", kind: "zone" },
      { square: "f8", kind: "zone" },
      { square: "c6", kind: "key" },
      { square: "e6", kind: "key" },
      { square: "g7", kind: "escape" },
    ],
    arrows: [{ from: "e5", to: "f6" }],
  });
  assert.equal(Object.isFrozen(ruleSet.help.noteBoards[0]?.pieces), true);
  assert.deepEqual(ruleSet.help.blackPriorities, [
    "Take a piece when White isn't looking.",
    "Return to the previous board position when possible.",
    "In the W maneuver, or when any reply enters the finishing route, treat every legal reply as equally strong.",
    "Move toward an unprotected bishop or knight.",
    "Run toward the center.",
    "Keep as many legal king moves as possible.",
    "Stay away from White's king.",
    "Stay away from a bishop-colored corner.",
  ]);
  assert.deepEqual(
    knightAndBishopWhiteRules.map(({ id }) => id),
    [
      "mate",
      "minors safe",
      "no stalemate",
      "mating net",
      "king closer",
    ],
  );
  assert.deepEqual(
    ruleSet.whiteRuleDescriptions.map(({ id }) => id),
    knightAndBishopWhiteRules.map(({ id }) => id),
  );
  assert.equal(knightAndBishopWhiteRules.length, 5);
});

test("direct lookup is decisive while immediate mate keeps precedence", () => {
  const ruleSet = getMateRuleSet("bishop-knight");
  const lookupFen = "8/8/5KNk/5B2/8/8/8/8 w - - 34 18";
  assert.deepEqual(getKnightAndBishopLookupWhiteMoves(lookupFen), ["Bg4"]);
  assert.deepEqual(ruleSet.idealWhiteMoves(lookupFen), ["Bg4"]);
  assert.equal(ruleSet.currentWhiteHint(lookupFen)?.id, "mating net");
  assert.equal(ruleSet.explainWhiteMove(lookupFen, "Ke7")?.id, "mating net");

  const mateFen = "k7/8/NK6/5B2/8/8/8/8 w - - 0 1";
  assert.deepEqual(getKnightAndBishopLookupWhiteMoves(mateFen), ["Be4#"]);
  assert.deepEqual(ruleSet.idealWhiteMoves(mateFen), ["Be4#"]);
  assert.equal(ruleSet.currentWhiteHint(mateFen)?.id, "mate");
  assert.equal(ruleSet.explainWhiteMove(mateFen, "Nb8")?.id, "mate");
});

test("king closer does not pull the mating king back toward the center", () => {
  const fen = "8/4BK1k/8/4N3/8/8/8/8 w - - 0 1";
  const moves = getIdealKnightAndBishopWhiteMoves(fen);

  assert.equal(
    scoreKnightAndBishopWhiteMove(fen, "Kf6")
      .kingCloserOppositeBishopScore,
    99,
  );
  assert.ok(!moves.includes("Kf6"));
});

test("king closer advances the far king after the knight is central", () => {
  const fen = "7k/8/KB6/4N3/8/8/8/8 w - - 0 1";
  const moves = getIdealKnightAndBishopWhiteMoves(fen);

  assert.ok(moves.length > 0);
  assert.ok(moves.every((san) => san.startsWith("K")));
  assert.ok(
    moves.every(
      (san) =>
        scoreKnightAndBishopWhiteMove(fen, san)
          .kingCloserOppositeBishopScore < 99,
    ),
  );
});

test("all lookup moves survive every symmetry without transformed collisions", () => {
  const movesByPosition = new Map<string, Set<string>>();
  const resultKeys = new Set<string>();
  let transformedCases = 0;

  for (const entry of BISHOP_KNIGHT_LOOKUP_ENTRIES) {
    const [board, turn] = entry.key.split(" ");
    const canonicalFen = `${board} ${turn} - - 0 1`;
    const resultFen = getKnightAndBishopLookupEntryResultFen(entry);
    for (const transform of SQUARE_TRANSFORMS) {
      const inverse = getSquareTransform(transform.inverseName);
      const fen = transformFen(canonicalFen, inverse);
      const from = transformSquare(entry.from, inverse);
      const to = transformSquare(entry.to, inverse);
      const chess = getChess(fen);
      const move = chess.move({ from, to });
      assert.ok(move, `${entry.key} via ${transform.name}`);
      assert.ok(
        getKnightAndBishopLookupWhiteMoves(fen).includes(move.san),
        `${entry.key} via ${transform.name}: ${move.san}`,
      );
      assert.equal(getKnightAndBishopPhaseLabel(fen), "2/2");
      const key = fen.split(" ").slice(0, 2).join(" ");
      const moves = movesByPosition.get(key) ?? new Set<string>();
      moves.add(move.san);
      movesByPosition.set(key, moves);
      resultKeys.add(
        transformFen(resultFen, transform).split(" ").slice(0, 2).join(" "),
      );
      transformedCases += 1;
    }
  }

  assert.equal(transformedCases, 952);
  assert.equal(movesByPosition.size, 928);
  assert.equal(resultKeys.size, 656);
  assert.deepEqual(
    [...movesByPosition.entries()]
      .filter(([, moves]) => moves.size > 1)
      .map(([fen, moves]) => [fen, [...moves].sort()]),
    [],
  );
});

test("phase handoff requires a forced lookup path on the white turn", () => {
  const handoffFen = "6k1/8/5KB1/6N1/8/8/8/8 w - - 0 1";
  assert.equal(getKnightAndBishopPhaseLabel(handoffFen), "2/2");
  assert.equal(isKnightAndBishopMatingNetWhiteTurnPosition(handoffFen), true);
  assert.equal(
    scoreKnightAndBishopWhiteMove(handoffFen, "Nf7").phaseTwoEntryScore,
    0,
  );
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(handoffFen), ["Nf7"]);
  const handedOff = getChess(handoffFen);
  handedOff.move("Nf7");
  assert.equal(isKnightAndBishopLookupPhasePosition(handedOff.fen()), true);
  assert.equal(getKnightAndBishopPhaseLabel(handedOff.fen()), "1/2");

  const falseEntryFen = "8/6k1/3BK3/8/3N4/8/8/8 w - - 118 60";
  const falseEntry = getChess(falseEntryFen);
  falseEntry.move("Nf5+");
  assert.equal(isKnightAndBishopLookupPhasePosition(falseEntry.fen()), false);
  assert.equal(
    knightAndBishopWhiteMoveReachesLookupPath(falseEntryFen, "Nf5+"),
    false,
  );
  assert.equal(
    scoreKnightAndBishopWhiteMove(falseEntryFen, "Nf5+").phaseTwoEntryScore,
    1,
  );
  assert.notDeepEqual(getIdealKnightAndBishopWhiteMoves(falseEntryFen), [
    "Nf5+",
  ]);
});

test("forced lookup re-entry holes remain in the mating net", () => {
  const cases = [
    ["2k5/3N3B/4K3/8/8/8/8/8 w - - 54 28", "Be4"],
    ["2k5/3N3B/3K4/8/8/8/8/8 w - - 56 29", "Nc5"],
    ["2k5/3N4/4K3/8/8/3B4/8/8 w - - 56 29", "Be4"],
    ["2k5/3N4/4K3/8/4B3/8/8/8 w - - 56 29", "Kd6"],
    ["2k5/3N4/4K3/3B4/8/8/8/8 w - - 58 30", "Kd6"],
    ["8/k2N4/3K4/8/8/3B4/8/8 w - - 58 30", "Kc7"],
    ["2k5/3N4/3K4/3B4/8/8/8/8 w - - 60 31", "Be4"],
    ["2k5/3N4/3K4/8/2B5/8/8/8 w - - 60 31", "Bd5"],
    ["3k4/8/3K4/2N2B2/8/8/8/8 w - - 64 33", "Bg6"],
    ["8/k7/2K5/2N5/2B5/8/8/8 w - - 64 33", "Nd7"],
    ["1k6/8/2K5/2N5/2B5/8/8/8 w - - 64 33", "Be6"],
    ["1k6/8/2K1B3/2N5/8/8/8/8 w - - 66 34", "Kb6"],
    ["k7/8/2K5/2N2B2/8/8/8/8 w - - 66 34", "Be6"],
    ["8/2kN4/4K3/8/2B5/8/8/8 w - - 58 30", "Bd5"],
    ["k7/3N4/3K4/8/2B5/8/8/8 w - - 60 31", "Kc7"],
    ["k7/3B4/2K5/2N5/8/8/8/8 w - - 68 35", "Kb6"],
  ] as const;

  for (const [fen, san] of cases) {
    assert.ok(getKnightAndBishopLookupWhiteMoves(fen).includes(san), fen);
    const chess = getChess(fen);
    chess.move(san);
    const candidates = getKnightAndBishopOpponentCandidates(chess.fen());
    assert.deepEqual(candidates.idealMoves, candidates.moves, chess.fen());
  }
});

test("literal lookup collision and re-entry branches preserve source choices and phases", () => {
  const ruleSet = getMateRuleSet("bishop-knight");
  const collisionFen = "k7/1N3B2/1K6/8/8/8/8/8 w - - 0 1";
  assert.deepEqual(getKnightAndBishopLookupWhiteMoves(collisionFen), ["Be6"]);
  assert.deepEqual(ruleSet.idealWhiteMoves(collisionFen), ["Be6"]);
  assert.equal(getKnightAndBishopPhaseLabel(collisionFen), "2/2");
  assert.equal(ruleSet.currentWhiteHint(collisionFen)?.id, "mating net");
  const collision = getChess(collisionFen);
  collision.move("Be6");
  assert.deepEqual(
    getKnightAndBishopOpponentCandidates(collision.fen()).idealMoves,
    ["Kb8"],
  );

  const branches = [
    {
      fen: "2k5/3N3B/3K4/8/8/8/8/8 w - - 0 1",
      line: [
        "Nc5",
        "Kb8",
        "Kc6",
        "Kc8",
        "Nb7",
        "Kb8",
        "Kb6",
        "Kc8",
        "Bf5+",
        "Kb8",
        "Nc5",
        "Ka8",
        "Be6",
        "Kb8",
        "Na6+",
        "Ka8",
        "Bd5#",
      ],
    },
    {
      fen: "2k5/8/3K2B1/2N5/8/8/8/8 w - - 60 31",
      line: [
        "Bf7",
        "Kb8",
        "Be6",
        "Ka7",
        "Kc7",
        "Ka8",
        "Kb6",
        "Kb8",
        "Na6+",
        "Ka8",
        "Bd5#",
      ],
    },
    {
      fen: "8/1k1N4/4K3/8/8/3B4/8/8 w - - 56 29",
      line: ["Kd6", "Kc8", "Be4", "Kd8", "Bg6", "Kc8"],
    },
    {
      fen: "8/3N4/2k1K3/8/8/3B4/8/8 w - - 56 29",
      line: ["Bc4", "Kb7", "Kd6", "Ka8"],
    },
    {
      fen: "8/k2N4/4K3/8/8/3B4/8/8 w - - 56 29",
      line: ["Kd6", "Ka8", "Kc6", "Ka7", "Bc4", "Ka8"],
    },
  ] as const;

  let assertedWhitePlies = 0;
  let assertedBlackPlies = 0;
  for (const branch of branches) {
    const chess = getChess(branch.fen);
    for (const san of branch.line) {
      const fen = chess.fen();
      if (chess.turn() === "w") {
        const after = getChess(fen);
        after.move(san);
        const mate = after.isCheckmate();
        if (!mate) {
          assert.deepEqual(getKnightAndBishopLookupWhiteMoves(fen), [san], fen);
        }
        assert.deepEqual(ruleSet.idealWhiteMoves(fen), [san], fen);
        assert.equal(getKnightAndBishopPhaseLabel(fen), "2/2", fen);
        assert.equal(
          ruleSet.currentWhiteHint(fen)?.id,
          mate ? "mate" : "mating net",
          fen,
        );
        assert.equal(
          ruleSet.explainWhiteMove(fen, san)?.id,
          mate ? "mate" : "mating net",
          fen,
        );
        assertedWhitePlies += 1;
      } else {
        assert.ok(
          getKnightAndBishopOpponentCandidates(fen).idealMoves.includes(san),
          `${san} from ${fen}`,
        );
        assert.equal(getKnightAndBishopPhaseLabel(fen), "1/2", fen);
        assertedBlackPlies += 1;
      }
      chess.move(san);
    }
  }
  assert.equal(assertedWhitePlies, 23);
  assert.equal(assertedBlackPlies, 21);
});

test("canonical Train lookup line preserves White choices and Black resistance", () => {
  const line = [
    "Nf7+",
    "Kg8",
    "Bg6",
    "Kf8",
    "Bh7",
    "Ke8",
    "Ne5",
    "Kf8",
    "Nd7+",
    "Ke8",
    "Ke6",
    "Kd8",
    "Kd6",
    "Ke8",
    "Bg6+",
    "Kd8",
    "Nc5",
    "Kc8",
    "Bf7",
    "Kd8",
    "Nb7+",
    "Kc8",
    "Kc6",
    "Kb8",
    "Kb6",
    "Kc8",
    "Be6+",
    "Kb8",
    "Nc5",
    "Ka8",
    "Bd7",
    "Kb8",
    "Na6+",
    "Ka8",
    "Bc6#",
  ] as const;
  const chess = getChess("7k/8/5K2/6N1/4B3/8/8/8 w - - 42 22");

  for (const san of line) {
    if (chess.turn() === "w") {
      assert.ok(
        getIdealKnightAndBishopWhiteMoves(chess.fen()).includes(san),
        `${san} from ${chess.fen()}`,
      );
      assert.equal(getKnightAndBishopPhaseLabel(chess.fen()), "2/2");
    } else {
      assert.ok(
        getKnightAndBishopOpponentCandidates(chess.fen()).idealMoves.includes(
          san,
        ),
        `${san} from ${chess.fen()}`,
      );
      assert.equal(getKnightAndBishopPhaseLabel(chess.fen()), "1/2");
    }
    chess.move(san);
  }
  assert.equal(chess.isCheckmate(), true);
});

test("Black preserves return, W-maneuver, lookup, and score priorities", () => {
  const wFen = "7k/8/5K2/4N3/8/5B2/8/8 b - - 0 1";
  assert.equal(wManeuverSetupDistance(wFen), 0);
  assert.equal(isKnightAndBishopWManeuverPosition(wFen), true);
  const wCandidates = getKnightAndBishopOpponentCandidates(wFen);
  assert.deepEqual(wCandidates.moves, ["Kh7", "Kg8"]);
  assert.deepEqual(wCandidates.idealMoves, wCandidates.moves);

  const lookup = getChess("1k6/1N3B2/2K5/8/8/8/8/8 w - - 66 34");
  lookup.move("Kb6");
  const lookupCandidates = getKnightAndBishopOpponentCandidates(lookup.fen());
  assert.deepEqual(lookupCandidates.moves, ["Kc8", "Ka8"]);
  assert.deepEqual(lookupCandidates.idealMoves, lookupCandidates.moves);

  assert.deepEqual(
    getKnightAndBishopOpponentCandidates("4N3/8/3B4/4K3/8/5k2/8/8 b - - 11 6")
      .idealMoves,
    ["Ke3"],
  );

  const firstWhiteTurnFen = "8/8/8/4k3/7B/3K2N1/8/8 w - - 48 25";
  const cycle = getChess(firstWhiteTurnFen);
  cycle.move("Kc3");
  cycle.move("Kf4");
  cycle.move("Kd3");
  assert.deepEqual(
    getKnightAndBishopOpponentCandidates(cycle.fen(), firstWhiteTurnFen)
      .idealMoves,
    ["Ke5"],
  );
});

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

function playDeterministicSelfPlay(
  startFen: string,
  seed: number,
  maximumPlies = 220,
  stopAtPreMatingNetLoop = false,
) {
  const chess = getChess(startFen);
  const random = seededRandom(seed);
  const seenBeforeMatingNet = new Set<string>();
  let phaseTwoReached = false;
  let lastWhiteTurnFen: string | undefined;
  let blackReturnTargetFen: string | undefined;
  const moves: string[] = [];

  while (!chess.isGameOver() && moves.length < maximumPlies) {
    if (
      chess.turn() === "w" &&
      getKnightAndBishopPhaseLabel(chess.fen()) === "2/2"
    ) {
      phaseTwoReached = true;
    }
    const key = chess.fen().split(" ").slice(0, 2).join(" ");
    if (!phaseTwoReached) {
      if (seenBeforeMatingNet.has(key) && stopAtPreMatingNetLoop) {
        return {
          chess,
          moves,
          phaseTwoReached,
          preMatingNetLoop: key,
        };
      }
      assert.equal(
        seenBeforeMatingNet.has(key),
        false,
        `pre-mating-net loop: ${moves.join(" ")}`,
      );
      seenBeforeMatingNet.add(key);
    }

    let choices: readonly string[];
    if (chess.turn() === "w") {
      choices = getIdealKnightAndBishopWhiteMoves(chess.fen());
      blackReturnTargetFen = lastWhiteTurnFen;
      lastWhiteTurnFen = chess.fen();
    } else {
      choices = getKnightAndBishopOpponentCandidates(
        chess.fen(),
        blackReturnTargetFen,
      ).idealMoves;
      blackReturnTargetFen = undefined;
    }
    assert.ok(choices.length > 0, chess.fen());
    const san = choices[Math.floor(random() * choices.length)];
    chess.move(san);
    moves.push(san);
  }

  return {
    chess,
    moves,
    phaseTwoReached,
    preMatingNetLoop: undefined,
  };
}

test("all Train symmetries mate across deterministic tied replies", () => {
  const canonical = "7k/8/5K2/6N1/4B3/8/8/8 w - - 42 22";
  SQUARE_TRANSFORMS.forEach((transform, transformIndex) => {
    const fen = transformFen(canonical, transform);
    for (let tieSeed = 0; tieSeed < 16; tieSeed += 1) {
      const result = playDeterministicSelfPlay(
        fen,
        88_000 + transformIndex * 100 + tieSeed,
      );
      assert.equal(result.chess.isCheckmate(), true, result.moves.join(" "));
      assert.ok(result.moves.length <= 39, result.moves.join(" "));
    }
  });
});
