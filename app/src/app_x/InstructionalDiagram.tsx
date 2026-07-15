import ChessBoard from './ChessBoard'
import type { DiagramSection } from './chapterTypes'
import { buildLichessEditorUrl } from './lichess'
import PositionControls from './PositionControls'

export default function InstructionalDiagram({
  section,
}: {
  section: DiagramSection
}) {
  const { fen, label, markers, number, orientation, routes, subtitle } =
    section.content
  const displayFen = `${fen} w - - 0 1`

  return (
    <figure className="leg-instructional-diagram">
      <PositionControls
        hasPlayback={false}
        lichessUrl={buildLichessEditorUrl(displayFen)}
      />
      <figcaption>
        <span>{label}</span>
        {subtitle ? (
          <span className="leg-instructional-diagram-subtitle">{subtitle}</span>
        ) : null}
      </figcaption>
      <ChessBoard
        ariaLabel={`${label} instructional chess diagram`}
        fen={displayFen}
        markers={markers}
        number={number}
        orientation={orientation}
        routes={routes}
      />
    </figure>
  )
}
