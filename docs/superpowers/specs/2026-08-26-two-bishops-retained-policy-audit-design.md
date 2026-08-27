# Two Bishops Retained-Policy Audit

## Scope

Retain numbered Two Bishops priorities 1–24, ending with `rule d25`.
Remove numbered priority 25 (`rule e5`) and every later priority from the
active policy, training guide, score model, tests, and implementation.

The retained order is:

1. mate
2. bishops safe
3. no stalemate
4. rule a
5. rule b1
6. rule b2
7. rule b3
8. rule c03
9. rule c05
10. rule c07
11. rule c7.5
12. rule c08
13. rule c08.5
14. rule c9
15. rule c10
16. rule c11
17. rule c12
18. rule c15
19. rule d7
20. rule d9
21. rule d12
22. rule d16
23. rule d20
24. rule d25

Rule b3 remains an ordinary priority after rule a. It defines `Bd5` only for
the exact `Kf4/Kd7/Be4/Be5` diagram position and its D4 symmetries. It does not
bypass, disable, or otherwise modify rule a.

## Implementation cleanup

The active rule registry and score type will contain only retained priorities.
Rule-specific functions, fields, constants, diagrams, and tests used solely by
removed priorities will be deleted. Shared chess geometry and externally used
public APIs remain.

The oversized Two Bishops implementation will be split only where the retained
policy gains a clear boundary: retained rule definitions/scoring, geometry,
and help diagrams. No clean-room rewrite is required, and unrelated mate
implementations remain untouched.

## Rule audit

Each retained rule receives an evidence-backed audit covering:

- exact guide text;
- position-level applicability;
- candidate comparison direction and subpriority order;
- `stopWhenBest` behavior;
- representative winning and losing moves;
- an inactive-domain regression;
- D4 rotation/reflection invariance for diagram-specific rules and geometric
  predicates.

The audit must explicitly confirm that no retained rule contains a hidden
exception for a later rule. In particular, rule a must be identical regardless
of whether b1, b2, or b3 applies.

## Exhaustive census

Enumerate every legal White-to-move KBBK board state accepted by the production
mate validator. Canonicalize states under all eight D4 board symmetries before
expansion. For each canonical White state, apply every selected best White move
and every legal Black reply, using production terminal handling.

Build the complete directed policy graph and classify each state as:

- **forced mate**: every selected-White/arbitrary-Black continuation terminates
  in checkmate;
- **loop-leading**: at least one continuation reaches a cyclic strongly
  connected component;
- **other failure**: a rule gap, stalemate, material loss, fifty-move failure,
  or another non-loop terminal failure.

Report raw legal-state count, D4-canonical count, graph size, SCC counts, and
percentages for forced mate, loop-leading, and other failure. Percentages use
all classified canonical legal states as the denominator. Also report the
mate-versus-loop percentages with other failures excluded so the requested
comparison is unambiguous.

## Verification and delivery

Run focused retained-rule tests, selection-engine tests, TypeScript checks, the
development verifier, and the exhaustive census. Record failures honestly;
the audit is a measurement, not a requirement to make every state mate.

Commit the scoped Two Bishops changes and audit artifacts, then push `main` to
`origin`. Do not include unrelated worktree changes.
