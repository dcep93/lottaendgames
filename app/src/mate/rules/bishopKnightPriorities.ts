import type {OrderedRule} from "./types";
import type {KnightAndBishopWhiteMoveScore} from "./bishopKnightScores";

export const knightAndBishopWhiteRules: readonly OrderedRule<KnightAndBishopWhiteMoveScore>[] =
  [
    {
      id: "mate",
      shortLabel: "mate",
      helpText: "",
      compare: (first, second) => first.mateScore - second.mateScore,
    },
    {
      id: "minors safe",
      shortLabel: "pieces safe",
      helpText: "",
      compare: (first, second) =>
        first.pieceSafetyScore - second.pieceSafetyScore,
    },
    {
      id: "no stalemate",
      shortLabel: "no stalemate",
      helpText: "",
      compare: (first, second) => first.stalemateScore - second.stalemateScore,
    },
    {
      id: "r1",
      shortLabel: "mating net",
      helpText: "Execute the mating net.",
      compare: (first, second) => first.matingNetPenalty - second.matingNetPenalty,
    },
    {
      id: "r2",
      shortLabel: "herd the king",
      helpText: "Force Black into the mating net.",
      compare: (first, second) => first.sevenCagePenalty - second.sevenCagePenalty,
    },
    {
      id: "r3",
      applies: score => score.stage === 0,
      shortLabel: "central trio",
      helpText: "Achieve a central knight and king both opposite the bishop’s color, as well as a central bishop.",
      compare: (first, second) => first.centralSetupLookupPenalty - second.centralSetupLookupPenalty,
    },
  ];
