import type {OrderedRule} from "./types";
import type {KnightAndBishopWhiteMoveScore} from "./bishopKnightScores";

const whiteRules: readonly OrderedRule<KnightAndBishopWhiteMoveScore>[] =
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
      shortLabel: "rule r1",
      helpText: "Execute the mating net.",
      compare: (first, second) => first.matingNetPenalty - second.matingNetPenalty,
    },
    {
      id: "r2",
      shortLabel: "rule r2",
      helpText: "Force Black into the mating net.",
      compare: (first, second) => first.sevenCagePenalty - second.sevenCagePenalty,
    },
    {
      id: "r3",
      shortLabel: "rule r3",
      helpText: "Achieve a central knight and king both opposite the bishop’s color, as well as a central bishop.",
      compare: (first, second) => first.centralSetupLookupPenalty - second.centralSetupLookupPenalty,
    },
    {
      id: "r4",
      shortLabel: "rule r4",
      helpText: "With a central king and central 16 knight, prefer king protection of the knight, maneuver the knight to a central square opposite the bishop's color, then navigate to a central bishop and the king to a central square opposite the bishop's color.",
      applies: score => score.startsWithCentralKingAndMiddle16Knight || score.declaredCentralNavigationPenalty !== undefined
        || score.protectedCentralManeuverPenalty !== undefined
        || score.startsWithProtectedOppositeCentralKnight,
      compare: (first, second) => (first.declaredCentralNavigationPenalty ?? 0) - (second.declaredCentralNavigationPenalty ?? 0)
        || (first.protectedCentralManeuverPenalty ?? 0) - (second.protectedCentralManeuverPenalty ?? 0)
        || first.centralSetupBoundaryPenalty - second.centralSetupBoundaryPenalty
        || first.kingKnightAdjacencyPenalty - second.kingKnightAdjacencyPenalty
        || first.knightOppositeCentralDistance - second.knightOppositeCentralDistance
        || first.bishopKingCentralCompletionPenalty - second.bishopKingCentralCompletionPenalty
        || first.bishopKingCentralNavigationScore - second.bishopKingCentralNavigationScore,
    },
    {
      id: "r5.1",
      shortLabel: "rule r5.1",
      helpText: "Escape rare degenerate positions.",
      compare: (first, second) => first.rareEscapePenalty - second.rareEscapePenalty,
    },
    {
      id: "r5.2",
      shortLabel: "rule r5.2",
      helpText: "Prevent loss of a piece.",
      compare: (first, second) => first.piecePreservationPenalty - second.piecePreservationPenalty,
    },
    {
      id: "r6.1",
      shortLabel: "rule r6.1",
      helpText: "Step the king towards the knight without screening the bishop.",
      compare: (first, second) => Number(second.kingStepsTowardKnight) - Number(first.kingStepsTowardKnight),
    },
    {
      id: "r6.2",
      shortLabel: "rule r6.2",
      helpText: "Prefer the king to defend the knight. Otherwise, drift a protective stable bishop when a piece is attackable.",
      compare: (first, second) => first.knightDefensePenalty - second.knightDefensePenalty,
    },
    {
      id: "r6.3",
      shortLabel: "rule r6.3",
      helpText: "Prefer knight proximity to the White king, then proximity to the center.",
      compare: (first, second) => first.knightKingProximityScore - second.knightKingProximityScore
        || first.knightCentralProximityScore - second.knightCentralProximityScore,
    },
    {
      id: "r6.4",
      shortLabel: "rule r6.4",
      helpText: "When Black’s king prevents approach of the center, navigate the bishop to open a path.",
      compare: (first, second) => first.bishopCentralPathDistance - second.bishopCentralPathDistance,
    },
    {
      id: "r7.1",
      shortLabel: "rule r7.1",
      helpText: "Prefer king central proximity.",
      compare: (first, second) => first.kingCenterEuclideanScore - second.kingCenterEuclideanScore,
    },
    {
      id: "r7.2",
      shortLabel: "rule r7.2",
      helpText: "Maximize unprotected piece distance from Black's king, then prefer central proximity.",
      compare: (first, second) => first.unprotectedMinorCount - second.unprotectedMinorCount
        || first.minorBlackDistanceScore - second.minorBlackDistanceScore
        || first.minorCenterDistanceScore - second.minorCenterDistanceScore,
    },
  ];

export const knightAndBishopWhiteRules = whiteRules.map((rule, index) => index < 5 ? rule : ({
    ...rule,
    applies: (score: KnightAndBishopWhiteMoveScore) => score.stage === 0 && (rule.applies?.(score) ?? true),
  }));
