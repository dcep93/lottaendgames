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
        <p className="leg-frontmatter-subtitle">
          Vital Lessons for Every Chess Player
        </p>
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
          <div>
            <dt>Cover design</dt>
            <dd>Steven Boland</dd>
          </div>
          <div>
            <dt>Translation</dt>
            <dd>Patricia Llaneza Vega</dd>
          </div>
          <div>
            <dt>Correction</dt>
            <dd>Steve Giddins</dd>
          </div>
          <div>
            <dt>Supervisor</dt>
            <dd>Peter Boel</dd>
          </div>
          <div>
            <dt>Proofreading</dt>
            <dd>René Olthof</dd>
          </div>
          <div>
            <dt>Production</dt>
            <dd>Anton Schermer</dd>
          </div>
        </dl>
        <p className="leg-frontmatter-fine-print">
          <a href="https://www.newinchess.com/">www.newinchess.com</a>
          <br />
          All photos: New In Chess Archives.
        </p>
      </header>

      <FrontMatterSection title="Publisher's description">
        <p>The good news about chess endgames is:</p>
        <ul>
          <li>there are relatively few endings you should really know by heart</li>
          <li>
            once you know these endings, that&apos;s it. Your knowledge never goes
            out of date!
          </li>
        </ul>
        <p>
          The bad news is that, all the same, the endgame technique of most
          players is deficient.
        </p>
        <p>
          Since you are reading this, your endgame knowledge may be inadequate
          as well, with predictable consequences for your results. To make
          matters worse, modern time-controls prevent you from compensating for
          your lack of knowledge by delving deeply into the subtleties of an
          ending during a game.
        </p>
        <p>
          This book is a great help for players such as you. The author debunks
          the myth that endgame theory is complex and teaches you to steer the
          game into a position you are familiar with.
        </p>
        <p>
          Jesus de la Villa has only selected those endgames that show up most
          frequently, are easy to learn and contain ideas that are also useful
          in more difficult positions.
        </p>
        <p>Your performance will improve dramatically because this book brings you:</p>
        <ul>
          <li>simple rules</li>
          <li>detailed and lively explanations</li>
          <li>many diagrams</li>
          <li>clear summaries of the most important themes</li>
        </ul>
        <p>
          <em>100 Endgames You Must Know</em> is not an encyclopedia, but a
          practical tool to improve your knowledge of the most common
          theoretical endings.
        </p>
        <p>
          <strong>Jesus de la Villa</strong> (1958) is an International
          Grandmaster born in Spain. He is a successful author and a well-known
          chess coach. He has won the Spanish Championship twice.
        </p>
        <p>Printed cover price: Games / Chess $24.95 · €21.95.</p>
      </FrontMatterSection>

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
        <ul className="leg-deviation-list">
          <li>
            <BookLink
              href={`${bookPathForChapterId('14')}#${bookPositionAnchorId('14.29')}`}
              onNavigate={onNavigate}
            >
              Final Test 14.29
            </BookLink>{' '}
            has the prompt “Black to move. Can he draw?” (print page 233; PDF
            page 234), while its solution begins with White&apos;s 69th move (print
            page 238; PDF page 239). This digital edition presents the prompt as
            “White to move. Can he draw?” so that it agrees with the solution.
          </li>
        </ul>
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
        <ol className="leg-contents-list">
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
    <li className="leg-contents-chapter">
      <BookLink
        className="leg-contents-row leg-contents-chapter-row"
        href={chapterHref}
        onNavigate={onNavigate}
      >
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
              <li className="leg-contents-ending" key={ending.content.number}>
                <BookLink
                  className="leg-contents-row leg-contents-ending-row"
                  href={href}
                  onNavigate={onNavigate}
                >
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
  className,
  href,
  onNavigate,
}: {
  children: ReactNode
  className?: string
  href: string
  onNavigate: (href: string) => void
}) {
  return (
    <a
      className={className}
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
