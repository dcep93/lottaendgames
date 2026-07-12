import { useEffect, useMemo, useRef, useState } from 'react'
import type { MutableRefObject } from 'react'
import chapterManifest from './chapterManifest.json'
import { chapterPayloadPath } from './chapterPayloadManifest'
import type {
  CaptionSection,
  EndingSection,
  MovesSection,
  PanelSection,
  PositionSection,
  RawChapterSection,
  TextSection,
  TitleSection,
} from './chapterTypes'
import ChessBoard from './ChessBoard'
import {
  buildChapterPlayback,
  type TextPlaybackToken,
} from './moveParser'
import {
  buildPlaybackNavigation,
  getNextNavigationNode,
  getParentFenForNavigationNode,
  getPreferredNextUpdates,
  getPreviousNavigationNode,
} from './playbackNavigation'
import { isOneMoveFenTransition } from './playbackPaths'

type ChapterDefinition = {
  id: string
  label: string
  sections: RawChapterSection[]
}

type ChapterPayload = {
  chapters: ChapterDefinition[]
  contentHash: string
  schemaVersion: number
}

type PreparedChapter = ChapterDefinition & {
  endingCount: number
  initialPositionFens: Record<string, string>
  navigationByPosition: ReturnType<typeof buildPlaybackNavigation>
  playback: ReturnType<typeof buildChapterPlayback>
  positionCount: number
}

const chapterTabs = chapterManifest
const emptyChapterSections: RawChapterSection[] = []
const emptyPreparedChapter = prepareChapter({
  id: '',
  label: '',
  sections: emptyChapterSections,
})

type ActiveBoardState = {
  activeMoveId: string | null
  animateNextMove: boolean
  cursorId: string | null
  fen: string
  path: string[]
  preferredNextByCursor: Record<string, string>
}

type IndexedChapterSection = {
  index: number
  section: RawChapterSection
}

type ChapterRenderItem =
  | {
      index: number
      section: RawChapterSection
      type: 'section'
    }
  | {
      contentSections: IndexedChapterSection[]
      index: number
      positionSection: PositionSection
      type: 'positionGroup'
    }

export default function ChapterViewer() {
  const [activeChapterId, setActiveChapterId] = useState(chapterTabs[0].id)
  const [chapterPayload, setChapterPayload] = useState<ChapterPayload | null>(
    null,
  )
  const [chapterLoadError, setChapterLoadError] = useState<string | null>(null)
  const preparedChapters = useMemo(
    () => chapterPayload?.chapters.map(prepareChapter) ?? [],
    [chapterPayload],
  )
  const activeChapter =
    preparedChapters.find((chapter) => chapter.id === activeChapterId) ??
    null
  const preparedChapter = activeChapter ?? emptyPreparedChapter
  const chapterSections = preparedChapter.sections
  const chapterRenderItems = useMemo(
    () => buildChapterRenderItems(chapterSections),
    [chapterSections],
  )
  const playback = preparedChapter.playback
  const navigationByPosition = preparedChapter.navigationByPosition
  const initialPositionFens = preparedChapter.initialPositionFens
  const [activeBoards, setActiveBoards] = useState<
    Record<string, ActiveBoardState>
  >({})
  const [activePositionNumber, setActivePositionNumber] = useState<
    string | null
  >(null)
  const moveAnimationFrameRef = useRef<number | null>(null)
  const positionCount = preparedChapter.positionCount
  const endingCount = preparedChapter.endingCount

  function handleChapterSelect(chapterId: string) {
    if (chapterId === activeChapterId) {
      return
    }

    cancelMoveAnimationFrame(moveAnimationFrameRef)
    setActiveChapterId(chapterId)
    setActiveBoards({})
    setActivePositionNumber(null)
  }

  useEffect(() => {
    let isMounted = true

    fetch(`${import.meta.env.BASE_URL}${chapterPayloadPath}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Chapter payload request failed: ${response.status}`)
        }

        return response.json() as Promise<ChapterPayload>
      })
      .then((payload) => {
        if (!isMounted) {
          return
        }

        setChapterPayload(payload)
        setChapterLoadError(null)
      })
      .catch((error: unknown) => {
        if (!isMounted) {
          return
        }

        setChapterLoadError(
          error instanceof Error ? error.message : 'Chapter payload failed.',
        )
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (
        (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') ||
        isTypingTarget(event.target)
      ) {
        return
      }

      const visibleActivePosition =
        activePositionNumber && isPositionCardVisible(activePositionNumber)
          ? activePositionNumber
          : getFirstVisiblePlayablePositionNumber()

      if (!visibleActivePosition) {
        return
      }

      const navigation = navigationByPosition.get(visibleActivePosition)

      if (!navigation) {
        return
      }

      event.preventDefault()
      cancelMoveAnimationFrame(moveAnimationFrameRef)
      setActivePositionNumber(visibleActivePosition)
      setActiveBoards((currentBoards) => {
        const currentBoard =
          currentBoards[visibleActivePosition] ??
          createInitialBoardState(initialPositionFens[visibleActivePosition])

        if (event.key === 'ArrowRight') {
          const nextNode = getNextNavigationNode(
            navigation,
            currentBoard.cursorId,
            currentBoard.preferredNextByCursor,
          )

          if (!nextNode) {
            return currentBoards
          }

          return {
            ...currentBoards,
            [visibleActivePosition]: createMoveBoardState(
              currentBoard,
              nextNode,
            ),
          }
        }

        const previousNode = getPreviousNavigationNode(
          navigation,
          currentBoard.cursorId,
        )

        if (previousNode === undefined) {
          return currentBoards
        }

        return {
          ...currentBoards,
          [visibleActivePosition]:
            previousNode === null
              ? createInitialBoardState(
                  initialPositionFens[visibleActivePosition],
                  currentBoard.preferredNextByCursor,
                )
              : createMoveBoardState(currentBoard, previousNode),
        }
      })
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [activePositionNumber, initialPositionFens, navigationByPosition])

  useEffect(() => {
    return () => {
      cancelMoveAnimationFrame(moveAnimationFrameRef)
    }
  }, [])

  function handleMoveClick(token: Extract<TextPlaybackToken, { type: 'move' }>) {
    const navigation = navigationByPosition.get(token.positionNumber)
    const initialFen = initialPositionFens[token.positionNumber]
    const parentFen = navigation
      ? getParentFenForNavigationNode(navigation, token.id, initialFen)
      : undefined
    const preferredNextUpdates = navigation
      ? getPreferredNextUpdates(navigation, token.id)
      : {}

    setActivePositionNumber(token.positionNumber)
    cancelMoveAnimationFrame(moveAnimationFrameRef)
    setActiveBoards((currentBoards) => {
      const currentBoard =
        currentBoards[token.positionNumber] ?? createInitialBoardState(initialFen)

      if (!parentFen) {
        return {
          ...currentBoards,
          [token.positionNumber]: createMoveBoardState(
            currentBoard,
            token,
            preferredNextUpdates,
            currentBoard.fen,
            false,
          ),
        }
      }

      return {
        ...currentBoards,
        [token.positionNumber]: createParentStagingBoardState(
          currentBoard,
          token,
          parentFen,
          preferredNextUpdates,
        ),
      }
    })

    if (parentFen) {
      moveAnimationFrameRef.current = window.requestAnimationFrame(() => {
        setActiveBoards((currentBoards) => {
          const currentBoard =
            currentBoards[token.positionNumber] ??
            createInitialBoardState(initialFen)

          return {
            ...currentBoards,
            [token.positionNumber]: createMoveBoardState(
              currentBoard,
              token,
              {},
              parentFen,
              true,
            ),
          }
        })
        moveAnimationFrameRef.current = null
      })
    }
  }

  function handlePositionReset(positionNumber: string) {
    setActivePositionNumber(positionNumber)
    cancelMoveAnimationFrame(moveAnimationFrameRef)
    setActiveBoards((currentBoards) => {
      return {
        ...currentBoards,
        [positionNumber]: createInitialBoardState(
          initialPositionFens[positionNumber],
        ),
      }
    })
  }

  return (
    <main className="leg-page">
      <div className="leg-reader-shell">
        <header className="leg-reader-header">
          <p className="leg-kicker">Lotta Endgames</p>
          <h1>100 Endgames You Must Know</h1>
          <ChapterSelector
            activeChapterId={activeChapterId}
            chapters={chapterTabs}
            label="Top chapter selector"
            onSelect={handleChapterSelect}
          />
          <div className="leg-reader-meta" aria-label="Chapter summary">
            <span>{chapterSections.length} sections</span>
            <span>{endingCount} endings</span>
            <span>{positionCount} boards</span>
          </div>
        </header>
        {chapterLoadError ? (
          <aside className="leg-load-state" role="alert">
            {chapterLoadError}
          </aside>
        ) : activeChapter ? (
          <article className="leg-chapter">
            {chapterRenderItems.map((item) =>
              item.type === 'positionGroup' ? (
                <PositionStudyGroup
                  activeBoards={activeBoards}
                  activePositionNumber={activePositionNumber}
                  group={item}
                  key={`position-group-${item.positionSection.content.number}-${item.index}`}
                  onMoveClick={handleMoveClick}
                  onPositionReset={handlePositionReset}
                  playback={playback}
                />
              ) : (
                <SectionRenderer
                  index={item.index}
                  key={`${item.section.type}-${item.index}`}
                  activeBoards={activeBoards}
                  activePositionNumber={activePositionNumber}
                  onMoveClick={handleMoveClick}
                  onPositionReset={handlePositionReset}
                  playback={playback}
                  section={item.section}
                />
              ),
            )}
          </article>
        ) : (
          <aside className="leg-load-state">Loading chapter data...</aside>
        )}
        <ChapterSelector
          activeChapterId={activeChapterId}
          chapters={chapterTabs}
          label="Bottom chapter selector"
          onSelect={handleChapterSelect}
        />
      </div>
    </main>
  )
}

function buildChapterRenderItems(
  sections: RawChapterSection[],
): ChapterRenderItem[] {
  const items: ChapterRenderItem[] = []
  let index = 0

  while (index < sections.length) {
    const section = sections[index]

    if (section.type !== 'position') {
      items.push({ index, section, type: 'section' })
      index += 1
      continue
    }

    const contentSections: IndexedChapterSection[] = []
    let nextIndex = index + 1

    while (
      nextIndex < sections.length &&
      !isPositionGroupBoundary(sections[nextIndex])
    ) {
      contentSections.push({
        index: nextIndex,
        section: sections[nextIndex],
      })
      nextIndex += 1
    }

    items.push({
      contentSections,
      index,
      positionSection: section as PositionSection,
      type: 'positionGroup',
    })
    index = nextIndex
  }

  return items
}

function isPositionGroupBoundary(section: RawChapterSection) {
  return (
    section.type === 'position' ||
    section.type === 'ending' ||
    section.type === 'title'
  )
}

function prepareChapter(chapter: ChapterDefinition): PreparedChapter {
  const playback = buildChapterPlayback(chapter.sections)
  const initialPositionFens = chapter.sections.reduce<Record<string, string>>(
    (positions, section) => {
      if (section.type === 'position') {
        const position = section as PositionSection
        positions[position.content.number] = position.content.fen
      }

      return positions
    },
    {},
  )
  return {
    ...chapter,
    endingCount: chapter.sections.filter((section) => section.type === 'ending')
      .length,
    initialPositionFens,
    navigationByPosition: buildPlaybackNavigation(playback),
    playback,
    positionCount: chapter.sections.filter((section) => section.type === 'position')
      .length,
  }
}

function PositionStudyGroup({
  activeBoards,
  activePositionNumber,
  group,
  onMoveClick,
  onPositionReset,
  playback,
}: {
  activeBoards: Record<string, ActiveBoardState>
  activePositionNumber: string | null
  group: Extract<ChapterRenderItem, { type: 'positionGroup' }>
  onMoveClick: (token: Extract<TextPlaybackToken, { type: 'move' }>) => void
  onPositionReset: (positionNumber: string) => void
  playback: ReturnType<typeof buildChapterPlayback>
}) {
  const positionNumber = group.positionSection.content.number

  return (
    <section
      className={
        group.contentSections.length > 0
          ? 'leg-position-study'
          : 'leg-position-study is-board-only'
      }
      aria-labelledby={`position-${positionNumber}-heading`}
    >
      <div className="leg-position-study-board">
        <PositionCard
          activeBoard={activeBoards[positionNumber]}
          activePositionNumber={activePositionNumber}
          hasPlayback={playback.playablePositions.has(positionNumber)}
          headingId={`position-${positionNumber}-heading`}
          onReset={onPositionReset}
          section={group.positionSection}
        />
      </div>
      {group.contentSections.length > 0 ? (
        <div
          aria-label={`Content for position ${positionNumber}`}
          className="leg-position-study-content"
        >
          {group.contentSections.map(({ index, section }) => (
            <SectionRenderer
              activeBoards={activeBoards}
              activePositionNumber={activePositionNumber}
              index={index}
              key={`${section.type}-${index}`}
              onMoveClick={onMoveClick}
              onPositionReset={onPositionReset}
              playback={playback}
              section={section}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}

function ChapterSelector({
  activeChapterId,
  chapters,
  label,
  onSelect,
}: {
  activeChapterId: string
  chapters: Array<{ id: string; label: string }>
  label: string
  onSelect: (chapterId: string) => void
}) {
  return (
    <nav aria-label={label} className="leg-chapter-selector">
      {chapters.map((chapter) => (
        <button
          aria-current={chapter.id === activeChapterId ? 'page' : undefined}
          className={
            chapter.id === activeChapterId
              ? 'leg-chapter-tab is-active'
              : 'leg-chapter-tab'
          }
          data-chapter-id={chapter.id}
          key={chapter.id}
          onClick={() => onSelect(chapter.id)}
          type="button"
        >
          {chapter.label}
        </button>
      ))}
    </nav>
  )
}

function SectionRenderer({
  activeBoards,
  activePositionNumber,
  index,
  onMoveClick,
  onPositionReset,
  playback,
  section,
}: {
  activeBoards: Record<string, ActiveBoardState>
  activePositionNumber: string | null
  index: number
  onMoveClick: (token: Extract<TextPlaybackToken, { type: 'move' }>) => void
  onPositionReset: (positionNumber: string) => void
  playback: ReturnType<typeof buildChapterPlayback>
  section: RawChapterSection
}) {
  const playbackTokens = playback.tokensBySectionIndex.get(index)

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
      return (
        <p className="leg-moves">
          {playbackTokens ? (
            <InlinePlayback
              activeBoards={activeBoards}
              activePositionNumber={activePositionNumber}
              onMoveClick={onMoveClick}
              tokens={playbackTokens}
            />
          ) : (
            movesSection.content
          )}
        </p>
      )
    }
    case 'panel': {
      const panelSection = section as PanelSection
      return (
        <PanelBlock
          activeBoards={activeBoards}
          activePositionNumber={activePositionNumber}
          onMoveClick={onMoveClick}
          section={panelSection}
          tokens={playbackTokens}
        />
      )
    }
    case 'position':
      return (
        <PositionCard
          activeBoard={activeBoards[(section as PositionSection).content.number]}
          activePositionNumber={activePositionNumber}
          hasPlayback={playback.playablePositions.has(
            (section as PositionSection).content.number,
          )}
          onReset={onPositionReset}
          section={section as PositionSection}
        />
      )
    case 'text': {
      const textSection = section as TextSection
      return (
        <ProseBlock
          activeBoards={activeBoards}
          activePositionNumber={activePositionNumber}
          content={textSection.content}
          onMoveClick={onMoveClick}
          tokens={playbackTokens}
        />
      )
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

function PositionCard({
  activeBoard,
  activePositionNumber,
  hasPlayback,
  headingId,
  onReset,
  section,
}: {
  activeBoard?: ActiveBoardState
  activePositionNumber: string | null
  hasPlayback: boolean
  headingId?: string
  onReset: (positionNumber: string) => void
  section: PositionSection
}) {
  const { caption, fen, markers, number } = section.content
  const isActive = activePositionNumber === number

  return (
    <figure
      className={
        isActive ? 'leg-position-card is-active-position' : 'leg-position-card'
      }
      data-playable={hasPlayback ? 'true' : 'false'}
      data-position-number={number}
    >
      <div className="leg-position-copy">
        <figcaption>
          <span>Position</span>
          {hasPlayback ? (
            <button
              aria-label={`Reset position ${number}`}
              className="leg-position-reset"
              id={headingId}
              onClick={() => onReset(number)}
              type="button"
            >
              {number}
            </button>
          ) : (
            <strong id={headingId}>{number}</strong>
          )}
        </figcaption>
        {caption ? <p>{caption}</p> : null}
      </div>
      <ChessBoard
        animateNextMove={activeBoard?.animateNextMove}
        fen={activeBoard?.fen ?? fen}
        markers={markers}
        number={number}
      />
    </figure>
  )
}

function PanelBlock({
  activeBoards,
  activePositionNumber,
  onMoveClick,
  section,
  tokens,
}: {
  activeBoards: Record<string, ActiveBoardState>
  activePositionNumber: string | null
  onMoveClick: (token: Extract<TextPlaybackToken, { type: 'move' }>) => void
  section: PanelSection
  tokens?: TextPlaybackToken[]
}) {
  return (
    <aside className="leg-panel-callout">
      <h3>{section.content.title}</h3>
      <p>
        {tokens ? (
          <InlinePlayback
            activeBoards={activeBoards}
            activePositionNumber={activePositionNumber}
            onMoveClick={onMoveClick}
            tokens={tokens}
          />
        ) : (
          section.content.text
        )}
      </p>
    </aside>
  )
}

function ProseBlock({
  activeBoards,
  activePositionNumber,
  content,
  onMoveClick,
  tokens,
}: {
  activeBoards: Record<string, ActiveBoardState>
  activePositionNumber: string | null
  content: string
  onMoveClick: (token: Extract<TextPlaybackToken, { type: 'move' }>) => void
  tokens?: TextPlaybackToken[]
}) {
  if (tokens) {
    return (
      <div className="leg-prose">
        <p>
          <InlinePlayback
            activeBoards={activeBoards}
            activePositionNumber={activePositionNumber}
            onMoveClick={onMoveClick}
            tokens={tokens}
          />
        </p>
      </div>
    )
  }

  return (
    <div className="leg-prose">
      {content.split(/\n+/).map((paragraph, index) => (
        <p key={`${paragraph.slice(0, 16)}-${index}`}>{paragraph}</p>
      ))}
    </div>
  )
}

function InlinePlayback({
  activeBoards,
  activePositionNumber,
  onMoveClick,
  tokens,
}: {
  activeBoards: Record<string, ActiveBoardState>
  activePositionNumber: string | null
  onMoveClick: (token: Extract<TextPlaybackToken, { type: 'move' }>) => void
  tokens: TextPlaybackToken[]
}) {
  return tokens.map((token, index) => {
    if (token.type === 'text') {
      return <span key={`${token.text.slice(0, 12)}-${index}`}>{token.text}</span>
    }

    const isActive =
      activePositionNumber === token.positionNumber &&
      activeBoards[token.positionNumber]?.activeMoveId === token.id

    return (
      <button
        aria-label={`Show ${token.display} on position ${token.positionNumber}`}
        className={isActive ? 'leg-move-token is-active' : 'leg-move-token'}
        key={token.id}
        onClick={() => onMoveClick(token)}
        title={token.path.join(' ')}
        type="button"
      >
        {token.display}
      </button>
    )
  })
}

function createInitialBoardState(
  fen: string | undefined,
  preferredNextByCursor: Record<string, string> = {},
): ActiveBoardState {
  return {
    activeMoveId: null,
    animateNextMove: false,
    cursorId: null,
    fen: fen ?? '',
    path: [],
    preferredNextByCursor,
  }
}

function createMoveBoardState(
  currentBoard: ActiveBoardState,
  token: Extract<TextPlaybackToken, { type: 'move' }>,
  preferredNextUpdates: Record<string, string> = {},
  currentFen = currentBoard.fen,
  forceAnimate = false,
): ActiveBoardState {
  return {
    activeMoveId: token.id,
    animateNextMove:
      forceAnimate || isOneMoveFenTransition(currentFen, token.fen),
    cursorId: token.id,
    fen: token.fen,
    path: token.path,
    preferredNextByCursor: {
      ...currentBoard.preferredNextByCursor,
      ...preferredNextUpdates,
    },
  }
}

function createParentStagingBoardState(
  currentBoard: ActiveBoardState,
  token: Extract<TextPlaybackToken, { type: 'move' }>,
  parentFen: string,
  preferredNextUpdates: Record<string, string>,
): ActiveBoardState {
  return {
    activeMoveId: null,
    animateNextMove: false,
    cursorId: null,
    fen: parentFen,
    path: token.path.slice(0, -1),
    preferredNextByCursor: {
      ...currentBoard.preferredNextByCursor,
      ...preferredNextUpdates,
    },
  }
}

function cancelMoveAnimationFrame(
  frameRef: MutableRefObject<number | null>,
) {
  if (frameRef.current === null) {
    return
  }

  window.cancelAnimationFrame(frameRef.current)
  frameRef.current = null
}

function getFirstVisiblePlayablePositionNumber() {
  return getPositionCards()
    .find(
      (card) =>
        card.dataset.playable === 'true' &&
        isElementVisibleInViewport(card),
    )
    ?.dataset.positionNumber
}

function getPositionCard(positionNumber: string) {
  return getPositionCards().find(
    (card) => card.dataset.positionNumber === positionNumber,
  )
}

function getPositionCards() {
  return Array.from(
    document.querySelectorAll<HTMLElement>('.leg-position-card'),
  )
}

function isPositionCardVisible(positionNumber: string) {
  const card = getPositionCard(positionNumber)

  return card ? isElementVisibleInViewport(card) : false
}

function isElementVisibleInViewport(element: HTMLElement) {
  const rect = element.getBoundingClientRect()

  return (
    rect.bottom > 0 &&
    rect.right > 0 &&
    rect.top < window.innerHeight &&
    rect.left < window.innerWidth
  )
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return (
    target.isContentEditable ||
    ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)
  )
}
