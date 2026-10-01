import type {RuleHelp} from "./types";
import {BLACK_CAPTURE_PRIORITY, BLACK_RETURN_PRIORITY} from "./blackPriorities";

export const bishopKnightHelp: RuleHelp = {
  title: "How best moves are chosen",
  whiteIntro:
    "Use r4 and later rules to build the r2 formation, r2 to reach the r1 net, and r1 to finish checkmate.",
  blackIntro:
    "Black uses its own priorities to put up the strongest resistance. Black is not trying to help the mate; it looks for the most stubborn legal reply.",
  blackPriorities: [
    BLACK_CAPTURE_PRIORITY,
    BLACK_RETURN_PRIORITY,
    "In the W maneuver, or when any reply enters the finishing route, treat every legal reply as equally strong.",
    "Move toward an unprotected bishop or knight.",
    "Run toward the center.",
    "Keep as many legal king moves as possible.",
    "Stay away from White's king.",
    "Stay away from a bishop-colored corner.",
  ],
  noteBoards: [{
    id: "bishop-knight-rule-r1-net",
    title: "rule r1 — Execute the mating net",
    caption: "From Kc3, Ba2, Nc2 and Black Kc1, r1 carries every continuation to checkmate. Only edges reachable from this start qualify for r1; immediate checkmate still takes priority as mate. Moves entering the net from outside belong to r2. Rotations and reflections apply.",
    animationSrc: "/mate/bishop-knight/r1-mating-net.gif",
    animationAlt: "A verified continuation from the r1 start with Black on c1 to checkmate.",
    pieces: [{square: "c3", piece: "K"}, {square: "a2", piece: "B"}, {square: "c2", piece: "N"}, {square: "c1", piece: "k"}],
    highlights: [],
  }, {
    id: "bishop-knight-rule-r2-start",
    title: "rule r2 — Force Black into the mating net",
    caption: "Start from a satisfied r4 formation: Kd4, Ne5 and either Be4 or Bd5. The r2 lookup minimizes the worst-case number of White moves until reaching the fixed r1 net, against every legal Black reply. Immediate checkmate still takes priority.",
    pieces: [{square: "d4", piece: "K"}, {square: "e4", piece: "B"}, {square: "e5", piece: "N"}, {square: "g1", piece: "k"}],
    highlights: [],
  }, {
    id: "bishop-knight-rule-r41-a",
    title: "rule r5.1(a) — Bring the bishop beside the knight",
    caption: "White’s edge king is edge-adjacent to its edge bishop. Black opposes the bishop inward from the edge. The knight is three diagonal steps away, on the side away from White’s king. Play Bc4, adjacent to Nd3. Rotations and reflections apply.",
    pieces: [{square: "a7", piece: "K"}, {square: "a6", piece: "B"}, {square: "c6", piece: "k"}, {square: "d3", piece: "N"}],
    highlights: [{square: "c4", kind: "key"}],
    arrows: [{from: "a6", to: "c4"}],
  }, {
    id: "bishop-knight-rule-r41-b",
    title: "rule r5.1(b) — Nf5",
    caption: "With Ka1, Bb1 and Nd4, play Nf5 regardless of Black’s king position. Avoid recreating this White formation. Apply D4 rotations and reflections only; ignore move counters.",
    pieces: [{square: "a1", piece: "K"}, {square: "b1", piece: "B"}, {square: "d4", piece: "N"}, {square: "c4", piece: "k"}],
    highlights: [{square: "f5", kind: "key"}],
    arrows: [{from: "d4", to: "f5"}],
  }, {
    id: "bishop-knight-rule-r41-c",
    title: "rule r5.1(c) — Ke1",
    caption: "Exact arrangement: Kf1, Bh1, Nf2 and Black Ke3. Play Ke1. Apply D4 rotations and reflections only; ignore move counters.",
    pieces: [{square: "f1", piece: "K"}, {square: "h1", piece: "B"}, {square: "f2", piece: "N"}, {square: "e3", piece: "k"}],
    highlights: [{square: "e1", kind: "key"}],
    arrows: [{from: "f1", to: "e1"}],
  }, {
    id: "bishop-knight-rule-r41-d",
    title: "rule r5.1(d) — Bc4",
    caption: "Exact arrangement: Ke2, Bd3, Ne3 and Black Kd4. Play Bc4. Apply D4 rotations and reflections only; ignore move counters.",
    pieces: [{square: "e2", piece: "K"}, {square: "d3", piece: "B"}, {square: "e3", piece: "N"}, {square: "d4", piece: "k"}],
    highlights: [{square: "c4", kind: "key"}],
    arrows: [{from: "d3", to: "c4"}],
  }, {
    id: "bishop-knight-rule-r6.4-step",
    title: "rule r6.4 — Open a path",
    caption: "Black blocks Kc4 while White keeps Nc3 protected. Be4+ puts the bishop on a diagonal controlling Black’s blocking square d3. Apply rotations and reflections; earlier priorities still apply.",
    pieces: [{square: "b4", piece: "K"}, {square: "c3", piece: "N"}, {square: "d3", piece: "k"}, {square: "h1", piece: "B"}],
    highlights: [{square: "c4", kind: "key"}],
    arrows: [{from: "h1", to: "e4"}],
  }],
  notes: [
    "For r6.2, the exact placement White Kb5, Ba6, Nb4 and Black Kb8 or Ka7 prefers Kc5, including rotations and reflections. This is a starting-position exception, not a general preference for advancing the defending king.",
    "For r6.4, check whether Black blocks every more-central king step, retaining existing king protection of the knight. Route the bishop toward control of a same-color blocking or shuffling square. Use static bishop routes with occupied squares and safe landings; do not claim a forced advance against every reply. Once a central king step is available, r6.4 is inactive.",
    "For r6.2, prefer king protection of the knight. Attackability is checked before White moves: a piece must not be king-defended, and Black must already attack it or have a legal move that attacks it. When either piece is attackable, existing or newly established stable bishop protection counts regardless of which piece moves. Either a bishop move preparing a knight jump or a knight move preparing a bishop move can set up stable protection next turn; setup and established protection are equally preferred. An initially attackable knight left without protection or a protection setup ranks below ordinary moves. Stable bishop protection includes squares adjacent to edge bishops and respects White king blockers. For r6.3, prefer knight king-step proximity to White’s king, then Euclidean proximity to the center, regardless of square color.",
    "For r7.1, minimize White’s king Euclidean distance to the nearest of d4, e4, d5 or e5. For r7.2, identify unprotected minor pieces before White moves, then maximize their resulting Euclidean distance from Black’s king. Finally minimize the sum of both minor pieces’ resulting Euclidean distances to the board’s midpoint.",
    "The r1 and r2 continuations cover every legal Black reply from their declared starts. Their termination check ignores move counters; it does not promise mate within the fifty-move limit or prove that every arbitrary position reaches r2.",
  ],
};
