import type { MouseEvent, ReactNode } from 'react'
import {
  bookEndingAnchorId,
  bookPathForChapterId,
  bookPositionAnchorId,
} from '../routing'
import type { RuntimeChapterDefinition } from './chapterRuntime'
import type { EndingSection } from './chapterTypes'

export default function BookFrontMatter({
  chapters,
  onNavigate,
}: {
  chapters: RuntimeChapterDefinition[]
  onNavigate: (href: string) => void
}) {
  return (
    <article className="leg-frontmatter">
      <header className="leg-frontmatter-identity">
        <p className="leg-kicker">About this edition</p>
        <h2>100 Endgames You Must Know</h2>
        <p className="leg-frontmatter-author">Jesús de la Villa</p>
        <dl className="leg-publication-details">
          <div>
            <dt>Edition</dt>
            <dd>New In Chess, 2008</dd>
          </div>
          <div>
            <dt>ISBN-13</dt>
            <dd>978-90-5691-244-4</dd>
          </div>
          <div>
            <dt>Copyright</dt>
            <dd>© 2008 New In Chess</dd>
          </div>
          <div>
            <dt>Publisher</dt>
            <dd>New In Chess, Alkmaar, The Netherlands</dd>
          </div>
        </dl>
        <p className="leg-frontmatter-fine-print">
          <a href="https://www.newinchess.com/">www.newinchess.com</a>
          <br />
          All photos: New In Chess Archives.
        </p>
      </header>

      <FrontMatterSection title="About this project">
        <p>
          Lotta Endgames is an unofficial interactive companion to Jesús de la
          Villa&apos;s <em>100 Endgames You Must Know</em>.
        </p>
        <p>
          It is probably better to study the book in its original form. Following
          the notation, visualizing the moves, and moving between text and
          diagrams takes more work, and that extra effort can lead to stronger
          retention.
        </p>
        <p>
          For lazier readers - or anyone who does not want to keep flipping
          between pages or visualizing every move from notation alone - this app
          offers a lower-friction way to follow the same material with
          synchronized boards and direct navigation.
        </p>
      </FrontMatterSection>

      <FrontMatterSection title="Reader features">
        <ul className="leg-feature-list">
          <li>Clickable move notation with synchronized boards</li>
          <li>Lichess, Previous, Reset, and Next controls</li>
          <li>Left and Right Arrow keyboard navigation</li>
          <li>Visible coordinates and book-matched board orientation</li>
          <li>Click-to-expand boards</li>
          <li>Lichess analysis and editor links</li>
          <li>Direct links to chapters, endings, and positions</li>
          <li>Revealable test solutions</li>
          <li>A linkable table of contents</li>
        </ul>
      </FrontMatterSection>

      <FrontMatterSection title="Note on this digital edition">
        <p>
          <BookLink
            href={`${bookPathForChapterId('14')}#${bookPositionAnchorId('14.29')}`}
            onNavigate={onNavigate}
          >
            Final Test 14.29
          </BookLink>{' '}
          (print page 233; PDF page 234) is labeled “Black to move. Can he
          draw?”, while the published solution analyzes White&apos;s 69th move.
          This reader follows the solution and presents the position with White
          to move.
        </p>
      </FrontMatterSection>

      <FrontMatterSection title="With thanks">
        <p>
          Thank you to Jesús de la Villa for creating this book and making
          essential endgame knowledge approachable, memorable, and practical.
        </p>
        <p>
          If anything here needs correction, clarification, permission review,
          or removal, please contact{' '}
          <a href="mailto:dcep93@gmail.com">dcep93@gmail.com</a>.
        </p>
      </FrontMatterSection>

      <nav aria-labelledby="book-contents-heading" className="leg-book-contents">
        <h2 id="book-contents-heading">Table of contents</h2>
        <ol>
          {chapters.map((chapter) => (
            <ContentsPart
              chapter={chapter}
              key={chapter.id}
              onNavigate={onNavigate}
            />
          ))}
        </ol>
      </nav>
    </article>
  )
}

function FrontMatterSection({
  children,
  title,
}: {
  children: ReactNode
  title: string
}) {
  return (
    <section className="leg-frontmatter-section">
      <h2>{title}</h2>
      {children}
    </section>
  )
}

function ContentsPart({
  chapter,
  onNavigate,
}: {
  chapter: RuntimeChapterDefinition
  onNavigate: (href: string) => void
}) {
  const chapterHref = bookPathForChapterId(chapter.id)
  const endings = chapter.sections.filter(
    (section): section is EndingSection => section.type === 'ending',
  )

  return (
    <li>
      <BookLink href={chapterHref} onNavigate={onNavigate}>
        <span>{chapter.label}</span>
        {chapter.label === chapter.name ? null : <strong>{chapter.name}</strong>}
      </BookLink>
      {endings.length > 0 ? (
        <ol className="leg-ending-contents">
          {endings.map((ending) => {
            const href = `${chapterHref}#${bookEndingAnchorId(
              ending.content.number,
            )}`

            return (
              <li key={ending.content.number}>
                <BookLink href={href} onNavigate={onNavigate}>
                  <span>Ending {ending.content.number}</span>
                  <strong>{ending.content.text}</strong>
                </BookLink>
              </li>
            )
          })}
        </ol>
      ) : null}
    </li>
  )
}

function BookLink({
  children,
  href,
  onNavigate,
}: {
  children: ReactNode
  href: string
  onNavigate: (href: string) => void
}) {
  return (
    <a
      href={href}
      onClick={(event) => handleNavigation(event, href, onNavigate)}
    >
      {children}
    </a>
  )
}

function handleNavigation(
  event: MouseEvent<HTMLAnchorElement>,
  href: string,
  onNavigate: (href: string) => void,
) {
  if (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return
  }

  event.preventDefault()
  onNavigate(href)
}
