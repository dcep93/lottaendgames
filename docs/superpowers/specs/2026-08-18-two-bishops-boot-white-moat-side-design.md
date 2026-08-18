# Boot Scoot N Block White-Moat-Side Gate Design

## Scope

Update the initial applicability of `boot scoot n block` and its rendered description. Preserve the existing boot, scoot, block, moat-widening, nearer-side, symmetry, and all-phase rule scope.

Rendered text:

> When the kings are in opposition, both bishops are on White's side of the king moat, and a bishop controls the secondary squeeze diagonal on the side closer to the kings, moat use a bishop to boot the king towards that squeeze diagonal. Then scoot to opposition on the next position. Finally, block the king's escape. (See gif)

## Behavior

At the initial opposition position, derive the king moat from the two kings. The maneuver can begin only if each bishop is on the half-plane containing White's king. A bishop lying directly on the moat qualifies as being on White's side.

Once the boot has occurred, the existing scoot and block recognizers continue the maneuver without reapplying the initial opposition-only gate.

## Implementation

Add an inclusive signed projection check against the existing opposition-moat geometry. Apply it before generating boot candidates in the opposition branch of `getBootNScootPreferredMoves`. Do not add a new scoring priority or alter later-stage helpers.

## Verification

- Preserve the GIF's three best moves.
- Add coverage for both bishops on White's side, a bishop exactly on the moat, and a bishop on Black's side.
- Preserve translation/reflection/rotation coverage and apply the same gate in Phase 2.
- Verify the rendered text, targeted tests, lint, and build.

## Assumptions

- The new bishop-placement clause gates only boot initiation.
- “On White's side” includes the moat itself.
- The existing definition of king moat remains authoritative.
