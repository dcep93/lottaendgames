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
  compareScoresByRules,
  getIdealKnightAndBishopWhiteMoves,
  getKnightAndBishopEstablishedZoneXKnightRouteTarget,
  getKnightAndBishopOpponentCandidates,
  getKnightAndBishopPhaseLabel,
  getKnightAndBishopLookupEntryResultFen,
  getKnightAndBishopLookupWhiteMoves,
  getKnightAndBishopZone5,
  getKnightAndBishopZoneXKnightDriftTarget,
  getKnightAndBishopZoneXSetup,
  getMateRuleSet,
  isKnightAndBishopLookupPhasePosition,
  isKnightAndBishopMatingNetWhiteTurnPosition,
  isKnightAndBishopWManeuverPosition,
  knightAndBishopWhiteMoveForcesZone5,
  knightAndBishopWhiteMoveReachesLookupPath,
  knightAndBishopWhiteRules,
  scoreKnightAndBishopWhiteMove,
  selectIdealMoves,
  wManeuverSetupDistance,
} from "./index";
import {
  BISHOP_KNIGHT_LOOKUP_ENTRIES,
  BISHOP_KNIGHT_PREPARE_STARTS,
} from "./bishopKnightData";
import { sameSquareColor } from "./bishopKnightGeometry";
import { isKnightAndBishopBishopOppositionLoopShape } from "./bishopKnightStrategy";

function permutations<Value>(values: readonly Value[]): readonly Value[][] {
  if (values.length <= 1) return [[...values]];
  return values.flatMap((value, index) => {
    const remaining = [...values.slice(0, index), ...values.slice(index + 1)];
    return permutations(remaining).map((permutation) => [
      value,
      ...permutation,
    ]);
  });
}

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
      id: "build the wall",
      shortLabel: "build the wall",
      helpText:
        "Move the bishop beside White's king on Black's side. Of those wall moves, choose the one that keeps Black farthest from the center.",
    },
      {
        id: "edge cage",
        shortLabel: "edge cage",
        helpText:
          "When the key square cannot improve, hold Black on the edge. Keep an established knight seal and do not move a coordinated knight out from behind White's king. Keep the bishop wall aimed toward Black's edge; then advance the king or wait with the bishop.",
    },
    {
      id: "knight key square",
      shortLabel: "knight key square",
      helpText:
        "Move White's king inward, then place the knight between the kings to seal the edge.",
    },
      {
        id: "king closer",
        shortLabel: "king closer",
        helpText:
          "Before the wall is set, bring White's king closer on the color opposite the bishop without moving it farther away.",
    },
      {
        id: "coordinate pieces",
        shortLabel: "coordinate pieces",
        helpText:
          "Keep the knight behind White's king. With the wall set, bring the knight and king together before lining up the bishop in front. Then center the knight away from Black; when the bishop must move, move it away from Black and toward White's king.",
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
      "build the wall",
      "edge cage",
      "knight key square",
      "king closer",
      "coordinate pieces",
    ],
  );
  assert.deepEqual(
    ruleSet.whiteRuleDescriptions.map(({ id }) => id),
    knightAndBishopWhiteRules.map(({ id }) => id),
  );
  assert.equal(knightAndBishopWhiteRules.length, 9);
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

test("build the wall selects Bd5 and follows Ke3 with Be4", () => {
  const start = "6B1/8/5N2/4K3/8/3k4/8/8 w - - 0 1";
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(start), ["Bd5"]);
  assert.equal(getMateRuleSet("bishop-knight").currentWhiteHint(start)?.id, "build the wall");

  const continuation = getChess(start);
  continuation.move("Bd5");
  continuation.move("Ke3");
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(continuation.fen()), [
    "Be4",
  ]);
});

test("build the wall keeps pushing until Black reaches the edge", () => {
  const fen = "8/8/1k6/3K4/4N3/8/7B/8 w - - 0 1";
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), ["Bd6"]);
  assert.equal(
    getMateRuleSet("bishop-knight").currentWhiteHint(fen)?.id,
    "build the wall",
  );
});

test("build the wall never labels a king shuttle as wall construction", () => {
  const fen = "8/8/2k2K2/4B3/8/4N3/8/8 w - - 0 1";
  assert.equal(
    scoreKnightAndBishopWhiteMove(fen, "Kf5").bishopWallMoveScore,
    3,
  );
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), ["Ke6"]);
  assert.equal(
    getMateRuleSet("bishop-knight").currentWhiteHint(fen)?.id,
    "king closer",
  );
});

test("edge cage preserves an established bishop wall", () => {
  const fen = "4k3/8/2KB4/4N3/8/8/8/8 w - - 0 1";
  const moves = getIdealKnightAndBishopWhiteMoves(fen);

  assert.ok(moves.length > 0);
  assert.ok(!moves.includes("Ba3"));
  assert.ok(
    moves.every(
      (san) =>
        scoreKnightAndBishopWhiteMove(fen, san)
          .bishopWallPreservationScore === 0,
    ),
  );
  assert.equal(
    getMateRuleSet("bishop-knight").currentWhiteHint(fen)?.id,
    "edge cage",
  );
});

test("coordinate pieces develops the knight after the wall is established", () => {
  const fen = "4k3/8/1N1B4/3K4/8/8/8/8 w - - 0 1";

  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), ["Nc4"]);
  assert.equal(
    getMateRuleSet("bishop-knight").currentWhiteHint(fen)?.id,
    "coordinate pieces",
  );
});

test("edge cage keeps an established knight seal", () => {
  const fen = "3k4/4N3/3BK3/8/8/8/8/8 w - - 0 1";
  const moves = getIdealKnightAndBishopWhiteMoves(fen);

  assert.ok(moves.length > 0);
  assert.ok(!moves.includes("Nd5"));
  assert.ok(
    moves.every(
      (san) =>
        scoreKnightAndBishopWhiteMove(fen, san)
          .keySquarePreservationScore === 0,
    ),
  );
  assert.equal(
    getMateRuleSet("bishop-knight").currentWhiteHint(fen)?.id,
    "coordinate pieces",
  );
});

test("edge cage keeps the wall aimed toward Black's edge", () => {
  const fen = "8/5k2/3B4/3K4/2N5/8/8/8 w - - 0 1";
  const moves = getIdealKnightAndBishopWhiteMoves(fen);

  assert.ok(moves.length > 0);
  assert.ok(!moves.includes("Be5"));
  assert.ok(
    moves.every(
      (san) =>
        scoreKnightAndBishopWhiteMove(fen, san)
          .bishopWallAlignmentScore === 1,
    ),
  );
});

test("edge cage advances the established wall without a knight shuffle", () => {
  const fen = "8/5k2/3B4/3K4/2N5/8/8/8 w - - 0 1";

  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), ["Kc6"]);
  assert.equal(
    getMateRuleSet("bishop-knight").currentWhiteHint(fen)?.id,
    "edge cage",
  );
});

test("edge cage re-aims with the bishop when Black's edge escape is unavoidable", () => {
  const fen = "4k3/8/3B4/2NK4/8/8/8/8 w - - 0 1";
  const moves = getIdealKnightAndBishopWhiteMoves(fen);

  assert.ok(moves.length > 0);
  assert.ok(moves.every((san) => san.startsWith("B")));
  assert.ok(!moves.includes("Kc6"));
  assert.equal(
    getMateRuleSet("bishop-knight").currentWhiteHint(fen)?.id,
    "edge cage",
  );
});

test("coordination keeps the knight formation while bringing the king to the wall", () => {
  const fen = "4k3/8/2KB4/8/2N5/8/8/8 w - - 0 1";
  const moves = getIdealKnightAndBishopWhiteMoves(fen);

  assert.ok(moves.length > 0);
  assert.ok(
    moves.every(
      (san) =>
        scoreKnightAndBishopWhiteMove(fen, san)
          .knightBehindPreservationScore === 0 &&
        scoreKnightAndBishopWhiteMove(fen, san)
          .bishopWallPreservationScore === 0,
    ),
  );
  assert.equal(
    getMateRuleSet("bishop-knight").currentWhiteHint(fen)?.id,
    "coordinate pieces",
  );
});

test("edge cage advances the wall before chasing Black with the knight", () => {
  const fen = "3k4/8/3BK3/4N3/8/8/8/8 w - - 0 1";
  const moves = getIdealKnightAndBishopWhiteMoves(fen);

  assert.ok(moves.length > 0);
  assert.ok(moves.every((san) => !san.startsWith("N")));
  assert.ok(
    moves.every(
      (san) =>
        scoreKnightAndBishopWhiteMove(fen, san)
          .bishopWallPreservationScore === 0 &&
        scoreKnightAndBishopWhiteMove(fen, san)
          .bishopWallAlignmentScore === 0,
    ),
  );
  assert.equal(
    getMateRuleSet("bishop-knight").currentWhiteHint(fen)?.id,
    "edge cage",
  );
});

test("coordinate pieces brings the knight to an established wall before circling the king", () => {
  const fen = "8/2k1B3/4K3/8/6N1/8/8/8 w - - 0 1";
  const moves = getIdealKnightAndBishopWhiteMoves(fen);

  assert.ok(moves.length > 0);
  assert.ok(!moves.includes("Kf7"));
  assert.ok(
    moves.every(
      (san) =>
        scoreKnightAndBishopWhiteMove(fen, san)
          .wallCoordinationKnightDistance === 1,
    ),
  );
  assert.equal(
    getMateRuleSet("bishop-knight").currentWhiteHint(fen)?.id,
    "coordinate pieces",
  );
});

test("edge cage holds an adjacent coordinated knight while advancing the wall", () => {
  const fen = "8/2k1B3/4K3/4N3/8/8/8/8 w - - 0 1";
  const moves = getIdealKnightAndBishopWhiteMoves(fen);

  assert.ok(moves.length > 0);
  assert.ok(moves.every((san) => !san.startsWith("N")));
  assert.equal(
    getMateRuleSet("bishop-knight").currentWhiteHint(fen)?.id,
    "edge cage",
  );
});

test("edge cage does not send a coordinated knight back across the wall", () => {
  const fen = "4kBK1/5N2/8/8/8/8/8/8 w - - 0 1";
  const moves = getIdealKnightAndBishopWhiteMoves(fen);

  assert.ok(moves.length > 0);
  assert.ok(!moves.includes("Ne5"));
  assert.ok(
    moves.every(
      (san) =>
        scoreKnightAndBishopWhiteMove(fen, san)
          .coordinatedKnightMoveScore === 0,
    ),
  );
});

test("edge cage does not count a bishop on the wrong side as a partial wall", () => {
  const fen = "4kBK1/5N2/8/8/8/8/8/8 w - - 0 1";

  assert.equal(
    scoreKnightAndBishopWhiteMove(fen, "Bg7")
      .bishopWallPreservationScore,
    scoreKnightAndBishopWhiteMove(fen, "Be7")
      .bishopWallPreservationScore,
  );
});

test("coordinate pieces keeps a waiting bishop close to White's king", () => {
  const fen = "2k2BK1/5N2/8/8/8/8/8/8 w - - 0 1";
  const moves = getIdealKnightAndBishopWhiteMoves(fen);

  assert.deepEqual(moves, ["Bg7"]);
  assert.ok(!moves.includes("Bh6"));
  assert.equal(
    getMateRuleSet("bishop-knight").currentWhiteHint(fen)?.id,
    "coordinate pieces",
  );
});

test("edge cage opens the bishop-colored corner when the wall would stalemate", () => {
  const fen = "8/5KBk/8/4N3/8/8/8/8 w - - 0 1";
  const moves = getIdealKnightAndBishopWhiteMoves(fen);

  assert.deepEqual(moves, ["Bf8"]);
  assert.equal(
    scoreKnightAndBishopWhiteMove(fen, "Bf8").matingCornerEntryScore,
    0,
  );
  assert.equal(
    scoreKnightAndBishopWhiteMove(fen, "Bf6").matingCornerEntryScore,
    1,
  );
});

test("edge cage puts the king a knight's move from the mating corner", () => {
  const fen = "7k/4B3/5K2/4N3/8/8/8/8 w - - 0 1";
  const moves = getIdealKnightAndBishopWhiteMoves(fen);

  assert.ok(moves.length > 0);
  assert.ok(moves.every((san) => san.startsWith("K")));
  assert.ok(
    moves.every(
      (san) =>
        scoreKnightAndBishopWhiteMove(fen, san).matingKingSquareScore === 0,
    ),
  );
  assert.ok(!moves.includes("Bd6"));
});

test("edge cage walks the king toward its mating square before moving the knight", () => {
  const fen = "7k/8/2KB4/2N5/8/8/8/8 w - - 0 1";
  const moves = getIdealKnightAndBishopWhiteMoves(fen);

  assert.ok(moves.length > 0);
  assert.ok(moves.every((san) => san.startsWith("K")));
  assert.ok(!moves.includes("Ne4"));
  assert.ok(
    moves.every(
      (san) =>
        scoreKnightAndBishopWhiteMove(fen, san).matingKingSquareScore === 2,
    ),
  );
  assert.equal(
    getMateRuleSet("bishop-knight").currentWhiteHint(fen)?.id,
    "edge cage",
  );
});

test("edge cage advances the mating king while Black waits beside the corner", () => {
  const fen = "8/7k/8/5KB1/5N2/8/8/8 w - - 0 1";
  const moves = getIdealKnightAndBishopWhiteMoves(fen);

  assert.ok(moves.length > 0);
  assert.ok(!moves.includes("Kg4"));
  assert.ok(
    moves.every(
      (san) =>
        scoreKnightAndBishopWhiteMove(fen, san).matingKingSquareScore === 1,
    ),
  );
  assert.equal(
    getMateRuleSet("bishop-knight").currentWhiteHint(fen)?.id,
    "edge cage",
  );
});

test("edge cage keeps the mating king placed when Black retreats two edge squares", () => {
  const fen = "8/5K2/3B3k/3N4/8/8/8/8 w - - 0 1";
  const moves = getIdealKnightAndBishopWhiteMoves(fen);

  assert.ok(moves.length > 0);
  assert.ok(!moves.includes("Kf6"));
  assert.ok(
    moves.every(
      (san) =>
        scoreKnightAndBishopWhiteMove(fen, san).matingKingSquareScore === 0,
    ),
  );
  assert.equal(
    getMateRuleSet("bishop-knight").currentWhiteHint(fen)?.id,
    "edge cage",
  );
});

test("edge cage covers Black's farthest retreat toward the mating corner", () => {
  const fen = "8/8/8/4NK1k/5B2/8/8/8 w - - 0 1";
  const moves = getIdealKnightAndBishopWhiteMoves(fen);

  assert.ok(moves.length > 0);
  assert.ok(!moves.includes("Be3"));
  assert.ok(
    moves.every(
      (san) =>
        scoreKnightAndBishopWhiteMove(fen, san)
          .blackMatingCornerContainmentScore === 2,
    ),
  );
  assert.equal(
    getMateRuleSet("bishop-knight").currentWhiteHint(fen)?.id,
    "edge cage",
  );
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

test("edge cage keeps the mating king placed when Black steps beside the corner", () => {
  const fen = "8/5K1k/8/4N3/3B4/8/8/8 w - - 0 1";
  const moves = getIdealKnightAndBishopWhiteMoves(fen);

  assert.ok(moves.length > 0);
  assert.ok(!moves.includes("Kf6"));
  assert.ok(
    moves.every(
      (san) =>
        scoreKnightAndBishopWhiteMove(fen, san).matingKingSquareScore === 0,
    ),
  );
});

test("edge cage arranges the mate before checking Black out of the corner", () => {
  const fen = "7k/4BK2/8/4N3/8/8/8/8 w - - 0 1";
  const moves = getIdealKnightAndBishopWhiteMoves(fen);

  assert.ok(moves.length > 0);
  assert.ok(!moves.includes("Bf6+"));
  assert.ok(
    moves.every(
      (san) =>
        scoreKnightAndBishopWhiteMove(fen, san)
          .matingBishopCentralDistance === 1,
    ),
  );
});

test("edge cage keeps the waiting bishop off the mating-corner diagonal", () => {
  const fen = "7k/5K2/8/2B1N3/8/8/8/8 w - - 0 1";
  const moves = getIdealKnightAndBishopWhiteMoves(fen);

  assert.ok(moves.length > 0);
  assert.ok(!moves.includes("Bd4"));
  assert.ok(
    moves.every(
      (san) =>
        scoreKnightAndBishopWhiteMove(fen, san)
          .matingBishopCornerLineScore === 0,
    ),
  );
});

test("edge cage moves the knight after the mating king and bishop are placed", () => {
  const fen = "8/5K1k/3B4/4N3/8/8/8/8 w - - 0 1";
  const moves = getIdealKnightAndBishopWhiteMoves(fen);

  assert.ok(moves.length > 0);
  assert.ok(moves.every((san) => san.startsWith("N")));
  assert.ok(!moves.includes("Bc5"));
  assert.ok(
    moves.every(
      (san) =>
        scoreKnightAndBishopWhiteMove(fen, san)
          .matingKnightRouteDistance === 2,
    ),
  );
});

test("edge cage releases a coordinated knight when the cage is far from Black", () => {
  const fen = "7k/8/KB6/N7/8/8/8/8 w - - 0 1";
  const moves = getIdealKnightAndBishopWhiteMoves(fen);

  assert.ok(moves.length > 0);
  assert.ok(moves.every((san) => san.startsWith("N")));
  assert.ok(!moves.includes("Kb5"));
  assert.ok(
    moves.every(
      (san) =>
        scoreKnightAndBishopWhiteMove(fen, san).knightCentralDistance < 3,
    ),
  );
});

test("edge cage does not patrol the edge before White's king is close", () => {
  const fen = "6k1/8/KB6/8/2N5/8/8/8 w - - 0 1";
  const moves = getIdealKnightAndBishopWhiteMoves(fen);

  assert.ok(moves.length > 0);
  assert.ok(!moves.includes("Na5"));
  assert.ok(
    moves.every(
      (san) =>
        scoreKnightAndBishopWhiteMove(fen, san).knightCentralDistance === 0,
    ),
  );
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

test("build the wall resets the wall after a far king advance", () => {
  const fen = "7k/8/8/2BKN3/8/8/8/8 w - - 0 1";
  const moves = getIdealKnightAndBishopWhiteMoves(fen);

  assert.ok(moves.length > 0);
  assert.ok(moves.every((san) => san.startsWith("B")));
  assert.ok(
    moves.every(
      (san) =>
        scoreKnightAndBishopWhiteMove(fen, san).bishopWallMoveScore === 0,
    ),
  );
  assert.equal(
    getMateRuleSet("bishop-knight").currentWhiteHint(fen)?.id,
    "build the wall",
  );
});

test("king closer advances in king distance instead of trading axes", () => {
  const fen = "7k/8/8/2B1N3/2K5/8/8/8 w - - 0 1";
  const moves = getIdealKnightAndBishopWhiteMoves(fen);

  assert.deepEqual(moves, ["Kd5"]);
  assert.ok(!moves.includes("Kd3"));
  assert.equal(
    getMateRuleSet("bishop-knight").currentWhiteHint(fen)?.id,
    "edge cage",
  );
});

test("edge cage puts the king on the pivotal square at the safe corner", () => {
  const fen = "3N4/k7/3B4/3K4/8/8/8/8 w - - 0 1";

  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), ["Kc6"]);
  assert.equal(
    scoreKnightAndBishopWhiteMove(fen, "Kc6").safeCornerKingDistance,
    0,
  );
});

test("safe-corner approach is not mislabeled as a completed knight key square", () => {
  const fen = "1k6/4BK2/8/4N3/8/8/8/8 w - - 0 1";
  const moves = getIdealKnightAndBishopWhiteMoves(fen);

  assert.ok(moves.length > 0);
  assert.equal(
    scoreKnightAndBishopWhiteMove(fen, "Ke6").keySquarePatternScore,
    2,
  );
  assert.ok(
    moves.every(
      (san) =>
        scoreKnightAndBishopWhiteMove(fen, san).safeCornerKingDistance === 2,
    ),
  );
});

test("a partial key-square score does not interrupt the edge cage", () => {
  const fen = "2k5/4B3/2K5/2N5/8/8/8/8 w - - 2 2";
  const moves = getIdealKnightAndBishopWhiteMoves(fen);

  assert.ok(moves.length > 0);
  assert.ok(!moves.includes("Ne6"));
  assert.equal(
    scoreKnightAndBishopWhiteMove(fen, "Ne6").keySquarePatternScore,
    1,
  );
  assert.ok(
    moves.every(
      (san) =>
        scoreKnightAndBishopWhiteMove(fen, san).zoneXPrepareScore === 0,
    ),
  );
  assert.equal(
    getMateRuleSet("bishop-knight").currentWhiteHint(fen)?.id,
    "edge cage",
  );
});

test("coordinate pieces preserves its displayed lexicographic comparison", () => {
  const finalRule = knightAndBishopWhiteRules.at(-1)!;
  const fens = [
    "7N/8/8/3K4/1k1B4/8/8/8 w - - 14 8",
    "6K1/3N4/3k4/8/8/8/8/3B4 w - - 0 1",
  ] as const;

  for (const fen of fens) {
    const candidates = getChess(fen)
      .moves()
      .map((san) => ({
        san,
        score: scoreKnightAndBishopWhiteMove(fen, san),
      }));
    for (const left of candidates) {
      for (const right of candidates) {
        const sourcePairComparison =
          left.score.bishopOppositionLoopScore -
            right.score.bishopOppositionLoopScore ||
          left.score.knightBehindWhiteKingScore -
            right.score.knightBehindWhiteKingScore ||
          left.score.wallCoordinationKnightDistance -
            right.score.wallCoordinationKnightDistance ||
          left.score.bishopInFrontScore - right.score.bishopInFrontScore ||
          left.score.knightWhiteKingDistance -
            right.score.knightWhiteKingDistance ||
          left.score.knightCentralDistance -
            right.score.knightCentralDistance ||
          right.score.knightBlackKingDistance -
            left.score.knightBlackKingDistance ||
          left.score.bishopFrontPreparationScore -
            right.score.bishopFrontPreparationScore ||
          (left.score.movedPiece === "b" && right.score.movedPiece === "b"
            ? left.score.bishopWhiteKingDistance -
                right.score.bishopWhiteKingDistance ||
              right.score.bishopBlackKingDistance -
                left.score.bishopBlackKingDistance
            : 0);
        assert.equal(
          Math.sign(compareScoresByRules(left.score, right.score, [finalRule])),
          Math.sign(sourcePairComparison),
          `${fen}: ${left.san} vs ${right.san}`,
        );
      }
    }
  }
});

test("coordinate pieces selects the same winner across every survivor order", () => {
  const cases = [
    {
      fen: "7N/8/8/3K4/1k1B4/8/8/8 w - - 14 8",
      survivors: ["Ng6", "Nf7", "Kc6"],
      ideal: "Nf7",
      rejected: ["Ng6", "Kc6"],
      permutationCount: 6,
    },
    {
      fen: "6K1/3N4/3k4/8/8/8/8/3B4 w - - 0 1",
      survivors: ["Nb8", "Nf8", "Nf6", "Nb6", "Ba4", "Bg4"],
      ideal: "Nf8",
      permutationCount: 720,
    },
  ] as const;
  const rulesBeforeFinal = knightAndBishopWhiteRules.slice(0, -1);
  const finalRule = knightAndBishopWhiteRules.at(-1)!;
  const ruleSet = getMateRuleSet("bishop-knight");

  for (const scenario of cases) {
    const candidates = getChess(scenario.fen)
      .moves()
      .map((san) => ({
        san,
        score: scoreKnightAndBishopWhiteMove(scenario.fen, san),
      }));
    const survivorSet = new Set<string>(scenario.survivors);
    const survivors = candidates.filter(({ san }) => survivorSet.has(san));
    assert.deepEqual(
      selectIdealMoves(survivors, rulesBeforeFinal),
      scenario.survivors,
      scenario.fen,
    );
    const survivorPermutations = permutations(survivors);
    assert.equal(survivorPermutations.length, scenario.permutationCount);

    for (const permutation of survivorPermutations) {
      const context = `${scenario.fen}: ${permutation
        .map(({ san }) => san)
        .join(", ")}`;
      assert.deepEqual(
        selectIdealMoves(permutation, [finalRule]),
        [scenario.ideal],
        context,
      );
      assert.deepEqual(
        selectIdealMoves(permutation, knightAndBishopWhiteRules),
        [scenario.ideal],
        context,
      );
    }

    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(scenario.fen), [
      scenario.ideal,
    ]);
    assert.equal(
      ruleSet.currentWhiteHint(scenario.fen)?.id,
      "coordinate pieces",
    );
    assert.equal(
      ruleSet.explainWhiteMove(scenario.fen, scenario.ideal)?.id,
      "coordinate pieces",
    );
    for (const san of scenario.survivors.filter(
      (san) => san !== scenario.ideal,
    )) {
      assert.equal(
        ruleSet.explainWhiteMove(scenario.fen, san)?.id,
        "coordinate pieces",
      );
    }
  }
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

test("prepare fixtures retain their singular source rules and explanations", () => {
  const fixtures = [
    ["8/4k3/4B3/4K3/1N6/8/8/8 w - - 0 1", "Nc6+", "edge cage"],
    ["4k3/8/2N1B3/4K3/8/8/8/8 w - - 0 1", "Kf6", "edge cage"],
    ["4k3/8/4B3/4K3/3N4/8/8/8 w - - 0 1", "Nc6", "edge cage"],
    ["4k3/8/2N1BK2/8/8/8/8/8 w - - 0 1", "Kf5", "edge cage"],
    ["4k3/8/3KB3/8/5N2/8/8/8 w - - 0 1", "Ng6", "edge cage"],
    ["4k3/8/4BK2/4N3/8/8/8/8 w - - 0 1", "Nf7", "knight key square"],
    ["8/8/4B2k/5K2/5N2/8/8/8 w - - 0 1", "Kf6", "knight key square"],
    ["3k4/8/3KB1N1/8/8/8/8/8 w - - 0 1", "Ne5", "knight key square"],
    ["8/7k/4BK2/8/5N2/8/8/8 w - - 0 1", "Ng6", "knight key square"],
    ["8/5K2/4B2k/8/5N2/8/8/8 w - - 0 1", "Kf6", "knight key square"],
  ] as const;
  const ruleSet = getMateRuleSet("bishop-knight");

  for (const [fen, san, reason] of fixtures) {
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [san], fen);
    assert.equal(ruleSet.explainWhiteMove(fen, san)?.id, reason, fen);
    assert.equal(ruleSet.currentWhiteHint(fen)?.id, reason, fen);
  }
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

test("literal source key-square negatives preserve color and edge boundaries", () => {
  const ruleSet = getMateRuleSet("bishop-knight");
  const fixtures = [
    {
      fen: "8/8/4B3/7k/4NK2/8/8/8 w - - 22 12",
      san: "Kf5",
      keySquarePatternScore: 2,
      ideals: ["Bf5"],
      hint: "edge cage",
      explanation: "edge cage",
    },
    {
      fen: "8/8/8/8/B7/1K6/N7/1k6 w - - 6 4",
      san: "Ka3",
      keySquarePatternScore: 2,
      ideals: ["Nb4"],
      hint: "coordinate pieces",
      explanation: "king closer",
    },
  ] as const;

  assert.equal(sameSquareColor("g4", "e6"), true);
  assert.equal(sameSquareColor("g5", "e6"), false);
  for (const fixture of fixtures) {
    assert.equal(
      scoreKnightAndBishopWhiteMove(fixture.fen, fixture.san)
        .keySquarePatternScore,
      fixture.keySquarePatternScore,
      fixture.fen,
    );
    assert.deepEqual(ruleSet.idealWhiteMoves(fixture.fen), fixture.ideals);
    assert.equal(getKnightAndBishopPhaseLabel(fixture.fen), "1/2");
    assert.equal(ruleSet.currentWhiteHint(fixture.fen)?.id, fixture.hint);
    assert.equal(
      ruleSet.explainWhiteMove(fixture.fen, fixture.san)?.id,
      fixture.explanation,
    );
  }
});

test("Zone X geometry, establishment, drift, and forcing match source fixtures", () => {
  assert.deepEqual(
    getKnightAndBishopZone5("4k3/8/2N1B3/4K3/8/8/8/8 w - - 36 19"),
    {
      zoneSquares: ["e8", "f8"],
      escapeSquare: "g7",
      targetKingSquare: "f6",
      stableKnightSquare: "c6",
    },
  );
  assert.deepEqual(
    getKnightAndBishopZone5("1k6/8/1BKN4/8/8/8/8/8 w - - 16 9"),
    {
      zoneSquares: ["b8", "c8"],
      escapeSquare: "d7",
      targetKingSquare: "c6",
      stableKnightSquare: "d6",
    },
  );

  const establishFen = "8/8/4B3/7k/4NK2/8/8/8 w - - 22 12";
  const established = getChess(establishFen);
  established.move("Bf5");
  assert.deepEqual(getKnightAndBishopZoneXSetup(established.fen()), {
    bishopSquare: "f5",
    blackAnchorSquares: ["g5", "h4", "h5", "h6"],
    stableKnightSquares: ["f3", "f7"],
  });
  assert.equal(
    scoreKnightAndBishopWhiteMove(establishFen, "Bf5").zoneXPrepareScore,
    0,
  );
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(establishFen), ["Bf5"]);

  const driftFen = "8/8/8/3N4/8/1BK5/8/1k6 w - - 6 4";
  assert.equal(getKnightAndBishopZoneXKnightDriftTarget(driftFen), "d3");
  assert.equal(
    scoreKnightAndBishopWhiteMove(driftFen, "Nb4").zoneXPrepareScore,
    1,
  );
  assert.equal(
    scoreKnightAndBishopWhiteMove(driftFen, "Nf4").zoneXPrepareScore,
    1,
  );
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(driftFen), ["Nb4"]);

  const forceFen = "3k4/8/3BKN2/8/8/8/8/8 w - - 60 31";
  assert.equal(knightAndBishopWhiteMoveForcesZone5(forceFen, "Kd5"), true);
  assert.equal(knightAndBishopWhiteMoveForcesZone5(forceFen, "Ke5"), false);
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(forceFen), ["Kd5"]);
});

test("literal Zone X preparation and preservation corpus keeps positive and negative branches", () => {
  const ruleSet = getMateRuleSet("bishop-knight");
  const routeFixtures = [
    {
      fen: "8/8/8/8/2N5/2K5/k1B5/8 w - - 14 8",
      target: "b3",
      san: "Nd2",
      routeScore: 1,
      ideals: ["Nd2"],
    },
    {
      fen: "8/8/8/8/8/2K5/2BN4/k7 w - - 20 11",
      target: "b3",
      san: "Nb3+",
      routeScore: 0,
      ideals: ["Nb3+"],
    },
    {
      fen: "8/8/8/8/5N2/5K2/5B1k/8 w - - 14 8",
      target: "g3",
      san: "Ne2",
      routeScore: 1,
      ideals: ["Ne2"],
    },
  ] as const;
  for (const fixture of routeFixtures) {
    assert.equal(
      getKnightAndBishopEstablishedZoneXKnightRouteTarget(fixture.fen),
      fixture.target,
    );
    assert.equal(
      scoreKnightAndBishopWhiteMove(fixture.fen, fixture.san)
        .zoneXEstablishedKnightRouteScore,
      fixture.routeScore,
    );
    assert.deepEqual(ruleSet.idealWhiteMoves(fixture.fen), fixture.ideals);
    assert.equal(getKnightAndBishopPhaseLabel(fixture.fen), "1/2");
    assert.equal(ruleSet.currentWhiteHint(fixture.fen)?.id, "edge cage");
    assert.equal(
      ruleSet.explainWhiteMove(fixture.fen, fixture.san)?.id,
      "edge cage",
    );
  }

  const routeNegativeFen = "8/8/8/8/2N5/2K5/k1B5/8 w - - 14 8";
  assert.equal(
    scoreKnightAndBishopWhiteMove(routeNegativeFen, "Na5")
      .zoneXEstablishedKnightRouteScore,
    99,
  );
  assert.equal(
    scoreKnightAndBishopWhiteMove(routeNegativeFen, "Kd2").zoneXEntryScore,
    0,
  );

  const prepareStarFen = "8/4k3/4B3/4K3/8/2N5/8/8 w - - 0 1";
  assert.equal(
    scoreKnightAndBishopWhiteMove(prepareStarFen, "Nd5+").zoneXPrepareScore,
    2,
  );
  assert.deepEqual(ruleSet.idealWhiteMoves(prepareStarFen), ["Nd5+"]);
  assert.equal(ruleSet.currentWhiteHint(prepareStarFen)?.id, "edge cage");
});

test("king, bishop-front, and knight priorities retain literal source scores", () => {
  const kingFen = "8/8/8/3NK3/2k5/2B5/8/8 w - - 72 37";
  assert.equal(
    scoreKnightAndBishopWhiteMove(kingFen, "Ke4").kingCloserOppositeBishopScore,
    4,
  );
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(kingFen), ["Ke4"]);

  const bishopFrontFen = "8/8/3K4/8/8/2N3kB/8/8 w - - 8 5";
  assert.equal(
    scoreKnightAndBishopWhiteMove(bishopFrontFen, "Be6").bishopInFrontScore,
    0,
  );
  assert.equal(
    scoreKnightAndBishopWhiteMove(bishopFrontFen, "Bf5").bishopInFrontScore,
    1,
  );
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(bishopFrontFen), ["Be6"]);

  const knightFen = "8/8/4N3/4k3/6KB/8/8/8 w - - 8 5";
  assert.equal(
    scoreKnightAndBishopWhiteMove(knightFen, "Nf4").knightWhiteKingDistance,
    1,
  );
  assert.equal(
    scoreKnightAndBishopWhiteMove(knightFen, "Nc5").knightWhiteKingDistance,
    4,
  );
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(knightFen), ["Nf4"]);

  const middle16Fen = "8/8/8/8/8/K7/N7/k2B4 w - - 12 7";
  assert.equal(
    scoreKnightAndBishopWhiteMove(middle16Fen, "Kb3")
      .kingCloserOppositeBishopScore,
    51,
  );
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(middle16Fen), ["Kb3"]);
  assert.equal(
    getMateRuleSet("bishop-knight").currentWhiteHint(middle16Fen)?.id,
    "knight key square",
  );
});

test("literal later-priority corpus pins scores, ideals, phases, and reasons", () => {
  const ruleSet = getMateRuleSet("bishop-knight");
  const positions = [
    {
      fen: "8/8/8/B7/3k1N2/5K2/8/8 w - - 36 19",
      ideals: ["Ng2"],
      hint: "coordinate pieces",
    },
    {
      fen: "8/8/8/2N1B3/4K3/8/3k4/8 w - - 12 7",
      ideals: ["Bd4"],
      hint: "build the wall",
    },
    {
      fen: "8/8/8/3KB3/1k6/4N3/8/8 w - - 32 17",
      ideals: ["Bd4"],
      hint: "build the wall",
    },
    {
      fen: "8/4k3/8/8/4K3/2B5/N7/8 w - - 0 1",
      ideals: ["Be5"],
      hint: "build the wall",
    },
    {
      fen: "8/8/8/2N1B3/4K3/8/2k5/8 w - - 18 10",
      ideals: ["Bd4"],
      hint: "build the wall",
    },
    {
      fen: "8/8/2K5/2B5/N3k3/8/8/8 w - - 46 24",
      ideals: ["Kd6"],
      hint: "king closer",
    },
    {
      fen: "8/8/8/1k1N4/3BK3/8/8/8 w - - 14 8",
      ideals: ["Kd3"],
      hint: "king closer",
    },
    {
      fen: "8/8/5k2/8/5BK1/8/3N4/8 w - - 24 13",
      ideals: ["Kf3"],
      hint: "knight key square",
    },
    {
      fen: "8/8/4B3/1k6/2N5/2K5/8/8 w - - 2 2",
      ideals: ["Nd2"],
      hint: "coordinate pieces",
    },
  ] as const;
  for (const position of positions) {
    assert.deepEqual(ruleSet.idealWhiteMoves(position.fen), position.ideals);
    assert.equal(getKnightAndBishopPhaseLabel(position.fen), "1/2");
    assert.equal(ruleSet.currentWhiteHint(position.fen)?.id, position.hint);
    for (const ideal of position.ideals) {
      assert.equal(
        ruleSet.explainWhiteMove(position.fen, ideal)?.id,
        position.hint,
      );
    }
  }

  const preparationFen = positions[0].fen;
  assert.equal(
    scoreKnightAndBishopWhiteMove(preparationFen, "Bb6+")
      .bishopFrontPreparationScore,
    0,
  );
  assert.equal(
    scoreKnightAndBishopWhiteMove(preparationFen, "Ne6+")
      .bishopFrontPreparationScore,
    99,
  );
  assert.equal(
    ruleSet.explainWhiteMove(preparationFen, "Bb6+")?.id,
    "coordinate pieces",
  );

  const frontSquareFen = positions[1].fen;
  assert.equal(
    scoreKnightAndBishopWhiteMove(frontSquareFen, "Bd4")
      .bishopFrontPreparationScore,
    0,
  );
  assert.equal(
    scoreKnightAndBishopWhiteMove(frontSquareFen, "Bf4+")
      .bishopFrontPreparationScore,
    0,
  );
  assert.equal(
    scoreKnightAndBishopWhiteMove(frontSquareFen, "Ne6")
      .bishopFrontPreparationScore,
    99,
  );

  const bishopDistanceFen = positions[2].fen;
  assert.equal(
    scoreKnightAndBishopWhiteMove(bishopDistanceFen, "Bd6+")
      .bishopBlackKingDistance,
    4,
  );
  assert.equal(
    scoreKnightAndBishopWhiteMove(bishopDistanceFen, "Bd4")
      .bishopBlackKingDistance,
    2,
  );

  const bishopFrontFen = positions[3].fen;
  assert.equal(
    scoreKnightAndBishopWhiteMove(bishopFrontFen, "Be5").bishopInFrontScore,
    0,
  );
  assert.equal(
    scoreKnightAndBishopWhiteMove(bishopFrontFen, "Kd5").bishopInFrontScore,
    1,
  );

  const regressionFen = positions[4].fen;
  assert.equal(
    scoreKnightAndBishopWhiteMove(regressionFen, "Bd4")
      .kingDistanceRegressionScore,
    0,
  );
  assert.equal(
    scoreKnightAndBishopWhiteMove(regressionFen, "Kf5")
      .kingDistanceRegressionScore,
    10,
  );
  assert.equal(
    ruleSet.explainWhiteMove(regressionFen, "Kf5")?.id,
    "build the wall",
  );

  const diagonalFen = positions[5].fen;
  assert.equal(
    scoreKnightAndBishopWhiteMove(diagonalFen, "Kd6")
      .kingCloserOppositeBishopScore,
    5,
  );

  const maintainFrontFen = positions[6].fen;
  assert.equal(
    scoreKnightAndBishopWhiteMove(maintainFrontFen, "Ne3").bishopInFrontScore,
    0,
  );

  const oppositionFen = positions[7].fen;
  assert.equal(isKnightAndBishopBishopOppositionLoopShape(oppositionFen), true);
  const bishopLoop = scoreKnightAndBishopWhiteMove(oppositionFen, "Bg5+");
  assert.equal(bishopLoop.bishopOppositionLoopScore, 1);
  assert.equal(bishopLoop.bishopInFrontScore, 1);
  assert.equal(
    scoreKnightAndBishopWhiteMove(oppositionFen, "Nf3")
      .bishopOppositionLoopScore,
    0,
  );

  const knightOrderingFen = "8/8/8/8/1B1k4/N4K2/8/8 w - - 12 7";
  assert.equal(
    scoreKnightAndBishopWhiteMove(knightOrderingFen, "Nc2+")
      .knightWhiteKingDistance,
    3,
  );
  assert.equal(
    scoreKnightAndBishopWhiteMove(knightOrderingFen, "Nb5+")
      .knightWhiteKingDistance,
    4,
  );
  assert.equal(
    scoreKnightAndBishopWhiteMove(knightOrderingFen, "Nb1")
      .knightCentralDistance,
    5,
  );

  const knightTieFen = "8/8/8/8/8/B7/5K2/1N5k w - - 0 1";
  const nc3 = scoreKnightAndBishopWhiteMove(knightTieFen, "Nc3");
  const nd2 = scoreKnightAndBishopWhiteMove(knightTieFen, "Nd2");
  assert.equal(nc3.knightCentralDistance, 2);
  assert.equal(nd2.knightCentralDistance, 2);
  assert.equal(nc3.knightBlackKingDistance, 7);
  assert.equal(nd2.knightBlackKingDistance, 5);

  const behindFen = "8/8/8/3k4/4N3/5K2/8/B7 w - - 14 8";
  assert.equal(
    scoreKnightAndBishopWhiteMove(behindFen, "Nc5").knightBehindWhiteKingScore,
    1,
  );
  assert.equal(
    scoreKnightAndBishopWhiteMove(behindFen, "Bc3").knightBehindWhiteKingScore,
    1,
  );
  assert.equal(
    scoreKnightAndBishopWhiteMove(behindFen, "Ng3").knightBehindWhiteKingScore,
    0,
  );
  assert.equal(
    scoreKnightAndBishopWhiteMove(behindFen, "Nf2").knightBehindWhiteKingScore,
    0,
  );
});

test("wrong moves explain the first rule that prefers a better move", () => {
  const fen = "8/4k3/4B3/4K3/1N6/8/8/8 w - - 0 1";
  const ruleSet = getMateRuleSet("bishop-knight");
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ["Nc6+"]);
  assert.equal(ruleSet.explainWhiteMove(fen, "Bd7")?.id, "minors safe");
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, "edge cage");
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

test("the bishop-wall edge handoff resolves the dominant local loop", () => {
  const fen = "8/8/1k6/3K4/4N3/8/7B/8 w - - 0 1";
  for (let tieSeed = 0; tieSeed < 16; tieSeed += 1) {
    const result = playDeterministicSelfPlay(fen, 42_000 + tieSeed);
    assert.equal(result.chess.isCheckmate(), true, result.moves.join(" "));
    assert.ok(result.moves.length <= 80, result.moves.join(" "));
  }
});

test("source Standard samples either mate or report a tracked residual loop", () => {
  const starts = [
    "6k1/B7/8/7K/6N1/8/8/8 w - - 0 1",
    "k7/8/5K2/8/1N6/8/8/2B5 w - - 0 1",
    "k7/7K/8/8/2B5/2N5/8/8 w - - 0 1",
    "k6B/8/2N5/K7/8/8/8/8 w - - 0 1",
  ] as const;

  const residualLoops: string[] = [];
  starts.forEach((fen, startIndex) => {
    for (let tieSeed = 0; tieSeed < 4; tieSeed += 1) {
      const result = playDeterministicSelfPlay(
        fen,
        99_000 + startIndex * 100 + tieSeed,
        220,
        true,
      );
      if (result.preMatingNetLoop) {
        residualLoops.push(result.preMatingNetLoop);
        continue;
      }
      assert.equal(result.phaseTwoReached, true, fen);
      assert.equal(result.chess.isCheckmate(), true, result.moves.join(" "));
      assert.ok(result.moves.length <= 51, result.moves.join(" "));
    }
  });
  assert.ok(residualLoops.length < starts.length * 4);
});

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
