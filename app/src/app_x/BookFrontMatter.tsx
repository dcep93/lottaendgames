import type { MouseEvent, ReactNode } from 'react'
import {
  bookEndingAnchorId,
  bookPathForChapterId,
  bookPositionAnchorId,
  bookProblemSolutionAnchorId,
} from '../routing'
import type { RuntimeChapterDefinition } from './chapterRuntime'
import type { EndingSection, ProblemSection } from './chapterTypes'

const chaptersWithPrintedSolutions = new Set(['2', '14'])

export default function BookFrontMatter({
  chapters,
  onNavigate,
}: {
  chapters: RuntimeChapterDefinition[]
  onNavigate: (href: string) => void
}) {
  return (
    <article className="leg-frontmatter">
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

      <FrontMatterSection title="About this project">
        <p>
          Lotta Endgames is an unofficial interactive companion to Jesús de la
          Villa&apos;s <em>100 Endgames You Must Know</em>.
        </p>
        <p>
          It is probably better to study the book in its original form.
          Following the notation, visualizing the moves, and moving between text
          and diagrams takes more work, and that extra effort can lead to
          stronger retention.
        </p>
        <p>
          For lazier readers - or anyone who does not want to keep flipping
          between pages or visualizing every move from notation alone - this app
          offers a lower-friction way to follow the same material with
          synchronized boards and direct navigation.
        </p>
      </FrontMatterSection>

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
              href={`${bookPathForChapterId('14')}#${bookPositionAnchorId('14.17')}`}
              onNavigate={onNavigate}
            >
              Final Test 14.17
            </BookLink>{' '}
            prints “the black king is driven off his blockade position” in its
            solution (print page 236; PDF page 237). The line is Black&apos;s
            winning method for driving White&apos;s king away from the blockade,
            so this digital edition corrects “black king” to “white king.”
          </li>
          <li>
            <BookLink
              href={`${bookPathForChapterId('14')}#${bookPositionAnchorId('14.29')}`}
              onNavigate={onNavigate}
            >
              Final Test 14.29
            </BookLink>{' '}
            has the prompt “Black to move. Can he draw?” (print page 233; PDF
            page 234), while its solution begins with White&apos;s 69th move
            (print page 238; PDF page 239). This digital edition presents the
            prompt as “White to move. Can he draw?” so that it agrees with the
            solution.
          </li>
          <li>
            <BookLink
              href={`${bookPathForChapterId('1')}#${bookPositionAnchorId('1.7')}`}
              onNavigate={onNavigate}
            >
              Position 1.7
            </BookLink>{' '}
            prints “Most mistakes made in King + Pawn vs. Pawn endings occur in
            this position.” (print page 32; PDF page 33). This digital edition
            corrects the second material description to “King + Pawn vs. King
            endings,” which agrees with the diagram and section.
          </li>
          <li>
            <BookLink
              href={`${bookPathForChapterId('1')}#${bookPositionAnchorId('1.10')}`}
              onNavigate={onNavigate}
            >
              Position 1.10
            </BookLink>{' '}
            prints “Now the pawn cannot be stopped.” after 2.g6+?? Kh8! (print
            page 34; PDF page 35). The line is drawn and the surrounding text
            says the move misses the win, so this digital edition reads “Now the
            pawn can be stopped.”
          </li>
          <li>
            <BookLink
              href={`${bookPathForChapterId('1')}#${bookPositionAnchorId('1.14')}`}
              onNavigate={onNavigate}
            >
              Position 1.14
            </BookLink>{' '}
            prints “there is a.stalemate.” (print page 37; PDF page 38). This
            digital edition restores the missing space and reads “there is a
            stalemate.”
          </li>
          <li>
            <BookLink
              href={`${bookPathForChapterId('1')}#${bookPositionAnchorId('1.16')}`}
              onNavigate={onNavigate}
            >
              Ending 5 / Position 1.16
            </BookLink>{' '}
            prints “the stronger side’s king..” (print page 38; PDF page 39).
            This digital edition removes the duplicated final period and reads
            “the stronger side’s king.”
          </li>
          <li>
            <BookLink
              href={`${bookPathForChapterId('4')}#${bookPositionAnchorId('4.6')}`}
              onNavigate={onNavigate}
            >
              Position 4.6
            </BookLink>{' '}
            prints “White cannot win tempi to bring his king nearer anymore.”
            (print page 63; PDF page 64). The passage describes Black&apos;s
            king trying to approach while White&apos;s king uses the defensive
            tempo, so this digital edition reads “Black cannot win tempi to
            bring his king nearer anymore.”
          </li>
          <li>
            <BookLink
              href={`${bookPathForChapterId('4')}#${bookPositionAnchorId('4.11')}`}
              onNavigate={onNavigate}
            >
              Analysis diagram 4.11
            </BookLink>{' '}
            prints “Only move, but not enough to draw.” after 6...Qb1+ (print
            page 66; PDF page 67). The resulting position is a tablebase draw,
            so this digital edition reads “Only move, but enough to draw.”
          </li>
          <li>
            <BookLink href={bookPathForChapterId('7')} onNavigate={onNavigate}>
              Chapter 7 introduction
            </BookLink>{' '}
            prints “Endings with same-coloured bishops arise with reasonably
            frequency.” (print page 89; PDF page 90). This digital edition reads
            “reasonable frequency,” using the adjective required to modify the
            noun “frequency.”
          </li>
          <li>
            <BookLink
              href={`${bookPathForChapterId('7')}#${bookPositionAnchorId('7.3')}`}
              onNavigate={onNavigate}
            >
              Position 7.3
            </BookLink>{' '}
            prints “Third Case.The defending king” (print page 91; PDF page 92).
            This digital edition inserts the missing space and reads “Third
            Case. The defending king.”
          </li>
          <li>
            <BookLink
              href={`${bookPathForChapterId('7')}#${bookPositionAnchorId('7.4')}`}
              onNavigate={onNavigate}
            >
              Position 7.4 vicinity
            </BookLink>{' '}
            prints “It think it is better to remember why things happen.” (print
            page 92; PDF page 93). This digital edition corrects the pronoun and
            reads “I think it is better to remember why things happen.”
          </li>
          <li>
            <BookLink
              href={`${bookPathForChapterId('7')}#${bookPositionAnchorId('7.5')}`}
              onNavigate={onNavigate}
            >
              Position 7.5
            </BookLink>{' '}
            prints “victory comes easily, since White cannot offer the bishop
            exchange without obstructing his pawn” after 4.Bh6!+- (print page
            94; PDF page 95). The printed negation contradicts the stated win
            and both supplied winning lines, so this digital edition reads
            “White can offer the bishop exchange without obstructing his pawn.”
          </li>
          <li>
            <BookLink
              href={`${bookPathForChapterId('8')}#${bookPositionAnchorId('8.1')}`}
              onNavigate={onNavigate}
            >
              Position 8.1
            </BookLink>{' '}
            prints “White dominates all 4 squares on the stopping diagonal.”
            (print page 97; PDF page 98). The sentence describes the black king
            and knight controlling the bishop&apos;s stopping diagonal, so this
            digital edition reads “Black dominates all 4 squares on the stopping
            diagonal.”
          </li>
          <li>
            <BookLink
              href={`${bookPathForChapterId('8')}#${bookPositionAnchorId('8.8')}`}
              onNavigate={onNavigate}
            >
              Position 8.8
            </BookLink>{' '}
            is printed as a second “Position 8.7” (print page 103; PDF page
            104). Because it follows Position 8.7 in the sequence, this digital
            edition numbers it Position 8.8.
          </li>
          <li>
            <BookLink
              href={`${bookPathForChapterId('9')}#${bookPositionAnchorId('9.5')}`}
              onNavigate={onNavigate}
            >
              Position 9.5
            </BookLink>{' '}
            prints “the right positional for the defending bishop” (print page
            107; PDF page 108). The sentence requires the noun “position,” so
            this digital edition reads “the right position for the defending
            bishop.”
          </li>
          <li>
            <BookLink
              href={`${bookPathForChapterId('9')}#${bookPositionAnchorId('9.10')}`}
              onNavigate={onNavigate}
            >
              Position 9.10
            </BookLink>{' '}
            is printed as “Position 9.1” (print page 112; PDF page 113). The
            next page explicitly calls it Position 9.10 and the following
            diagram is Position 9.11, so this digital edition uses Position
            9.10.
          </li>
          <li>
            <BookLink
              href={`${bookPathForChapterId('9')}#${bookPositionAnchorId('9.20')}`}
              onNavigate={onNavigate}
            >
              Position 9.20
            </BookLink>{' '}
            is printed as “Position 9.2” (print page 120; PDF page 121). It
            follows Position 9.19 and is the chapter&apos;s twentieth position,
            so this digital edition uses Position 9.20.
          </li>
          <li>
            <BookLink
              href={`${bookPathForChapterId('10')}#${bookEndingAnchorId('65')}`}
              onNavigate={onNavigate}
            >
              Chapter 10, Section 5
            </BookLink>{' '}
            is introduced as “Section 6” in the chapter&apos;s technical
            overview (print page 123; PDF page 124). Chapter 10 has five
            sections, and the rook&apos;s-pawn material begins under “Section 5.
            The rook&apos;s pawn,” so this digital edition corrects the forward
            reference to “Section 5.”
          </li>
          <li>
            <BookLink
              href={`${bookPathForChapterId('10')}#${bookPositionAnchorId('10.20')}`}
              onNavigate={onNavigate}
            >
              Position 10.20
            </BookLink>{' '}
            is described as “as in Position 10.19” (print page 144; PDF page
            145). The sentence describes the imperfect cut shown in Position
            10.20, so this digital edition corrects the cross-reference to
            “Position 10.20.”
          </li>
          <li>
            <BookLink
              href={`${bookPathForChapterId('11')}#${bookPositionAnchorId('11.series.6.1')}`}
              onNavigate={onNavigate}
            >
              Chapter 11, sixth-rank series, first diagram
            </BookLink>{' '}
            is captioned “Draw” (print page 159; PDF page 160). It repeats the
            Position 11.4 placement, whose analysis proves that White wins, so
            this digital edition captions it “White wins.”
          </li>
          <li>
            <BookLink
              href={`${bookPathForChapterId('11')}#${bookPositionAnchorId('11.series.6.2')}`}
              onNavigate={onNavigate}
            >
              Chapter 11, sixth-rank series, second diagram
            </BookLink>{' '}
            is captioned “White wins” (print page 159; PDF page 160). The text
            immediately following the series identifies the second and third
            diagrams as draws, so this digital edition captions it “Draw.”
          </li>
          <li>
            <BookLink
              href={`${bookPathForChapterId('11')}#${bookPositionAnchorId('11.13')}`}
              onNavigate={onNavigate}
            >
              Position 11.13
            </BookLink>{' '}
            is printed as a second “Position 11.12” (print page 167; PDF page
            168). It follows Position 11.12 and precedes Position 11.14, so this
            digital edition numbers it Position 11.13.
          </li>
          <li>
            <BookLink
              href={`${bookPathForChapterId('12')}#${bookPositionAnchorId('12.19')}`}
              onNavigate={onNavigate}
            >
              Position 12.19
            </BookLink>{' '}
            prints “4...Kb5” as an immediate counterattack (print page 185; PDF
            page 186). From the position after 3.d3+, the legal immediate
            counterattack after 4.Kd2 is 4...Kc5.
          </li>
          <li>
            <BookLink
              href={`${bookPathForChapterId('12')}#${bookPositionAnchorId('12.9')}`}
              onNavigate={onNavigate}
            >
              Position 12.9
            </BookLink>{' '}
            says the defending king must reach c7 “on that moment” (print page
            176; PDF page 177). This digital edition corrects the phrase to “at
            that moment.”
          </li>
          <li>
            <BookLink
              href={`${bookPathForChapterId('12')}#${bookPositionAnchorId('12.39')}`}
              onNavigate={onNavigate}
            >
              Position 12.39
            </BookLink>{' '}
            says “When it comes the right moment” (print page 201; PDF page
            202). This digital edition corrects the phrase to “When the right
            moment comes.”
          </li>
          <li>
            <BookLink
              href={`${bookPathForChapterId('13')}#${bookPositionAnchorId('13.1')}`}
              onNavigate={onNavigate}
            >
              Position 13.1–13.3 discussion
            </BookLink>{' '}
            prints “that, is” in the phrase about cornering the enemy king
            (print page 205; PDF page 206). This digital edition removes the
            misplaced comma and reads “that is.”
          </li>
          <li>
            <BookLink
              href={`${bookPathForChapterId('13')}#${bookPositionAnchorId('13.4')}`}
              onNavigate={onNavigate}
            >
              Position 13.4
            </BookLink>{' '}
            prints “Remember this procedure by the moment.” (print page 207; PDF
            page 208). This digital edition reads “Remember this procedure for
            the moment.”
          </li>
          <li>
            <BookLink
              href={`${bookPathForChapterId('13')}#${bookPositionAnchorId('13.14')}`}
              onNavigate={onNavigate}
            >
              Position 13.14
            </BookLink>{' '}
            prints “get his king out of the edge.” (print page 216; PDF page
            217). This digital edition reads “get his king off the edge.”
          </li>
          <li>
            <BookLink
              href={`${bookPathForChapterId('11')}#${bookPositionAnchorId('11.1')}`}
              onNavigate={onNavigate}
            >
              Position 11.1
            </BookLink>{' '}
            prints “3...Rc8!” after “2...Rg1?! 3.Kc6” (print page 154; PDF page
            155), although the black rook on g1 cannot move to c8. The intended
            move is uncertain, so this digital edition preserves the source text
            without making that move playable.
          </li>
          <li>
            <BookLink
              href={`${bookPathForChapterId('15')}#${bookPositionAnchorId('F13')}`}
              onNavigate={onNavigate}
            >
              Appendix F13
            </BookLink>{' '}
            prints “Black can force one of the pawns’ advance to h3 and then
            win.” (print page 244; PDF page 245). The intended action is
            grammatically certain, so this digital edition reads “Black can
            force one of the pawns to advance to h3 and then win.”
          </li>
        </ul>
      </FrontMatterSection>

      <FrontMatterSection title="Publisher's description">
        <p>The good news about chess endgames is:</p>
        <ul>
          <li>
            there are relatively few endings you should really know by heart
          </li>
          <li>
            once you know these endings, that&apos;s it. Your knowledge never
            goes out of date!
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
        <p>
          Your performance will improve dramatically because this book brings
          you:
        </p>
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

      <nav
        aria-labelledby="book-contents-heading"
        className="leg-book-contents"
      >
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
  const firstSolutionProblem = chaptersWithPrintedSolutions.has(chapter.id)
    ? chapter.sections.find(
        (section): section is ProblemSection => section.type === 'problem',
      )
    : undefined

  return (
    <li className="leg-contents-chapter">
      <BookLink
        className="leg-contents-row leg-contents-chapter-row"
        href={chapterHref}
        onNavigate={onNavigate}
      >
        <span>{chapter.label}</span>
        {chapter.label === chapter.name ? null : (
          <strong>{chapter.name}</strong>
        )}
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
      {firstSolutionProblem ? (
        <ol className="leg-supplement-contents">
          <li className="leg-contents-supplement">
            <BookLink
              className="leg-contents-row leg-contents-supplement-row"
              href={`${chapterHref}#${bookProblemSolutionAnchorId(
                firstSolutionProblem.content.number,
              )}`}
              onNavigate={onNavigate}
            >
              <span>Solutions</span>
            </BookLink>
          </li>
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
