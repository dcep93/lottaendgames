# Clickable Move Playback Design

## Goal

Chapter 5 should let readers click chess moves in the rendered book text and see the corresponding board position. The source `chapter_5.json` remains unchanged; move paths are inferred at runtime from the existing prose and move strings.

## Scope

- Apply this behavior to the chapter viewer in `app/src/app_x`.
- Support moves in both `moves` sections and ordinary `text` sections.
- Use the nearest preceding `position` section as the initial board for subsequent clickable move text until the next `position` section.
- Keep board pieces non-draggable and non-click-looking.
- Do not add authoring metadata to `chapter_5.json`.

## Parsing Model

The app will group the chapter into position contexts. Each context starts with a `position` section and includes following `moves`, `text`, and caption-like content until the next `position` section.

Within a position context, text rendering will tokenize prose into normal spans and SAN-like move candidates. Candidate tokens include examples such as `Kg5!`, `1...c3`, `Kb2=`, `Rxb2`, `b1N+`, `Rc8?`, and `Kc3!`.

The parser will preserve the original token for display, but normalize it for move resolution by removing move numbers and annotation/result suffixes where needed.

## Move Resolution

Use `chess.js` to avoid hand-rolling legal move application. The engine starts from the position FEN and attempts to apply candidate tokens as SAN.

Branch handling follows local text order:

- Each clickable token stores the exact local path that produced that token.
- Clicking a repeated move such as `Kb3` replays the path for that specific occurrence, not the first global path containing `Kb3`.
- `1.` starts or restarts a White-to-move branch from the diagram position.
- `1...` starts or restarts a Black-to-move hypothetical branch from the diagram position.
- Parenthetical or prose alternatives fork from the local branch when the candidate is legal from that point; the clicked token stores whichever fork produced that exact occurrence.
- If a candidate cannot be resolved legally in the local branch or as a clearly restarted branch, render it as plain text.

For Position 5.1, expected behavior includes:

- Clicking `Kg5` after `1.Kg5!` applies `Kg5` from the initial diagram.
- Clicking `Kb3` in the hypothetical `1...c3 2.Kg5 c2 3.Rc8 Kb3` line applies that full local path.
- Clicking `Kd2` in the main continuation applies the main-line path through `5.Kd2`.
- Clicking `Kc3!` in the prose branch beginning `1.Rc8?` applies the local branch through `1...Kc3!`.
- Clicking the displayed `5.1` position number resets the board to its initial FEN.

## Components

`ChapterViewer` will own active board state by position number. It will pass the current FEN into `ChessBoard` and render clickable notation tokens for relevant text.

`ChessBoard` remains responsible only for displaying a FEN with markers. It should not parse moves.

A new parser/helper module will:

- Build position contexts from the linear chapter sections.
- Tokenize text into display spans and move candidates.
- Resolve candidates into local move paths and resulting FEN values.
- Return render-ready tokens with optional playback metadata.

## UI Behavior

Clickable move tokens should read like book text, not controls. Use subtle interaction styling, such as a dotted underline or color change on hover/focus. The active clicked move may receive a restrained highlight using the existing brown/pink visual language.

Clickable tokens must be keyboard-accessible. They should be buttons styled as inline text, or equivalent accessible controls, with labels that identify the move and position.

The board reset affordance is the position number in the position card. It should become clickable and keyboard-accessible when playback exists for that position.

## Error Handling

Unresolved move candidates remain plain text. Parser failures should not break chapter rendering. If a whole position context cannot be parsed, its board and prose should still render in the current static form.

## Testing

- Add focused parser tests for Position 5.1 examples: `Kg5`, `Kb3` in its local line, `Kd2`, `Rc8?`, and `Kc3!`.
- Verify unresolved prose remains plain text.
- Run `npm run build` and `npm run lint`.
- Browser-check Position 5.1: click `Kg5`, click a downstream `Kb3`, click `Kd2`, click prose `Kc3!`, then click `5.1` to reset.
