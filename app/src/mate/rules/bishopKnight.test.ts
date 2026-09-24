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
  getKnightAndBishopOpponentCandidates,
  getKnightAndBishopLookupEntryResultFen,
  getKnightAndBishopLookupWhiteMoves,
  getMateRuleSet,
  isKnightAndBishopLookupPhasePosition,
  isKnightAndBishopMatingNetWhiteTurnPosition,
  isKnightAndBishopWManeuverPosition,
  knightAndBishopWhiteMoveReachesLookupPath,
  knightAndBishopWhiteRules,
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
      id: "r1",
      shortLabel: "rule r1",
      helpText: "With a king supported 3 diagonal and the knight within 1 move of the support square, check.",
    },
    {
      id: "r1.5",
      shortLabel: "rule r1.5",
      helpText: "Prefer a supported smaller odd diagonal, then knight move proximity to its support square.",
    },
    {
      id: "r2.5",
      shortLabel: "rule r2.5",
      helpText: "With a supported diagonal, prefer forcing Black’s king towards the target corner.",
    },
    {
      id: "r5",
      shortLabel: "rule r5",
      helpText: "Prepare the 7 diagonal.",
    },
    {
      id: "r5.1",
      shortLabel: "rule r5.1",
      helpText: "With a central bishop and knight on the precage square, prefer king proximity to the edge that the bishop is closer to but the knight is further from, then to the edge both pieces are closer to.",
    },
    {
      id: "r5.5",
      shortLabel: "rule r5.5",
      helpText: "Play the 5.5 step.",
    },
    {
      id: "r8",
      shortLabel: "rule r8",
      helpText: "With a king on a middle-16 square, prefer bishop on the long diagonal, then a central bishop, then knight move proximity to a precage square, then knight off the bishop's color.",
    },
    {
      id: "r9.1",
      shortLabel: "rule r9.1",
      helpText: "Play the 9.1 move.",
    },
    {
      id: "r9.9",
      shortLabel: "rule r9.9",
      helpText: "Minimize king distance to the center, then prefer king proximity.",
    },
    {
      id: "r9.98",
      shortLabel: "rule r9.98",
      helpText: "Prefer knight move proximity to a stable bishop protected square.",
    },
    {
      id: "r20",
      shortLabel: "rule r20",
      helpText: "Maximize piece distance from Black's king, then maximize their distance from each other.",
    },
  ]);
  assert.equal(ruleSet.help.noteBoards.some(board => board.id === "bishop-knight-rule-r4-flush"), false);
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
      "r1",
      "r1.5",
      "r2.5",
      "r5",
      "r5.1",
      "r5.5",
      "r8",
      "r9.1",
      "r9.9",
      "r9.98",
      "r20",
    ],
  );
  assert.deepEqual(
    ruleSet.whiteRuleDescriptions.map(({ id }) => id),
    knightAndBishopWhiteRules.map(({ id }) => id),
  );
  assert.equal(knightAndBishopWhiteRules.length, 14);
});

test("immediate mate keeps precedence without the mating-net rule", () => {
  const ruleSet = getMateRuleSet("bishop-knight");
  const mateFen = "k7/8/NK6/5B2/8/8/8/8 w - - 0 1";
  assert.deepEqual(getKnightAndBishopLookupWhiteMoves(mateFen), ["Be4#"]);
  assert.deepEqual(ruleSet.idealWhiteMoves(mateFen), ["Be4#"]);
  assert.equal(ruleSet.currentWhiteHint(mateFen)?.id, "mate");
  assert.equal(ruleSet.explainWhiteMove(mateFen, "Nb8")?.id, "mate");
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
      assert.equal(isKnightAndBishopMatingNetWhiteTurnPosition(fen), true);
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

test("mating lookup entry requires a forced lookup path on the white turn", () => {
  const handoffFen = "6k1/8/5KB1/6N1/8/8/8/8 w - - 0 1";
  assert.equal(isKnightAndBishopMatingNetWhiteTurnPosition(handoffFen), true);
  assert.equal(isKnightAndBishopMatingNetWhiteTurnPosition(handoffFen), true);
  const handedOff = getChess(handoffFen);
  handedOff.move("Nf7");
  assert.equal(isKnightAndBishopLookupPhasePosition(handedOff.fen()), true);
  assert.equal(isKnightAndBishopMatingNetWhiteTurnPosition(handedOff.fen()), false);

  const falseEntryFen = "8/6k1/3BK3/8/3N4/8/8/8 w - - 118 60";
  const falseEntry = getChess(falseEntryFen);
  falseEntry.move("Nf5+");
  assert.equal(isKnightAndBishopLookupPhasePosition(falseEntry.fen()), false);
  assert.equal(
    knightAndBishopWhiteMoveReachesLookupPath(falseEntryFen, "Nf5+"),
    false,
  );

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
  const collisionFen = "k7/1N3B2/1K6/8/8/8/8/8 w - - 0 1";
  assert.deepEqual(getKnightAndBishopLookupWhiteMoves(collisionFen), ["Be6"]);
  assert.equal(isKnightAndBishopMatingNetWhiteTurnPosition(collisionFen), true);
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
        assert.equal(isKnightAndBishopMatingNetWhiteTurnPosition(fen), true, fen);
        assertedWhitePlies += 1;
      } else {
        assert.ok(
          getKnightAndBishopOpponentCandidates(fen).idealMoves.includes(san),
          `${san} from ${fen}`,
        );
        assert.equal(isKnightAndBishopMatingNetWhiteTurnPosition(fen), false, fen);
        assertedBlackPlies += 1;
      }
      chess.move(san);
    }
  }
  assert.equal(assertedWhitePlies, 23);
  assert.equal(assertedBlackPlies, 21);
});

test("recorded canonical Train line preserves lookup coverage and Black resistance", () => {
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
        getKnightAndBishopLookupWhiteMoves(chess.fen()).includes(san) || knightAndBishopWhiteMoveReachesLookupPath(chess.fen(), san),
        `${san} from ${chess.fen()}`,
      );
      assert.equal(isKnightAndBishopMatingNetWhiteTurnPosition(chess.fen()), true);
    } else {
      assert.ok(
        getKnightAndBishopOpponentCandidates(chess.fen()).idealMoves.includes(
          san,
        ),
        `${san} from ${chess.fen()}`,
      );
      assert.equal(isKnightAndBishopMatingNetWhiteTurnPosition(chess.fen()), false);
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
