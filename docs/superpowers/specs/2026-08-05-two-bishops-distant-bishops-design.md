# Two Bishops Distant Bishops Design

## Goal

Add a visible Phase 1 priority immediately before `adjacent bishops`:

> **distant bishops** — Phase 1: If a bishop is within 2 steps of Black's king, move it as far as possible, to a non-edge square.

## Mechanics

The rule examines the starting White-to-move position. It activates only in Phase 1 when at least one White bishop is within Chebyshev distance 2 of Black's king.

The comparison has two lexicographic stages:

1. Prefer a legal bishop move made by one of the triggering bishops to a non-edge destination.
2. Among those moves, maximize the bishop's travel length, measured as the Chebyshev distance from its starting square to its destination.

If both bishops trigger, moves by either bishop participate. If no candidate moves a triggering bishop to a non-edge square, the rule leaves every survivor tied and later priorities decide. King moves and moves by a non-triggering bishop cannot satisfy the first stage when a qualifying move exists.

The rule is inactive in Phase 2. It uses only current-board geometry and therefore follows translations, rotations, and reflections without templates or history.

## Scope

Do not change Phase classification, Black policy, universal safety rules, the existing `adjacent bishops` mechanic, or later `king closer` and `check` priorities. No diagram is required.

## Verification

- Assert the exact visible order and help text.
- Cover one triggering bishop, both triggering bishops, the non-edge constraint, maximum travel length, fallthrough when no qualifying move exists, and Phase 2 inactivity.
- Cover translation and every D4 transform.
- Run focused Two Bishops and presentation tests, TypeScript, lint, diagram freshness, and diff checks.
- Find a strict exact-repetition Phase 1 loop, treating entry into Phase 2 as termination, and open it on the isolated port 5174 server.
