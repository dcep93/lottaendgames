import { useEffect, useMemo, useRef, useState } from 'react'
import type { MutableRefObject } from 'react'
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

const chapterSections = chapterData as RawChapterSection[]

type ActiveBoardState = {
  activeMoveId: string | null
  animateNextMove: boolean
  cursorId: string | null
  fen: string
  path: string[]
  preferredNextByCursor: Record<string, string>
}

export default function ChapterViewer() {
  const playback = useMemo(() => buildChapterPlayback(chapterSections), [])
  const navigationByPosition = useMemo(
    () => buildPlaybackNavigation(playback),
    [playback],
  )
  const initialPositionFens = useMemo(() => {
    return chapterSections.reduce<Record<string, string>>((positions, section) => {
      if (section.type === 'position') {
        const position = section as PositionSection
        positions[position.content.number] = position.content.fen
      }

      return positions
    }, {})
  }, [])
  const [activeBoards, setActiveBoards] = useState<
    Record<string, ActiveBoardState>
  >({})
  const [activePositionNumber, setActivePositionNumber] = useState<
    string | null
  >(null)
  const moveAnimationFrameRef = useRef<number | null>(null)
  const positionCount = chapterSections.filter(
    (section) => section.type === 'position',
  ).length
  const endingCount = chapterSections.filter(
    (section) => section.type === 'ending',
  ).length

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
              activeBoards={activeBoards}
              activePositionNumber={activePositionNumber}
              onMoveClick={(token) => {
                const navigation = navigationByPosition.get(token.positionNumber)
                const initialFen = initialPositionFens[token.positionNumber]
                const parentFen = navigation
                  ? getParentFenForNavigationNode(
                      navigation,
                      token.id,
                      initialFen,
                    )
                  : undefined
                const preferredNextUpdates = navigation
                  ? getPreferredNextUpdates(navigation, token.id)
                  : {}

                setActivePositionNumber(token.positionNumber)
                cancelMoveAnimationFrame(moveAnimationFrameRef)
                setActiveBoards((currentBoards) => {
                  const currentBoard =
                    currentBoards[token.positionNumber] ??
                    createInitialBoardState(initialFen)

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
                  moveAnimationFrameRef.current = window.requestAnimationFrame(
                    () => {
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
                    },
                  )
                }
              }}
              onPositionReset={(positionNumber) => {
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
              }}
              playback={playback}
              section={section}
            />
          ))}
        </article>
      </div>
    </main>
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
  onReset,
  section,
}: {
  activeBoard?: ActiveBoardState
  activePositionNumber: string | null
  hasPlayback: boolean
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
              onClick={() => onReset(number)}
              type="button"
            >
              {number}
            </button>
          ) : (
            <strong>{number}</strong>
          )}
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
      <ChessBoard
        animateNextMove={activeBoard?.animateNextMove}
        fen={activeBoard?.fen ?? fen}
        markers={markers}
        number={number}
      />
      <p className="leg-fen">{activeBoard?.fen ?? fen}</p>
    </figure>
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
