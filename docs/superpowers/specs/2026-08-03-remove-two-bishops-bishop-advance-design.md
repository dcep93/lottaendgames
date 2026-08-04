# Remove Two Bishops Degenerate Bishop Advance

## Goal

Remove the `degenerate — bishop advance` teaching case and its move-selection
behavior completely.

## Design

- Delete the bishop-advance degenerate matcher.
- Remove its reason label and priority-order entry.
- Remove its help-board diagram and generated-diagram registration.
- Remove tests whose only purpose is freezing that case; update overlap tests to
  assert the next remaining rule or repair naturally owns the position.
- Do not add a replacement selector or hidden fallback.

## Verification

Run focused Two Bishops rules, presentation, TypeScript, diagram generation,
diff, and fail-fast loop checks only.

