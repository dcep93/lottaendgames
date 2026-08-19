# Two Bishops Secondary Squeeze Index Fix

## Goal

Make `prepare mate` preserve the corner secondary diagonal immediately inside the outer diagonal without changing the broader Rule U/V geometry.

## Behavior

For the corner preparation with White's king on `f2` and Black's king on `h1`, the secondary diagonal is `c8–d7–e6–f5–g4–h3`. The outer `d8–e7–f6–g5–h4` diagonal is not secondary. Therefore `Bc8` preserves the secondary and is uniquely preferred, while `Bg8` abandons it and loses at `prepare mate`.

## Implementation

Have `prepare mate` evaluate `primaryIndex`, the corner secondary diagonal, instead of the outer `secondaryIndex` used by the broader squeeze-bundle machinery. Retain the positive prepare-mate regression and add the reported position as a regression selecting `Bc8` over `Bg8`. Keep rendered text, rule priority, and other squeeze rules unchanged.

## Verification

Run the focused Two Bishops rule tests and verify a replacement loop move-by-move before loading it in the visible in-app browser tab.
