# Two Bishops: Degenerate Diagonal Setup

## Goal

Add a Phase 2 Degenerate repair for the supplied relative piece arrangement. The canonical repair is `Bf5`, placing the c2 bishop on the c8–h3 diagonal without moving to h3.

## Matcher

Canonical arrangement:

- Black king: h5
- White king: f6
- stationary bishop: e7
- moving bishop: c2
- repair target: f5

Match this arrangement under every D4 rotation/reflection and every translation that keeps all pieces and the repair target on the board. Bishop array order is irrelevant. The rule applies only in Phase 2 and only when the transformed/translated repair move is legal.

The subtype is `degenerate — diagonal setup`. It selects only the equivalent of `Bf5`; the equivalent of `Bh3` is not accepted.

## Presentation

Add a full-board Degenerate diagram from the supplied FEN, with an arrow from c2 to f5 and the c8, d7, e6, f5, g4, h3 diagonal highlighted. The subtype title must be the exact reason shown in the move log.

## Verification

Test the canonical move, all D4 transforms, legal translations, nearby nonmatches, and illegal targets. Run focused Two Bishops tests, affected diagram/presentation checks, app TypeScript, diff hygiene, and the root-local fail-fast loop finder. Validate its replay URL in localhost. Do not run the full mate suite.

## Constraints

- Current-position-only.
- D4 symmetric and translation invariant within board bounds.
- Preserve all existing Degenerate subtypes and unrelated dirty work.
- No commit, push, deploy, or full mate suite.
