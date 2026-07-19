# Mate Landing Mode Selector Design

## Goal

Keep the `Standard | Training Wheels` mode row visible in the Mate piece selector on `/mate`, before a mating set has been chosen.

## Behavior

- The Mate landing path renders the existing material icons and the existing two mode labels.
- With no selected material, neither mode is active and both are disabled because there is no material-specific destination yet.
- Disabled mode labels keep the same two-column layout and visual footprint as the functional mode links.
- After a material is selected, the current behavior is unchanged: both labels are links for that material and the routed mode is active.
- Material selection from `/mate` continues to open that material in Standard mode.

## Accessibility

The landing labels are non-link elements with `aria-disabled="true"`. They remain readable but cannot imply a destination or receive link activation.

## Testing

- Render the selector with no selected material and assert both mode labels are present, disabled, and inactive.
- Preserve the existing assertions for functional Standard and Training Wheels links when a material and mode are selected.
- Verify the actual `/mate` page locally after the component tests pass.
