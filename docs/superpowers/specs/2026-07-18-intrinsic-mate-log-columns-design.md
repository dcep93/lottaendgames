# Intrinsic Mate Log Columns Design

## Goal

Keep the Mate move-log columns stable when the table changes between empty and
populated states. Only the `Reason` column should absorb unused horizontal
space.

## Column sizing

Mark the first seven columns in a semantic `colgroup` as intrinsic-width
columns:

1. `#`
2. `Phase`
3. `White`
4. `Black`
5. `Black replies`
6. `Correctness`
7. `Duration`

Each intrinsic column uses the width of its widest value, including its header.
With no rows, that makes the column as wide as its header. If a later row has
wider content, the header and the entire column stretch to that content width.
The columns continue to use nowrap behavior.

Leave the eighth column, `Reason`, flexible. It receives all remaining table
width after the intrinsic columns have been sized. Reason text keeps its
existing ellipsis treatment.

## Responsive behavior

Preserve the table's existing minimum width and scroll container. If the
intrinsic widths do not fit in the available panel, horizontal scrolling remains
the fallback rather than compressing or wrapping the non-Reason columns.

## Implementation shape

Use a `colgroup` in `MateLog` so the sizing intent is attached directly to the
table's column structure. Apply the intrinsic sizing rule through a shared CSS
class on the first seven `col` elements. Do not encode the behavior with
position-dependent `nth-child` selectors or JavaScript measurements.

## Testing

Update the Mate presentation tests to verify that:

- the table renders seven intrinsic columns followed by one flexible Reason
  column;
- the intrinsic column rule shrink-wraps those columns;
- the Reason column is excluded from the shrink-wrap rule;
- the existing minimum width and horizontal-overflow fallback remain intact.
