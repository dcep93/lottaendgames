import React from 'react'
import type {
  RuleNoteBoard,
  RuleNoteBoardHighlight,
} from './rules'

type BoardLayout = {
  readonly files: number
  readonly ranks: number
  readonly fileOffset: number
}

const DEFAULT_BOARD_LAYOUT: BoardLayout = {
  files: 8,
  ranks: 8,
  fileOffset: 0,
}

const BOARD_FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const

const PIECE_GLYPHS = {
  K: '♔',
  Q: '♕',
  R: '♖',
  B: '♗',
  N: '♘',
  P: '♙',
  k: '♚',
  q: '♛',
  r: '♜',
  b: '♝',
  n: '♞',
  p: '♟',
} as const

const PIECE_NAMES = {
  K: 'White king',
  Q: 'White queen',
  R: 'White rook',
  B: 'White bishop',
  N: 'White knight',
  P: 'White pawn',
  k: 'Black king',
  q: 'Black queen',
  r: 'Black rook',
  b: 'Black bishop',
  n: 'Black knight',
  p: 'Black pawn',
} as const

const HIGHLIGHT_NAMES: Readonly<
  Record<RuleNoteBoardHighlight['kind'], string>
> = {
  zone: 'zone square',
  escape: 'escape square',
  key: 'key square',
  red: 'red escape square',
  box: 'box square',
  cage: 'cage square',
  wall: 'bishop wall square',
  support: 'king support square',
}

function squareGridPosition(square: string, layout: BoardLayout) {
  const file = square.charCodeAt(0) - 'a'.charCodeAt(0)
  const rank = Number(square.slice(1))
  return {
    column: file + layout.fileOffset + 1,
    row: layout.ranks - rank + 1,
  }
}

function noteBoardLabel(board: RuleNoteBoard): string {
  const parts = [
    `${board.title}.`,
    ...board.pieces.map(
      (piece) => `${PIECE_NAMES[piece.piece]} on ${piece.square}.`,
    ),
    ...board.highlights.map(
      (highlight) =>
        `${highlight.square} is a ${HIGHLIGHT_NAMES[highlight.kind]}.`,
    ),
    ...(board.arrows ?? []).map(
      (arrow) => `Arrow from ${arrow.from} to ${arrow.to}.`,
    ),
  ]
  if (board.caption !== '') parts.push(board.caption)
  return parts.join(' ')
}

export default function MateRuleNoteBoard({
  board,
}: {
  readonly board: RuleNoteBoard
}) {
  const markerId = React.useId()
  const layout = board.layout ?? DEFAULT_BOARD_LAYOUT
  const highlights = new Map(
    board.highlights.map((highlight) => [highlight.square, highlight.kind]),
  )
  const squares: Array<{
    readonly column: number
    readonly row: number
    readonly square?: string
  }> = []
  for (let row = 1; row <= layout.ranks; row += 1) {
    for (let column = 1; column <= layout.files; column += 1) {
      const boardFile = BOARD_FILES[column - layout.fileOffset - 1]
      const rank = layout.ranks - row + 1
      squares.push({
        column,
        row,
        ...(boardFile === undefined ? {} : { square: `${boardFile}${rank}` }),
      })
    }
  }

  return (
    <figure className="leg-mate-note-board">
      <figcaption>
        <strong>{board.title}</strong>
        {board.caption === '' ? null : <span>{board.caption}</span>}
      </figcaption>
      <div
        aria-label={noteBoardLabel(board)}
        className="leg-mate-note-board-surface"
        role="img"
        style={{ aspectRatio: `${layout.files} / ${layout.ranks}` }}
      >
        <div
          aria-hidden="true"
          className="leg-mate-note-board-squares"
          style={{
            gridTemplateColumns: `repeat(${layout.files}, 1fr)`,
            gridTemplateRows: `repeat(${layout.ranks}, 1fr)`,
          }}
        >
          {squares.map(({ column, row, square }) => {
            const highlight = square
              ? highlights.get(square)
              : undefined
            return (
              <span
                className={`leg-mate-note-board-square leg-mate-note-board-square--${(column - layout.fileOffset + row) % 2 === 0 ? 'light' : 'dark'}${highlight ? ` leg-mate-note-board-square--${highlight}` : ''}`}
                data-highlight-kind={highlight}
                key={square ?? `${column}-${row}`}
              />
            )
          })}
        </div>
        <svg
          aria-hidden="true"
          className="leg-mate-note-board-arrows"
          viewBox={`0 0 ${layout.files * 100} ${layout.ranks * 100}`}
        >
          <defs>
            <marker
              id={markerId}
              markerHeight="8"
              markerWidth="8"
              orient="auto"
              refX="7"
              refY="4"
              viewBox="0 0 8 8"
            >
              <path d="M 0 0 L 8 4 L 0 8 z" />
            </marker>
          </defs>
          {(board.arrows ?? []).map((arrow) => {
            const from = squareGridPosition(arrow.from, layout)
            const to = squareGridPosition(arrow.to, layout)
            return (
              <line
                data-arrow={`${arrow.from}-${arrow.to}`}
                key={`${arrow.from}-${arrow.to}`}
                markerEnd={`url(#${markerId})`}
                x1={(from.column - 0.5) * 100}
                x2={(to.column - 0.5) * 100}
                y1={(from.row - 0.5) * 100}
                y2={(to.row - 0.5) * 100}
              />
            )
          })}
        </svg>
        <div
          aria-hidden="true"
          className="leg-mate-note-board-pieces"
          style={{
            gridTemplateColumns: `repeat(${layout.files}, 1fr)`,
            gridTemplateRows: `repeat(${layout.ranks}, 1fr)`,
          }}
        >
          {board.pieces.map((piece) => {
            const position = squareGridPosition(piece.square, layout)
            return (
              <span
                className="leg-mate-note-board-piece"
                key={`${piece.piece}-${piece.square}`}
                style={{
                  gridColumn: position.column,
                  gridRow: position.row,
                }}
              >
                {PIECE_GLYPHS[piece.piece]}
              </span>
            )
          })}
        </div>
      </div>
    </figure>
  )
}
