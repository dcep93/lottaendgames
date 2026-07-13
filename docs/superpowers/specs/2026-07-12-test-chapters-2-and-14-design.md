# Chapters 2 and 14 Test Viewer Design

## Goal

Add the Basic Test and Final Test from *100 Endgames You Must Know* as Chapters 2 and 14. Each problem must preserve its source board and prompt, keep its solution hidden by default, and retain the viewer's move playback, keyboard navigation, animation, active-board behavior, and Lichess export.

## Scope

- Chapter 2 contains all 26 Basic Test problems and their complete solutions.
- Chapter 14 contains all 36 Final Test problems and their complete solutions.
- Each problem has an independently controlled solution.
- Existing instructional chapters and their presentation remain unchanged.
- Source text and diagrams come from the retained PDF. Notation is normalized to the conventions already used by the structured chapters.

## Source Model

Test chapters use a first-class problem section:

```ts
type ProblemSection = {
  type: 'problem'
  content: {
    number: string
    prompt: string
    fen: string
    markers?: PositionMarker[]
    solution: string
  }
}
```

The problem number is also the board identifier. The prompt combines the side-to-move instruction and question printed with the diagram. The solution contains the complete corresponding solution text, including principal lines, variations, game references, explanatory prose, and ending references.

## Extraction

Every diagram is reconstructed from the source PDF rather than inferred from its solution. FEN is best effort only when source symbols cannot be represented by FEN; non-piece symbols are retained as markers using the existing marker model. Side to move comes from the printed prompt unless the source position proves otherwise.

Each solution is paired by its printed problem number. Page-column order must be respected because both test and solution pages use two-column layouts. Extraction must reject duplicate numbers, missing numbers, missing prompts, missing boards, and missing solutions. The expected complete sets are `2.01` through `2.26` and `14.01` through `14.36`.

## Runtime Preparation

The build step compiles solution notation into the same playback tokens and navigation trees used by instructional chapters. Browsers receive denormalized runtime data and do not parse SAN while loading or revealing a solution.

Problem playback stays locked at the initial FEN while its solution is hidden. Revealing the solution enables its move tokens and arrow-key navigation. Hiding it again resets that board to its initial FEN and removes its hidden line from active keyboard navigation.

## Presentation

Each problem is one side-by-side study unit on desktop and mobile:

- The board column contains the problem number, prompt, and board.
- The adjacent content column contains one compact `Show solution` control.
- Solutions are hidden independently and default to hidden on chapter load.
- Revealing a solution expands it in place beside its board without moving the solution elsewhere in the chapter.
- The revealed solution uses normal prose presentation and the existing clickable move styling.
- Switching chapters clears all revealed-solution and board-playback state.

The board remains visible while its revealed solution scrolls independently, following the current board/content column behavior. The toggle is a disclosure control with `aria-expanded` and an explicit problem-specific accessible label.

## Interaction

Clicking a revealed solution move promotes that problem board to active, stages the move from its parent, and animates it using the existing move path. Clicking the problem number resets the board to the initial test position.

Arrow keys operate only on a revealed active problem. If no revealed active problem is visible, the first visible problem with a revealed solution becomes active. A hidden problem cannot leak solution moves through arrow navigation.

Clicking the board opens Lichess in a new tab. Before reveal, Lichess receives the initial problem position. After reveal, it receives the complete currently selected solution branch and is indexed to the move displayed on the board.

## Validation

- Structural audit: exactly 26 Chapter 2 problems and 36 Chapter 14 problems, with contiguous numbers and complete required fields.
- Source audit: no missing, duplicated, or cross-paired prompts and solutions.
- Playback audit: every emitted SAN token replays legally in `chess.js` from its problem FEN.
- Advisory audit: zero actionable SAN misses across all chapters, including hidden solutions.
- Presentation tests: solutions default hidden, controls are independent, hiding resets playback, and hidden solutions cannot be traversed with arrow keys.
- Lichess tests: initial-position export while hidden and complete current-branch export while revealed.
- Existing unit, content, lint, and production build checks remain green.

No full visual end-to-end pass is part of this work, in accordance with `AGENTS.md`.
