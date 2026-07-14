import ChessBoard from './ChessBoard'
import type { DiagramSection } from './chapterTypes'

export default function InstructionalDiagram({
  section,
}: {
  section: DiagramSection
}) {
  const { fen, label, markers, number } = section.content
  const displayFen = `${fen} w - - 0 1`

  return (
    <figure className="leg-instructional-diagram">
      <figcaption>{label}</figcaption>
      <ChessBoard
        ariaLabel={`${label} instructional chess diagram`}
        fen={displayFen}
        lichessUrl={null}
        markers={markers}
        number={number}
      />
    </figure>
  )
}
