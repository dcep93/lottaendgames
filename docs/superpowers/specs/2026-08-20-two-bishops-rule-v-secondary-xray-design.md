# Rule V Secondary X-Ray

## Design

Update Rule V so its setup branch accepts a secondary squeeze diagonal that the other bishop can reach in one move when White's king is treated as transparent. All other pieces remain blockers. The primary-controlling move itself must remain legal.

Render the rule as:

> **rule v** — When the kings are in opposition and a bishop can control or x-ray the secondary squeeze diagonal in one move, control the primary squeeze diagonal. If a bishop already controls the primary squeeze diagonal, check from squeeze side.

For `8/8/8/8/8/1k1KB3/4B3/8 w - - 10 6`, `Bc5` controls primary `a3–f8`. The bishop on `e2` x-rays the secondary `a4–e8` through White's king on `d3`, so `Bc5` receives Rule V credit and beats the bishop-distance fallback.

## Verification

Add the supplied position and its rotations/reflections. Retain the existing Rule V matched-bundle, checking, and edge-selection tests.
