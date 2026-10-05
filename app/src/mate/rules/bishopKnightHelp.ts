import type {RuleHelp} from "./types";
import {BLACK_CAPTURE_PRIORITY, BLACK_RETURN_PRIORITY} from "./blackPriorities";

export const bishopKnightHelp: RuleHelp = {
  title: "How best moves are chosen",
  whiteIntro:
    "Build a central trio with king and knight opposite the bishop’s color, herd Black into the mating net, and finish checkmate.",
  blackIntro:
    "Black uses its own priorities to put up the strongest resistance. Black is trying to resist the mate, and looks for the most stubborn legal reply.",
  blackPriorities: [
    "After White plays a mating-net move, choose randomly from all legal replies.",
    BLACK_CAPTURE_PRIORITY,
    BLACK_RETURN_PRIORITY,
    "Move toward an unprotected bishop or knight.",
    "Run toward the center.",
    "Keep as many legal king moves as possible.",
    "Stay away from White's king.",
    "Stay away from a bishop-colored corner.",
  ],
  noteBoards: [{
    id: "bishop-knight-rule-r3-start",
    title: "Central trio",
    caption: "",
    pieces: [{square: "e5", piece: "K"}, {square: "d5", piece: "B"}, {square: "d4", piece: "N"}, {square: "b8", piece: "k"}],
    highlights: [],
  }, {
    id: "bishop-knight-rule-r2-start",
    title: "Herd the king",
    caption: "",
    pieces: [{square: "f6", piece: "K"}, {square: "h7", piece: "B"}, {square: "f7", piece: "N"}, {square: "f8", piece: "k"}],
    highlights: [],
  }, {
    id: "bishop-knight-rule-r1-net",
    title: "Mating net",
    caption: "",
    animationSrc: "/mate/bishop-knight/r1-mating-net.gif",
    animationAlt: "The mating net, beginning with Bh7 and ending with Bc6 checkmate.",
    pieces: [{square: "f6", piece: "K"}, {square: "f5", piece: "B"}, {square: "f7", piece: "N"}, {square: "f8", piece: "k"}],
    highlights: [],
  }],
  notes: [
    "There are a few different approaches, but I believe [Naroditsky's W Maneuver](https://www.youtube.com/watch?v=oRK7XLhGz_c) is the best way to learn the bishop + knight checkmate.",
    "Personally, when playing a game or practicing, I have significant trouble forcing black into a corner to begin the mating net pattern. This difficulty is what inspired me to create this app!",
    "Step 1, put your pieces in the middle.",
    "Step 2, force black into the mating net.",
    "Step 3, execute the mating net.",
    'Jump to a future step when possible.',
    "The training wheels toggle preloads the start of step 3. These moves should be played accurately for any combination of Black's evasion.",
    'In a previous iteration of this app, I had human-understandable rules for steps 1 and 2, but there were way too many rules (2 bishops is complex enough!), and it wasn\'t really useful. If you have ideas on an algorithm, let\'s work together!',
    'For now, "best move" is just the one that forces black to the next step fastest. Feel free to get creative for steps 1 and 2, but step 3 should be memorized for this approach.',
  ],
};
