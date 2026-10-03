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
    id: "bishop-knight-rule-r3-start",
    title: "r3",
    caption: "",
    pieces: [{square: "e5", piece: "K"}, {square: "d5", piece: "B"}, {square: "d4", piece: "N"}, {square: "b8", piece: "k"}],
    highlights: [],
  }, {
    id: "bishop-knight-rule-r2-start",
    title: "r2",
    caption: "Starting position of the mating net.",
    pieces: [{square: "f6", piece: "K"}, {square: "h7", piece: "B"}, {square: "f7", piece: "N"}, {square: "f8", piece: "k"}],
    highlights: [],
  }, {
    id: "bishop-knight-rule-r1-net",
    title: "r1",
    caption: "A continuation of the mating net to checkmate.",
    animationSrc: "/mate/bishop-knight/r1-mating-net.gif",
    animationAlt: "The mating net, beginning with Bh7 and ending with Bc6 checkmate.",
    pieces: [{square: "f6", piece: "K"}, {square: "f5", piece: "B"}, {square: "f7", piece: "N"}, {square: "f8", piece: "k"}],
    highlights: [],
  }],
  notes: [
    "There are a few different approaches, but I believe [Naroditsky's W Maneuver](https://www.youtube.com/watch?v=oRK7XLhGz_c) is the best way to learn the bishop + knight checkmate.",
    "Personally, I have significant trouble forcing black into a corner to begin the mating net pattern. This difficulty is what inspired me to create this app!",
    "Step 1, put your pieces in the middle.",
    "Step 2, force black into the mating net.",
    "Step 3, execute the mating net.",
    'Jump to a future step when possible. In a previous iteration of this app, I had human-understandable rules for steps 1 and 2, but there were way too many rules (2 bishops is complex enough!), and it wasn\'t really useful. If you have ideas on an algorithm, let\'s work together! For now, "best move" is just the one that forces black to the next step fastest. That\'s not so useful, unless you get stuck.',
  ],
};
