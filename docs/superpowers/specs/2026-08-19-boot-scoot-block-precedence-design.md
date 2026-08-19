# Boot Scoot Final-Block Precedence Design

## Goal

Prevent the boot-scoot stage detector from choosing another scoot when the final block is already available.

## Behavior

- Keep the existing boot, scoot, and block geometry predicates unchanged.
- In knight-step positions, evaluate final-block moves before scoot moves.
- If one or more final-block moves exist, prefer only those moves.
- Fall back to scoot moves only when no final block exists.

The regression begins after `Kd6 Ke4` in the loop from `8/8/4K3/8/3k4/8/3BB3/8 w - - 0 1`. The former return move `Ke6` must no longer be ideal.

## Verification

Add a focused rule test, retain the existing complete GIF validator, run the Two Bishops and presentation suites, then find and audit a Phase 1 loop while treating Phase 2 as terminal.
