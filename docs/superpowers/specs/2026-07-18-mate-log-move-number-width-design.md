# Mate Log Move-Number Width Design

## Goal

Give the Mate move-number column a little more stable horizontal space without
changing the intrinsic sizing behavior of the other columns.

## Sizing behavior

Assign the first `col` in the Mate log a dedicated move-number class with a
fixed width of `3rem`. Do not also apply the intrinsic-column class to it.

Keep the remaining sizing contract unchanged:

- `Phase` through `Duration` size to their widest header or cell;
- `Reason` alone absorbs unused table width;
- the existing nowrap and horizontal-overflow behavior remains.

## Testing

Update the Mate presentation test to verify that the table renders one dedicated
move-number column before the six intrinsic columns and the flexible Reason
column. Verify that the move-number CSS rule uses `3rem` and that the other
column rules remain intact.
