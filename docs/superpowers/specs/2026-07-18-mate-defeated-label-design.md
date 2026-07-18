# Mate defeated terminal label

## Goal

Match chess420's concise terminal wording by replacing descriptive losing labels
in the Mate toolbar with `Defeated`.

## Confirmed outcome labels

The toolbar maps terminal outcomes as follows:

- `checkmate` → `Checkmate`
- `stalemate` → `Stalemate`
- `fifty-move` → `Draw`
- `lost-material` → `Defeated`
- `lost-knight` → `Defeated`
- `pawn-promoted` → `Defeated`
- `unsupported` → `Defeated`

This preserves distinct chess results while collapsing every failed training
construction to the same concise label used by chess420. Share text already uses
the equivalent lowercase `defeated` and requires no change.

## Scope and behavior

Only the presentation mapping in `MateControls` changes. Session outcome types,
terminal classification, board completion, timer behavior, sharing, control
order, and accessibility semantics remain unchanged.

Presentation tests cover every outcome mapping and retain the existing terminal
toolbar order assertions. Verification includes the focused presentation suite,
complete Mate suite, build, lint, and one terminal browser check.

## Alternatives rejected

- Changing only lost material would leave other failed constructions verbose and
  inconsistent.
- Reusing share labels directly would make all toolbar outcomes lowercase and
  couple two separate presentation contexts.

## Constraints

- Preserve `Checkmate`, `Stalemate`, and `Draw` as distinct labels.
- Do not change outcome detection or share text.
- Preserve unrelated worktree changes.
