# Mate masthead and full-width workspace

## Goal

Remove the unused desktop space to the right of the `Mate` title and above the
selected drill. The Mate configuration belongs beside the title, while the
selected Queen, Rook, or other mating workspace should use the full content
width below that masthead.

This is a layout-only change. It must preserve mate selection, mode selection,
routes, generated positions, session state, move behavior, and the current
in-progress guidance and position-detail work.

## Confirmed layout

On desktop, the Mate page uses a two-column masthead:

- the existing Lotta Endgames kicker and `Mate` heading occupy the left side;
- the existing Mate training configuration occupies the right side;
- the selected drill begins on the next row and spans the full reader shell.

The configuration keeps its current mating-set links and Standard/Train mode
links. It remains a single semantic `aside`; the change is placement and sizing,
not a replacement control.

The selected drill keeps its current internal structure: its set and mode
heading, training disclosure, board column, controls, position details, and move
log. Giving the drill the full page width allows the board and log columns to
share all available space instead of competing with a persistent left sidebar.

When no drill is selected, the empty state also spans the full content width
below the masthead.

## Responsive behavior

The existing compact selector remains the mobile configuration surface. At the
current narrow-screen breakpoint, the desktop configuration is hidden and the
compact selector appears below the Mate heading and above the selected drill.

The masthead collapses to one column before its title and configuration become
cramped. The selected drill continues to use its existing workspace breakpoints:
board and log side by side when space permits, then stacked at narrower widths.
No page-level horizontal scrolling may be introduced.

## Component and style boundaries

- `Mate` composes a masthead containing the existing reader header and
  `MateSidebar`, then renders the selected workspace below it.
- `MateSidebar` retains its navigation and accessibility behavior. Its desktop
  presentation may be widened or reorganized within the masthead, while its
  compact selector remains unchanged in purpose.
- Mate page styles own the new masthead grid and the single-column outer content
  flow.
- `MateWorkspace` does not gain page-layout responsibility and does not change
  its session or rule behavior.

The implementation should follow the existing `rem`-based sizing convention and
reuse current colors, borders, typography, focus states, and link states.

## Accessibility

- The `Mate` heading remains the page's level-one heading.
- The desktop configuration remains an `aside` labelled `Mate training`, with
  its existing mating-set and mode navigation labels.
- The mobile selector remains properly labelled and keyboard-operable.
- DOM order follows reading order: page heading, configuration, then drill.
- Current route and mode indicators remain available through `aria-current`.

## Regression coverage and verification

Component coverage must confirm that the page still renders the configuration
and selected workspace in the expected semantic order, and that the empty state
still renders when no set is selected. Existing routing, selection, and Mate
workspace tests must remain green.

Verification includes the Mate test suite and production build, followed by a
targeted desktop and narrow-width visual check of the Mate page. The desktop
check must confirm that the configuration sits to the right of `Mate` and the
Queen workspace spans the available width beneath it. The narrow-width check
must confirm that the compact selector remains above the drill without
horizontal overflow.

## Alternatives rejected

- **Horizontal toolbar:** more compact, but it would redesign the configuration
  controls and make the longer mating-set labels harder to scan.
- **Drawer or popover:** saves space by hiding configuration, but adds state and
  interaction complexity to a small set of frequently used controls.
- **Keeping the sidebar beside the drill:** preserves the present structure but
  cannot satisfy the full-width workspace requirement or remove the empty area
  above the selected drill.

## Constraints

- Preserve all unrelated and in-progress user changes.
- Do not change mate engine logic, session state, routing, or content.
- Do not broaden this into a full-site visual pass.
