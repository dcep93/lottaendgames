import { useEffect, useState, type CSSProperties } from 'react'
import { defaultArrowOptions, type ChessboardOptions } from 'react-chessboard'

/** Right-click annotations follow the board's arrow-clearing behavior. */
export function useBoardHighlights(position: string) {
  const [squares, setSquares] = useState<readonly string[]>([])
  useEffect(() => setSquares([]), [position])

  const onSquareRightClick: ChessboardOptions['onSquareRightClick'] = ({ square }) => {
    setSquares(current => current.includes(square)
      ? current.filter(value => value !== square)
      : [...current, square])
  }
  const onSquareMouseDown: ChessboardOptions['onSquareMouseDown'] = (_square, event) => {
    if (event.button === 0) setSquares([])
  }
  const withHighlights = (base: Record<string, CSSProperties> = {}) => {
    const styles = { ...base }
    for (const square of squares) {
      styles[square] = {
        ...base[square],
        boxShadow: [base[square]?.boxShadow,
          `inset 0 0 0 100vmax ${defaultArrowOptions.color}66`,
        ].filter(Boolean).join(', '),
      }
    }
    return styles
  }
  return { onSquareRightClick, onSquareMouseDown, withHighlights }
}
