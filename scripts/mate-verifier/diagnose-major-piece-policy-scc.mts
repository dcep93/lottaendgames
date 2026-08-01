import type { MateId } from "../../app/src/mate/types.ts";
import { getMateRuleSet } from "../../app/src/mate/rules/index.ts";
import {
  createProductionMateAdapter,
  enumerateProductionMateRoots,
  type ProductionMateStateKeyMode,
  type ProductionMateVerificationState,
} from "./production.mts";
import { MatePolicySccSession } from "./policy-scc.mts";
import { sampleBishopKnightRoots } from "./bishop-knight-root-sampler.mts";
import {
  sampleTwoBishopsRoots,
  updateAdversarialTwoBishopsRoots,
} from "./two-bishops-root-sampler.mts";
import type { MateVerificationRoot } from "./types.mts";

type Options = {
  readonly mateId: MateId;
  readonly maxRoots?: number;
  readonly progressEvery: number;
  readonly sampleRoots?: number;
  readonly sampleSeed: number;
  readonly stateKeyMode: ProductionMateStateKeyMode;
  readonly updateAdversarialCorpus: boolean;
  readonly witnessLimit?: number;
};

const options = parseOptions(process.argv.slice(2));
const startedAt = Date.now();
const sample =
  options.sampleRoots === undefined
    ? undefined
    : options.mateId === "bishop-knight"
      ? sampleBishopKnightRoots(options.sampleRoots, options.sampleSeed)
      : sampleTwoBishopsRoots(options.sampleRoots, options.sampleSeed);
const session = new MatePolicySccSession(
  createProductionMateAdapter(options.mateId, {
    stateKeyMode: options.stateKeyMode,
  }),
  {
    onProgress: (progress) => console.error(JSON.stringify(progress)),
    progressEvery: options.progressEvery,
  },
);
const rung = session.extend(
  sample?.roots ??
    limitedRoots(
      enumerateProductionMateRoots(options.mateId),
      options.maxRoots,
    ),
);
const result = rung.result;
const loopFamilies = groupLoopFamilies(result.cyclicComponents);
const reasonFamilies = groupLoopReasonFamilies(
  options.mateId,
  result.cyclicComponents,
);
const adversarialCorpusUpdate = options.updateAdversarialCorpus
  ? updateAdversarialTwoBishopsRoots([
      ...result.cyclicComponents.flatMap(({ witness }) =>
        witness.transitions[0]?.fromState
          ? [witness.transitions[0].fromState]
          : [],
      ),
      ...result.failureSamples.map(({ fromState }) => fromState),
    ])
  : undefined;

console.log(
  JSON.stringify({
    adversarialCorpusUpdate:
      adversarialCorpusUpdate === undefined
        ? null
        : {
            added: adversarialCorpusUpdate.added,
            totalRoots: adversarialCorpusUpdate.roots.length,
          },
    cyclicComponents: result.cyclicComponents
      .slice(0, options.witnessLimit)
      .map((component) => ({
        componentSize: component.nodeKeys.length,
        edgeCount: component.edgeCount,
        witness: component.witness,
      })),
    elapsedMs: Date.now() - startedAt,
    incrementalCache: rung.cache,
    failureSamples: result.failureSamples,
    loopFamilies,
    reasonFamilies: reasonFamilies.slice(0, options.witnessLimit),
    mateId: options.mateId,
    maxRoots: options.maxRoots ?? null,
    rootSelection:
      sample === undefined
        ? options.maxRoots === undefined
          ? { kind: "complete-standard-universe" }
          : { count: options.maxRoots, kind: "enumeration-prefix" }
        : {
            candidateRoots: sample.candidateRoots,
            corpusRoots: sample.corpusRoots,
            count: sample.roots.length,
            kind: "prefix-stable-fixed-seed-sample-plus-corpus",
            sampledRoots:
              "sampledRoots" in sample ? sample.sampledRoots : null,
            seed: sample.seed,
            strata: sample.strata,
          },
    stateKeyMode: options.stateKeyMode,
    stats: result.stats,
    status: result.status,
    witnessLimit: options.witnessLimit ?? null,
  }),
);

process.exitCode = result.status === "cyclic" ? 1 : 0;

function parseOptions(args: readonly string[]): Options {
  let mateId: MateId = "rook";
  let maxRoots: number | undefined;
  let progressEvery = 10_000;
  let sampleRoots: number | undefined;
  let sampleSeed = 0x2b15_40cc;
  let stateKeyMode: ProductionMateStateKeyMode = "symmetry";
  let updateAdversarialCorpus = false;
  let witnessLimit: number | undefined;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const value = args[index + 1];
    if (arg === "--mate") {
      mateId = parseMateId(value);
      index += 1;
      continue;
    }
    if (arg === "--max-roots") {
      maxRoots = positiveInteger(value, "--max-roots");
      index += 1;
      continue;
    }
    if (arg === "--progress-every") {
      progressEvery = positiveInteger(value, "--progress-every");
      index += 1;
      continue;
    }
    if (arg === "--sample-roots") {
      sampleRoots = positiveInteger(value, "--sample-roots");
      index += 1;
      continue;
    }
    if (arg === "--sample-seed") {
      sampleSeed = uint32(value, "--sample-seed");
      index += 1;
      continue;
    }
    if (arg === "--identity") {
      stateKeyMode = "identity";
      continue;
    }
    if (arg === "--symmetry") {
      stateKeyMode = "symmetry";
      continue;
    }
    if (arg === "--update-adversarial-corpus") {
      updateAdversarialCorpus = true;
      continue;
    }
    if (arg === "--witness-limit") {
      witnessLimit = positiveInteger(value, "--witness-limit");
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument ${String(arg)}`);
  }
  if (maxRoots !== undefined && sampleRoots !== undefined) {
    throw new Error("--max-roots and --sample-roots are mutually exclusive");
  }
  if (
    sampleRoots !== undefined &&
    mateId !== "two-bishops" &&
    mateId !== "bishop-knight"
  ) {
    throw new Error(
      "--sample-roots currently supports two-bishops and bishop-knight",
    );
  }
  if (updateAdversarialCorpus && mateId !== "two-bishops") {
    throw new Error(
      "--update-adversarial-corpus currently supports only two-bishops",
    );
  }
  return {
    mateId,
    ...(maxRoots === undefined ? {} : { maxRoots }),
    progressEvery,
    ...(sampleRoots === undefined ? {} : { sampleRoots }),
    sampleSeed,
    stateKeyMode,
    updateAdversarialCorpus,
    ...(witnessLimit === undefined ? {} : { witnessLimit }),
  };
}

function parseMateId(value: string | undefined): MateId {
  if (
    value === "queen" ||
    value === "rook" ||
    value === "two-bishops" ||
    value === "bishop-knight" ||
    value === "two-knights-pawn"
  ) {
    return value;
  }
  throw new Error(
    "--mate requires queen, rook, two-bishops, bishop-knight, or two-knights-pawn",
  );
}

function positiveInteger(value: string | undefined, option: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${option} requires a positive integer`);
  }
  return parsed;
}

function uint32(value: string | undefined, option: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0 || parsed > 0xffff_ffff) {
    throw new Error(`${option} requires an integer from 0 through 4294967295`);
  }
  return parsed;
}

function* limitedRoots(
  roots: Iterable<MateVerificationRoot<ProductionMateVerificationState>>,
  maxRoots: number | undefined,
): Generator<MateVerificationRoot<ProductionMateVerificationState>> {
  let count = 0;
  for (const root of roots) {
    if (maxRoots !== undefined && count >= maxRoots) return;
    count += 1;
    yield root;
  }
}

function groupLoopReasonFamilies(
  mateId: MateId,
  components: typeof result.cyclicComponents,
): Array<{
  componentCount: number;
  cyclicStates: number;
  reasons: readonly string[];
  witness: (typeof result.cyclicComponents)[number]["witness"];
}> {
  const ruleSet = getMateRuleSet(mateId);
  const grouped = new Map<
    string,
    {
      componentCount: number;
      cyclicStates: number;
      reasons: readonly string[];
      witness: (typeof result.cyclicComponents)[number]["witness"];
    }
  >();
  for (const component of components) {
    const reasons = canonicalReasonCycle(
      component.witness.transitions.map(
        ({ fromState }) =>
          ruleSet.currentWhiteHint(fromState)?.id ?? "rule gap",
      ),
    );
    const key = reasons.join(" → ");
    const family = grouped.get(key);
    if (family) {
      family.componentCount += 1;
      family.cyclicStates += component.nodeKeys.length;
    } else {
      grouped.set(key, {
        componentCount: 1,
        cyclicStates: component.nodeKeys.length,
        reasons,
        witness: component.witness,
      });
    }
  }
  return [...grouped.values()].sort(
    (first, second) =>
      second.componentCount - first.componentCount ||
      second.cyclicStates - first.cyclicStates ||
      first.reasons.join(" → ").localeCompare(second.reasons.join(" → ")),
  );
}

function canonicalReasonCycle(reasons: readonly string[]): readonly string[] {
  if (reasons.length < 2) return reasons;
  const collapsed = reasons.filter(
    (reason, index) => index === 0 || reason !== reasons[index - 1],
  );
  if (
    collapsed.length > 1 &&
    collapsed[0] === collapsed[collapsed.length - 1]
  ) {
    collapsed.pop();
  }
  if (collapsed.length < 2) return collapsed;
  const rotations = collapsed.map((_, offset) => [
    ...collapsed.slice(offset),
    ...collapsed.slice(0, offset),
  ]);
  return rotations.sort((first, second) =>
    first.join("\u0000").localeCompare(second.join("\u0000")),
  )[0]!;
}

type LoopFamilyId =
  | "bishop-wall-shuffle"
  | "king-opposition-oscillation"
  | "mixed-plan-oscillation";

function groupLoopFamilies(components: typeof result.cyclicComponents): Array<{
  componentCount: number;
  cyclicStates: number;
  id: LoopFamilyId;
  witness: (typeof result.cyclicComponents)[number]["witness"];
}> {
  const grouped = new Map<
    LoopFamilyId,
    {
      componentCount: number;
      cyclicStates: number;
      id: LoopFamilyId;
      witness: (typeof result.cyclicComponents)[number]["witness"];
    }
  >();
  for (const component of components) {
    const whiteMoves = component.witness.moves.filter(
      (_move, index) => index % 2 === 0,
    );
    const id: LoopFamilyId = whiteMoves.every((move) => move.startsWith("B"))
      ? "bishop-wall-shuffle"
      : whiteMoves.every((move) => move.startsWith("K"))
        ? "king-opposition-oscillation"
        : "mixed-plan-oscillation";
    const family = grouped.get(id);
    if (family) {
      family.componentCount += 1;
      family.cyclicStates += component.nodeKeys.length;
    } else {
      grouped.set(id, {
        componentCount: 1,
        cyclicStates: component.nodeKeys.length,
        id,
        witness: component.witness,
      });
    }
  }
  return [...grouped.values()].sort((first, second) =>
    first.id.localeCompare(second.id),
  );
}
