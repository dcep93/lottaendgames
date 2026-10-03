import type {RuleHelp} from "./types";
import {BLACK_CAPTURE_PRIORITY, BLACK_RETURN_PRIORITY} from "./blackPriorities";

export const bishopKnightHelp: RuleHelp = {
  title: "How best moves are chosen",
  whiteIntro:
    "Use r3 to reach a central king, bishop and knight, with king and knight opposite the bishop’s color; r2 reaches the r1 net, and r1 finishes checkmate.",
  blackIntro:
    "Black uses its own priorities to put up the strongest resistance. Black is trying to resist the mate, and looks for the most stubborn legal reply.",
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
    caption: "Start from the central formation: Kd4, Ne5 and either Be4 or Bd5. The r2 lookup minimizes the worst-case number of White moves until reaching the fixed r1 net, against every legal Black reply. Immediate checkmate still takes priority.",
    pieces: [{square: "d4", piece: "K"}, {square: "e4", piece: "B"}, {square: "e5", piece: "N"}, {square: "g1", piece: "k"}],
    highlights: [],
  }],
  notes: [
    "For r3, central means d4, e4, d5 and e5. The lookup minimizes the worst-case number of White moves to the central formation against every legal Black reply. Existing r1 and r2 positions take priority. Rotations and reflections apply.",
    "The combined r3, r2 and r1 policy forces mate from every winning KBN-v-K start within 44 White moves against every legal Black reply, starting with a fresh halfmove clock. Immediate mate, piece safety and avoiding stalemate remain higher priorities.",
  ],
};
