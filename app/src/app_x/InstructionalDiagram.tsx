import ChessBoard from './ChessBoard'
import { bookPositionAnchorId } from '../routing'
import type { DiagramSection } from './chapterTypes'
import { buildLichessEditorUrl } from './lichess'
import PositionControls from './PositionControls'

export default function InstructionalDiagram({
  section,
}: {
  section: DiagramSection
}) {
  const {
    boundaryPaths,
    fen,
    hideVisualLabel,
    label,
    markers,
    number,
    orientation,
    quadrantDividers,
    routes,
    subtitle,
  } = section.content
  const displayFen = `${fen} w - - 0 1`

  return (
    <figure
      aria-label={hideVisualLabel ? label : undefined}
      className="leg-instructional-diagram"
      id={bookPositionAnchorId(number)}
    >
      <PositionControls
        hasPlayback={false}
        lichessUrl={buildLichessEditorUrl(displayFen)}
      />
      {hideVisualLabel ? null : (
        <figcaption>
          <span>{label}</span>
          {subtitle ? (
            <span className="leg-instructional-diagram-subtitle">{subtitle}</span>
          ) : null}
        </figcaption>
      )}
      <ChessBoard
        ariaLabel={`${label} instructional chess diagram`}
        boundaryPaths={boundaryPaths}
        fen={displayFen}
        markers={markers}
        number={number}
        orientation={orientation}
        quadrantDividers={quadrantDividers}
        routes={routes}
      />
    </figure>
  )
}
