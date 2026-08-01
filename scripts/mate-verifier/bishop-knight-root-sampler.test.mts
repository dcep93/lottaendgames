import assert from "node:assert/strict";
import test from "node:test";
import { canonicalVerifierPositionKey } from "./production.mts";
import {
  readAdversarialBishopKnightRoots,
  sampleBishopKnightRoots,
} from "./bishop-knight-root-sampler.mts";

test("Bishop + Knight samples are fixed-seed, unique, and D4-canonical", () => {
  const first = sampleBishopKnightRoots(24, 12345);
  const second = sampleBishopKnightRoots(24, 12345);
  const differentSeed = sampleBishopKnightRoots(24, 54321);
  const states = first.roots.map(({ state }) => state);

  assert.deepEqual(
    states,
    second.roots.map(({ state }) => state),
  );
  assert.notDeepEqual(
    states,
    differentSeed.roots.map(({ state }) => state),
  );
  assert.equal(new Set(states).size, states.length);
  for (const state of states) {
    assert.equal(
      state.split(" ").slice(0, 4).join(" "),
      canonicalVerifierPositionKey("bishop-knight", state),
    );
  }
  assert.ok(Object.keys(first.strata).length > 8);
});

test("every Bishop + Knight gate starts with the adversarial corpus", () => {
  const corpus = readAdversarialBishopKnightRoots();
  const sample = sampleBishopKnightRoots(corpus.length + 4, 7);
  assert.equal(sample.corpusRoots, corpus.length);
  assert.deepEqual(
    sample.roots.slice(0, sample.corpusRoots).map(({ source }) => source),
    corpus.map(() => "adversarial corpus"),
  );
});
