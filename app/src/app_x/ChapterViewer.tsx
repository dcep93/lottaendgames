import { useEffect, useMemo, useRef, useState } from 'react'
import type { MouseEvent, MutableRefObject, ReactNode } from 'react'
import {
  bookEndingAnchorId,
  bookPositionAnchorId,
} from '../routing'
import { chapterPayloadPath } from './chapterPayloadManifest'
import {
  hydrateRuntimeChapter,
  type HydratedChapter,
  type RuntimeChapterPayload,
  type RuntimeChapterRenderItem,
} from './chapterRuntime'
import type {
  CaptionSection,
  DiagramSection,
  EndingSection,
  HeadingSection,
  PanelSection,
  PositionSection,
  ProblemSection,
  RawChapterSection,
  TableSection,
  TextSection,
  TitleSection,
} from './chapterTypes'
import ChessBoard from './ChessBoard'
import InstructionalDiagram from './InstructionalDiagram'
import TableBlock from './TableBlock'
import { buildLichessAnalysisUrl, buildLichessEditorUrl } from './lichess'
import type { TextPlaybackToken } from './moveParser'
import BookFrontMatter from './BookFrontMatter'
import {
  getNextNavigationNode,
  getParentFenForNavigationNode,
  getPreferredNextUpdates,
  getPreviousNavigationNode,
  type PositionNavigation,
} from './playbackNavigation'
import { isOneMoveFenTransition } from './playbackPaths'
import PositionControls from './PositionControls'

const emptyChapterSections: RawChapterSection[] = []
const aboutChapter = {
  id: 'about',
  label: 'About',
  name: 'About this edition',
}
const emptyPreparedChapter = hydrateRuntimeChapter({
  endingCount: 0,
  id: '',
  initialPositionFens: {},
  label: '',
  name: '',
  playback: {
    playablePositions: [],
    tokensBySectionIndex: [],
  },
  positionCount: 0,
  renderItems: [],
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

type PlaybackDirection = 'next' | 'previous'

export default function ChapterViewer({
  anchorId,
  chapterId: activeChapterId,
  moduleSelector,
  onBookNavigate,
  onAnchorSelect,
  onChapterSelect,
}: {
  anchorId: string | null
  chapterId: string
  moduleSelector: ReactNode
  onBookNavigate: (href: string) => void
  onAnchorSelect: (anchorId: string) => void
  onChapterSelect: (chapterId: string) => void
}) {
  const [chapterPayload, setChapterPayload] =
    useState<RuntimeChapterPayload | null>(null)
  const [chapterLoadError, setChapterLoadError] = useState<string | null>(null)
  const isAbout = activeChapterId === 'about'
  const activeChapter =
    chapterPayload?.chapters.find((chapter) => chapter.id === activeChapterId) ??
    null
  const chapterTabs = useMemo(
    () => [aboutChapter, ...(chapterPayload?.chapters ?? [])],
    [chapterPayload],
  )
  const preparedChapter = useMemo(
    () =>
      activeChapter ? hydrateRuntimeChapter(activeChapter) : emptyPreparedChapter,
    [activeChapter],
  )
  const chapterSections = preparedChapter.sections
  const chapterRenderItems = preparedChapter.renderItems
  const playback = preparedChapter.playback
  const navigationByPosition = preparedChapter.navigationByPosition
  const initialPositionFens = preparedChapter.initialPositionFens
  const [activeBoards, setActiveBoards] = useState<
    Record<string, ActiveBoardState>
  >({})
  const [activePositionNumber, setActivePositionNumber] = useState<
    string | null
  >(null)
  const [revealedSolutions, setRevealedSolutions] = useState<
    Record<string, boolean>
  >({})
  const problemNumbers = useMemo(
    () =>
      new Set(
        chapterSections
          .filter((section) => section.type === 'problem')
          .map((section) => (section as ProblemSection).content.number),
      ),
    [chapterSections],
  )
  const moveAnimationFrameRef = useRef<number | null>(null)
  const anchorAnimationFrameRef = useRef<number | null>(null)
  const positionCount = preparedChapter.positionCount
  const endingRange = useMemo(
    () => getEndingRange(chapterSections),
    [chapterSections],
  )

  function handleChapterSelect(chapterId: string) {
    if (chapterId === activeChapterId) {
      return
    }

    window.scrollTo({ behavior: 'auto', left: 0, top: 0 })
    cancelAnimationFrameRef(moveAnimationFrameRef)
    setActiveBoards({})
    setActivePositionNumber(null)
    setRevealedSolutions({})
    onChapterSelect(chapterId)
  }

  useEffect(() => {
    let isMounted = true

    fetch(`${import.meta.env.BASE_URL}${chapterPayloadPath}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Chapter payload request failed: ${response.status}`)
        }

        return response.json() as Promise<RuntimeChapterPayload>
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
    cancelAnimationFrameRef(moveAnimationFrameRef)
    setActiveBoards({})
    setActivePositionNumber(null)
    setRevealedSolutions({})
  }, [activeChapterId])

  useEffect(() => {
    if (!activeChapter && !isAbout) {
      return
    }

    cancelAnimationFrameRef(anchorAnimationFrameRef)
    anchorAnimationFrameRef.current = window.requestAnimationFrame(() => {
      const anchorTarget = anchorId
        ? document.getElementById(anchorId)
        : null

      if (anchorTarget) {
        anchorTarget.scrollIntoView({ block: 'start' })
      } else {
        window.scrollTo({ behavior: 'auto', left: 0, top: 0 })
      }

      anchorAnimationFrameRef.current = null
    })

    return () => {
      cancelAnimationFrameRef(anchorAnimationFrameRef)
    }
  }, [activeChapter, anchorId, isAbout])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (
        (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') ||
        isTypingTarget(event.target)
      ) {
        return
      }

      const visibleActivePosition =
        activePositionNumber &&
        isPlayablePositionCardVisible(activePositionNumber)
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
      cancelAnimationFrameRef(moveAnimationFrameRef)
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
      cancelAnimationFrameRef(moveAnimationFrameRef)
    }
  }, [])

  function handleMoveClick(token: Extract<TextPlaybackToken, { type: 'move' }>) {
    if (
      problemNumbers.has(token.positionNumber) &&
      !revealedSolutions[token.positionNumber]
    ) {
      return
    }

    const navigation = navigationByPosition.get(token.positionNumber)
    const initialFen = initialPositionFens[token.positionNumber]
    const parentFen = navigation
      ? getParentFenForNavigationNode(navigation, token.id, initialFen)
      : undefined
    const preferredNextUpdates = navigation
      ? getPreferredNextUpdates(navigation, token.id)
      : {}

    setActivePositionNumber(token.positionNumber)
    cancelAnimationFrameRef(moveAnimationFrameRef)
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
    onAnchorSelect(bookPositionAnchorId(positionNumber))
    cancelAnimationFrameRef(moveAnimationFrameRef)
    setActiveBoards((currentBoards) => {
      return {
        ...currentBoards,
        [positionNumber]: createInitialBoardState(
          initialPositionFens[positionNumber],
        ),
      }
    })
  }

  function handlePositionStep(
    positionNumber: string,
    direction: PlaybackDirection,
  ) {
    const navigation = navigationByPosition.get(positionNumber)

    if (!navigation) {
      return
    }

    setActivePositionNumber(positionNumber)
    cancelAnimationFrameRef(moveAnimationFrameRef)
    setActiveBoards((currentBoards) => {
      const currentBoard =
        currentBoards[positionNumber] ??
        createInitialBoardState(initialPositionFens[positionNumber])

      if (direction === 'next') {
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
          [positionNumber]: createMoveBoardState(currentBoard, nextNode),
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
        [positionNumber]:
          previousNode === null
            ? createInitialBoardState(
                initialPositionFens[positionNumber],
                currentBoard.preferredNextByCursor,
              )
            : createMoveBoardState(currentBoard, previousNode),
      }
    })
  }

  function handleSolutionToggle(problem: ProblemSection) {
    const number = problem.content.number
    const willReveal = !revealedSolutions[number]

    cancelAnimationFrameRef(moveAnimationFrameRef)
    setRevealedSolutions((current) => ({
      ...current,
      [number]: willReveal,
    }))
    setActiveBoards((current) => {
      if (willReveal) {
        return {
          ...current,
          [number]: createInitialBoardState(initialPositionFens[number]),
        }
      }

      const next = { ...current }
      delete next[number]
      return next
    })

    if (!willReveal && activePositionNumber === number) {
      setActivePositionNumber(null)
    }
  }

  return (
    <main className="leg-page">
      <div className="leg-reader-shell">
        {moduleSelector}
        <header className="leg-reader-header">
          <p className="leg-kicker">Lotta Endgames</p>
          <h1>100 Endgames You Must Know</h1>
          {isAbout || activeChapter ? (
            <>
              <ChapterSelector
                activeChapterId={activeChapterId}
                chapters={chapterTabs}
                label="Top chapter selector"
                onSelect={handleChapterSelect}
                variant="select"
              />
              {activeChapter ? (
                <ReaderMeta
                  endingRange={endingRange}
                  positionCount={positionCount}
                />
              ) : null}
            </>
          ) : null}
        </header>
        {chapterLoadError ? (
          <aside className="leg-load-state" role="alert">
            {chapterLoadError}
          </aside>
        ) : isAbout ? (
          <BookFrontMatter
            chapters={chapterPayload?.chapters ?? []}
            onNavigate={onBookNavigate}
          />
        ) : activeChapter ? (
          <article className="leg-chapter">
            {chapterRenderItems.map((item) =>
              item.type === 'positionGroup' ? (
                <PositionStudyGroup
                  activeBoards={activeBoards}
                  activePositionNumber={activePositionNumber}
                  group={item}
                  key={`position-group-${item.index}`}
                  navigationByPosition={navigationByPosition}
                  onAnchorSelect={onAnchorSelect}
                  onMoveClick={handleMoveClick}
                  onPositionReset={handlePositionReset}
                  onPositionStep={handlePositionStep}
                  playback={playback}
                  sections={chapterSections}
                />
              ) : chapterSections[item.index].type === 'problem' ? (
                <ProblemStudyGroup
                  activeBoards={activeBoards}
                  activePositionNumber={activePositionNumber}
                  index={item.index}
                  key={`problem-${item.index}`}
                  navigationByPosition={navigationByPosition}
                  onMoveClick={handleMoveClick}
                  onPositionReset={handlePositionReset}
                  onPositionStep={handlePositionStep}
                  onToggleSolution={handleSolutionToggle}
                  playback={playback}
                  revealed={Boolean(
                    revealedSolutions[
                      (chapterSections[item.index] as ProblemSection).content
                        .number
                    ],
                  )}
                  section={chapterSections[item.index] as ProblemSection}
                />
              ) : (
                <SectionRenderer
                  index={item.index}
                  key={`${chapterSections[item.index].type}-${item.index}`}
                  activeBoards={activeBoards}
                  activePositionNumber={activePositionNumber}
                  navigationByPosition={navigationByPosition}
                  onAnchorSelect={onAnchorSelect}
                  onMoveClick={handleMoveClick}
                  onPositionReset={handlePositionReset}
                  onPositionStep={handlePositionStep}
                  playback={playback}
                  section={chapterSections[item.index]}
                />
              ),
            )}
          </article>
        ) : null}
        {isAbout || activeChapter ? (
          <ChapterSelector
            activeChapterId={activeChapterId}
            chapters={chapterTabs}
            label="Bottom chapter selector"
            onSelect={handleChapterSelect}
            variant="compact"
          />
        ) : null}
      </div>
    </main>
  )
}

export function ReaderMeta({
  endingRange,
  positionCount,
}: {
  endingRange: string | null
  positionCount: number
}) {
  if (!endingRange && positionCount === 0) {
    return null
  }

  return (
    <div className="leg-reader-meta" aria-label="Part summary">
      {endingRange ? <span>Endings {endingRange}</span> : null}
      {positionCount > 0 ? <span>{positionCount} boards</span> : null}
    </div>
  )
}

function getEndingRange(sections: RawChapterSection[]) {
  const endingNumbers = sections
    .filter((section): section is EndingSection => section.type === 'ending')
    .map((section) => section.content.number)

  if (endingNumbers.length === 0) {
    return null
  }

  const first = endingNumbers[0]
  const last = endingNumbers.at(-1)

  return first === last ? first : `${first}-${last}`
}

export function ProblemStudyGroup({
  activeBoards,
  activePositionNumber,
  index,
  navigationByPosition,
  onMoveClick,
  onPositionReset,
  onPositionStep,
  onToggleSolution,
  playback,
  revealed,
  section,
}: {
  activeBoards: Record<string, ActiveBoardState>
  activePositionNumber: string | null
  index: number
  navigationByPosition: HydratedChapter['navigationByPosition']
  onMoveClick: (token: Extract<TextPlaybackToken, { type: 'move' }>) => void
  onPositionReset: (positionNumber: string) => void
  onPositionStep: (
    positionNumber: string,
    direction: PlaybackDirection,
  ) => void
  onToggleSolution: (problem: ProblemSection) => void
  playback: HydratedChapter['playback']
  revealed: boolean
  section: ProblemSection
}) {
  const { fen, markers, number, orientation, prompt, solutionFen } =
    section.content
  const tokens = playback.tokensBySectionIndex.get(index)
  const positionSection: PositionSection = {
    type: 'position',
    content: { fen, markers, number, orientation, subtitle: prompt },
  }

  return (
    <section
      aria-labelledby={`problem-${number}-heading`}
      className="leg-position-study leg-test-problem"
      id={bookPositionAnchorId(number)}
    >
      <div className="leg-position-study-header">
        <PositionCard
          activeBoard={revealed ? activeBoards[number] : undefined}
          activePositionNumber={activePositionNumber}
          hasPlayback={revealed && playback.playablePositions.has(number)}
          headingId={`problem-${number}-heading`}
          headingLabel="Problem"
          lichessInitialFen={revealed ? solutionFen ?? fen : fen}
          navigation={revealed ? navigationByPosition.get(number) : undefined}
          onReset={onPositionReset}
          onStep={onPositionStep}
          section={positionSection}
        />
      </div>
      <div
        aria-label={`Solution for problem ${number}`}
        className={
          revealed
            ? 'leg-position-study-content leg-test-solution is-revealed'
            : 'leg-position-study-content leg-test-solution'
        }
      >
        <button
          aria-controls={`problem-${number}-solution`}
          aria-expanded={revealed}
          className="leg-solution-toggle"
          onClick={() => onToggleSolution(section)}
          type="button"
        >
          {revealed ? 'Hide solution' : 'Show solution'}
        </button>
        {revealed ? (
          <div id={`problem-${number}-solution`}>
            <ProseBlock
              activeBoards={activeBoards}
              activePositionNumber={activePositionNumber}
              content={section.content.solution}
              onMoveClick={onMoveClick}
              tokens={tokens}
            />
          </div>
        ) : null}
      </div>
    </section>
  )
}

export function PositionStudyGroup({
  activeBoards,
  activePositionNumber,
  group,
  navigationByPosition,
  onAnchorSelect,
  onMoveClick,
  onPositionReset,
  onPositionStep,
  playback,
  sections,
}: {
  activeBoards: Record<string, ActiveBoardState>
  activePositionNumber: string | null
  group: Extract<RuntimeChapterRenderItem, { type: 'positionGroup' }>
  navigationByPosition: HydratedChapter['navigationByPosition']
  onAnchorSelect: (anchorId: string) => void
  onMoveClick: (token: Extract<TextPlaybackToken, { type: 'move' }>) => void
  onPositionReset: (positionNumber: string) => void
  onPositionStep: (
    positionNumber: string,
    direction: PlaybackDirection,
  ) => void
  playback: HydratedChapter['playback']
  sections: RawChapterSection[]
}) {
  const positionSection = sections[group.index] as PositionSection
  const positionNumber = positionSection.content.number

  return (
    <section
      className={
        group.contentIndexes.length > 0
          ? 'leg-position-study'
          : 'leg-position-study is-board-only'
      }
      aria-labelledby={`position-${positionNumber}-heading`}
      id={bookPositionAnchorId(positionNumber)}
    >
      <div className="leg-position-study-header">
        <PositionCard
          activeBoard={activeBoards[positionNumber]}
          activePositionNumber={activePositionNumber}
          hasPlayback={playback.playablePositions.has(positionNumber)}
          headingId={`position-${positionNumber}-heading`}
          navigation={navigationByPosition.get(positionNumber)}
          onReset={onPositionReset}
          onStep={onPositionStep}
          section={positionSection}
        />
      </div>
      {group.contentIndexes.length > 0 ? (
        <div
          aria-label={`Content for position ${positionNumber}`}
          className="leg-position-study-content"
        >
          {group.contentIndexes.map((index) => (
            <SectionRenderer
              activeBoards={activeBoards}
              activePositionNumber={activePositionNumber}
              index={index}
              key={`${sections[index].type}-${index}`}
              navigationByPosition={navigationByPosition}
              onAnchorSelect={onAnchorSelect}
              onMoveClick={onMoveClick}
              onPositionReset={onPositionReset}
              onPositionStep={onPositionStep}
              playback={playback}
              section={sections[index]}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}

export function ChapterSelector({
  activeChapterId,
  chapters,
  label,
  onSelect,
  variant,
}: {
  activeChapterId: string
  chapters: Array<{ id: string; label: string; name: string }>
  label: string
  onSelect: (chapterId: string) => void
  variant: 'compact' | 'select'
}) {
  if (variant === 'select') {
    return (
      <label className="leg-chapter-picker">
        <span className="leg-chapter-picker-label">Contents</span>
        <select
          aria-label={label}
          className="leg-chapter-select"
          onChange={(event) => {
            const chapterId = event.currentTarget.value

            if (chapters.some((chapter) => chapter.id === chapterId)) {
              onSelect(chapterId)
            }
          }}
          value={activeChapterId}
        >
          {chapters.map((chapter) => (
            <option key={chapter.id} value={chapter.id}>
              {chapter.label === chapter.name
                ? chapter.label
                : `${chapter.label} - ${chapter.name}`}
            </option>
          ))}
        </select>
      </label>
    )
  }

  return (
    <nav aria-label={label} className="leg-chapter-selector is-compact">
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

export function EndingBlock({
  onAnchorSelect,
  section,
}: {
  onAnchorSelect: (anchorId: string) => void
  section: EndingSection
}) {
  const anchorId = bookEndingAnchorId(section.content.number)

  return (
    <section className="leg-ending" id={anchorId}>
      <a
        className="leg-ending-anchor"
        href={`#${anchorId}`}
        onClick={(event) => handleAnchorClick(event, anchorId, onAnchorSelect)}
      >
        Ending {section.content.number}
      </a>
      <strong>{section.content.text}</strong>
    </section>
  )
}

function SectionRenderer({
  activeBoards,
  activePositionNumber,
  index,
  navigationByPosition,
  onAnchorSelect,
  onMoveClick,
  onPositionReset,
  onPositionStep,
  playback,
  section,
}: {
  activeBoards: Record<string, ActiveBoardState>
  activePositionNumber: string | null
  index: number
  navigationByPosition: HydratedChapter['navigationByPosition']
  onAnchorSelect: (anchorId: string) => void
  onMoveClick: (token: Extract<TextPlaybackToken, { type: 'move' }>) => void
  onPositionReset: (positionNumber: string) => void
  onPositionStep: (
    positionNumber: string,
    direction: PlaybackDirection,
  ) => void
  playback: HydratedChapter['playback']
  section: RawChapterSection
}) {
  const playbackTokens = playback.tokensBySectionIndex.get(index)

  switch (section.type) {
    case 'caption': {
      const captionSection = section as CaptionSection
      return <p className="leg-section-caption">{captionSection.content}</p>
    }
    case 'diagram':
      return <InstructionalDiagram section={section as DiagramSection} />
    case 'ending': {
      const endingSection = section as EndingSection

      return (
        <EndingBlock
          onAnchorSelect={onAnchorSelect}
          section={endingSection}
        />
      )
    }
    case 'heading': {
      const headingSection = section as HeadingSection
      return <h3 className="leg-section-heading">{headingSection.content}</h3>
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
          navigation={navigationByPosition.get(
            (section as PositionSection).content.number,
          )}
          onReset={onPositionReset}
          onStep={onPositionStep}
          section={section as PositionSection}
        />
      )
    case 'problem':
      return null
    case 'table':
      return <TableBlock section={section as TableSection} />
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

function handleAnchorClick(
  event: MouseEvent<HTMLAnchorElement>,
  anchorId: string,
  onAnchorSelect: (anchorId: string) => void,
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
  onAnchorSelect(anchorId)
}

function PositionCard({
  activeBoard,
  activePositionNumber,
  hasPlayback,
  headingId,
  headingLabel = 'Position',
  lichessInitialFen,
  navigation,
  onReset,
  onStep,
  section,
}: {
  activeBoard?: ActiveBoardState
  activePositionNumber: string | null
  hasPlayback: boolean
  headingId?: string
  headingLabel?: string
  lichessInitialFen?: string
  navigation?: PositionNavigation
  onReset: (positionNumber: string) => void
  onStep: (positionNumber: string, direction: PlaybackDirection) => void
  section: PositionSection
}) {
  const {
    caption,
    displayLabel,
    fen,
    markers,
    number,
    orientation,
    routes,
    subtitle,
  } = section.content
  const isActive = activePositionNumber === number
  const canGoPrevious = Boolean(
    navigation &&
      getPreviousNavigationNode(navigation, activeBoard?.cursorId ?? null) !==
        undefined,
  )
  const canGoNext = Boolean(
    navigation &&
      getNextNavigationNode(
        navigation,
        activeBoard?.cursorId ?? null,
        activeBoard?.preferredNextByCursor ?? {},
      ),
  )
  const lichessUrl = useMemo(
    () => {
      const initialFen = lichessInitialFen ?? fen

      return (
        buildLichessAnalysisUrl({
          currentCursorId: activeBoard?.cursorId ?? null,
          initialFen,
          navigation,
          preferredNextByCursor: activeBoard?.preferredNextByCursor ?? {},
        }) ?? buildLichessEditorUrl(initialFen)
      )
    },
    [
      activeBoard?.cursorId,
      activeBoard?.preferredNextByCursor,
      fen,
      lichessInitialFen,
      navigation,
    ],
  )

  return (
    <figure
      className={
        isActive ? 'leg-position-card is-active-position' : 'leg-position-card'
      }
      data-playable={hasPlayback ? 'true' : 'false'}
      data-position-number={number}
    >
      <div className="leg-position-copy">
        <PositionControls
          canGoNext={canGoNext}
          canGoPrevious={canGoPrevious}
          hasPlayback={hasPlayback}
          lichessUrl={lichessUrl}
          onNext={() => onStep(number, 'next')}
          onPrevious={() => onStep(number, 'previous')}
          onReset={() => onReset(number)}
        />
        <figcaption>
          {displayLabel ? null : <span>{headingLabel}</span>}
          {hasPlayback ? (
            <button
              aria-label={
                displayLabel
                  ? `Reset ${displayLabel} board`
                  : `Reset position ${number}`
              }
              className="leg-position-reset"
              id={headingId}
              onClick={() => onReset(number)}
              type="button"
            >
              {displayLabel ?? number}
            </button>
          ) : (
            <strong id={headingId}>{displayLabel ?? number}</strong>
          )}
        </figcaption>
        {subtitle ? <p className="leg-position-subtitle">{subtitle}</p> : null}
        {caption ? <p className="leg-position-caption">{caption}</p> : null}
      </div>
      <ChessBoard
        animateNextMove={activeBoard?.animateNextMove}
        fen={activeBoard?.fen ?? fen}
        markers={markers}
        number={number}
        orientation={orientation}
        routes={routes}
      />
    </figure>
  )
}

export function PanelBlock({
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
      <p>
        {section.content.title ? `${section.content.title}: ` : null}
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

export function ProseBlock({
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

function cancelAnimationFrameRef(
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

function isPlayablePositionCardVisible(positionNumber: string) {
  const card = getPositionCard(positionNumber)

  return card?.dataset.playable === 'true'
    ? isElementVisibleInViewport(card)
    : false
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
