import chapterData from './pdf/chapter_5.json'
import type {
  CaptionSection,
  EndingSection,
  MovesSection,
  PositionSection,
  RawChapterSection,
  TextSection,
  TitleSection,
} from './chapterTypes'
import ChessBoard from './ChessBoard'

const chapterSections = chapterData as RawChapterSection[]

export default function ChapterViewer() {
  const positionCount = chapterSections.filter(
    (section) => section.type === 'position',
  ).length
  const endingCount = chapterSections.filter(
    (section) => section.type === 'ending',
  ).length

  return (
    <main className="leg-page">
      <div className="leg-reader-shell">
        <header className="leg-reader-header">
          <p className="leg-kicker">Lotta Endgames</p>
          <h1>100 Endgames You Must Know</h1>
          <p className="leg-reader-subtitle">
            Chapter 5 rendered from structured JSON, with boards generated from
            FEN and printed diagram markers overlaid.
          </p>
          <div className="leg-reader-meta" aria-label="Chapter summary">
            <span>{chapterSections.length} sections</span>
            <span>{endingCount} endings</span>
            <span>{positionCount} boards</span>
          </div>
        </header>
        <article className="leg-chapter">
          {chapterSections.map((section, index) => (
            <SectionRenderer
              index={index}
              key={`${section.type}-${index}`}
              section={section}
            />
          ))}
        </article>
      </div>
    </main>
  )
}

function SectionRenderer({
  index,
  section,
}: {
  index: number
  section: RawChapterSection
}) {
  switch (section.type) {
    case 'caption': {
      const captionSection = section as CaptionSection
      return <p className="leg-section-caption">{captionSection.content}</p>
    }
    case 'ending': {
      const endingSection = section as EndingSection

      return (
        <section
          className="leg-ending"
          id={`ending-${endingSection.content.number}`}
        >
          <span>Ending {endingSection.content.number}</span>
          <strong>{endingSection.content.text}</strong>
        </section>
      )
    }
    case 'moves': {
      const movesSection = section as MovesSection
      return <p className="leg-moves">{movesSection.content}</p>
    }
    case 'position':
      return <PositionCard section={section as PositionSection} />
    case 'text': {
      const textSection = section as TextSection
      return <ProseBlock content={textSection.content} />
    }
    case 'title': {
      const titleSection = section as TitleSection
      return <h2 className="leg-chapter-title">{titleSection.content}</h2>
    }
    default:
      return (
        <aside className="leg-unknown">
          Unknown section {index + 1}: <code>{section.type}</code>
        </aside>
      )
  }
}

function PositionCard({ section }: { section: PositionSection }) {
  const { caption, fen, markers, number } = section.content

  return (
    <figure className="leg-position-card">
      <div className="leg-position-copy">
        <figcaption>
          <span>Position</span>
          <strong>{number}</strong>
        </figcaption>
        {caption ? <p>{caption}</p> : null}
        {markers?.length ? (
          <ul className="leg-marker-list">
            {markers.map((marker, index) => (
              <li key={`${marker.square}-${marker.symbol}-${index}`}>
                <span>{marker.square}</span>
                {marker.meaning}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <ChessBoard fen={fen} markers={markers} number={number} />
      <p className="leg-fen">{fen}</p>
    </figure>
  )
}

function ProseBlock({ content }: { content: string }) {
  return (
    <div className="leg-prose">
      {content.split(/\n+/).map((paragraph, index) => (
        <p key={`${paragraph.slice(0, 16)}-${index}`}>{paragraph}</p>
      ))}
    </div>
  )
}
