import { Chess } from 'chess.js'
import type {
  PlaybackAnchor,
  PlaybackCanonicalAlias,
  PlaybackContinuationAlias,
  PlaybackSegment,
  PositionSection,
  RawChapterSection,
} from './chapterTypes'

export type TextPlaybackToken =
  | {
      text: string
      type: 'text'
    }
  | {
      display: string
      fen: string
      hidden?: true
      id: string
      parentFen: string
      path: string[]
      positionNumber: string
      san: string
      sourceId?: string
      type: 'move'
    }

export type ChapterPlayback = {
  playablePositions: Set<string>
  tokensBySectionIndex: Map<number, TextPlaybackToken[]>
}

type CandidateToken = {
  display: string
  moveNumber: number | null
  prefix: string
  san: string
  startsVariation: boolean
  type: 'candidate'
}

type ParseToken =
  | CandidateToken
  | {
      text: string
      type: 'text'
    }

type Branch = {
  fen: string
  path: string[]
}

type BranchCandidate = {
  branch: Branch
  exactMoveNumber: boolean
  fromCurrent: boolean
  parentFen: string
  score: number
  sourceIndex: number
}

type FallbackParseMode = 'current' | 'pending-return'

type PositionedPlaybackContinuationAlias = PlaybackContinuationAlias & {
  positionNumber: string
}

type CanonicalPlaybackDefinition = {
  aliases: PlaybackCanonicalAlias[]
  alternateFens: string[]
  initialFen: string
  paths: string[]
  positionNumber: string
  sourcePositionNumbers: string[]
}

type CanonicalPlaybackNode = {
  fen: string
  parentFen: string
  path: string[]
  positionNumber: string
  san: string
}

type LocatedPlaybackMove = {
  sectionIndex: number
  token: Extract<TextPlaybackToken, { type: 'move' }>
  tokenIndex: number
}

const movePattern =
  /(?<![A-Za-z0-9])((\d+)\s*(\.\.\.|\.)\s*)?((?:O-O-O|O-O|0-0-0|0-0|[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=?[QRBN])?|[a-h]x[a-h][1-8](?:=?[QRBN])?|[a-h][1-8](?:=?[QRBN])?)(?:[+#])?(?:[!?]+|=)?)/g

export function buildChapterPlayback(
  sections: RawChapterSection[],
): ChapterPlayback {
  const playablePositions = new Set<string>()
  const tokensBySectionIndex = new Map<number, TextPlaybackToken[]>()
  let context: PositionContext | null = null
  let hasParsedPlayableSincePosition = false
  const contexts: PositionContext[] = []
  const continuationAliases: PositionedPlaybackContinuationAlias[] = []
  const canonicalDefinitions: CanonicalPlaybackDefinition[] = []

  sections.forEach((section, sectionIndex) => {
    if (section.type === 'position') {
      const position = section as PositionSection
      context = new PositionContext(
        position.content.number,
        position.content.fen,
        position.content.alternateFens,
        position.content.relatedPositionNumbers,
        position.content.playbackAnchors,
        position.content.playbackSegments,
      )
      contexts.push(context)
      continuationAliases.push(
        ...(position.content.playbackContinuationAliases ?? []).map(
          (alias) => ({
            ...alias,
            positionNumber: position.content.number,
          }),
        ),
      )
      if (position.content.playbackCanonicalPaths?.length) {
        canonicalDefinitions.push({
          aliases: position.content.playbackCanonicalAliases ?? [],
          alternateFens: position.content.alternateFens ?? [],
          initialFen: position.content.fen,
          paths: position.content.playbackCanonicalPaths,
          positionNumber: position.content.number,
          sourcePositionNumbers:
            position.content.playbackCanonicalSourcePositionNumbers ?? [],
        })
      }
      hasParsedPlayableSincePosition = false
      return
    }

    if (!context || (section.type !== 'panel' && section.type !== 'text')) {
      return
    }

    const content = getPlayableText(section)
    const playbackSegments = contexts.flatMap((candidateContext) =>
      candidateContext.getPlaybackSegments(sectionIndex),
    )

    if (playbackSegments.length) {
      const tokens = assignMoveTokenIds(
        buildSegmentedPlaybackTokens(content, playbackSegments, sectionIndex),
        sectionIndex,
      )
      const positionNumbers = new Set(
        tokens
          .filter((token) => token.type === 'move')
          .map((token) => token.positionNumber),
      )

      for (const positionNumber of positionNumbers) {
        playablePositions.add(positionNumber)
      }
      if (positionNumbers.size) {
        tokensBySectionIndex.set(sectionIndex, tokens)
      }
      return
    }

    const eligibleContexts = getEligibleContexts(section, contexts, context)
    const selectedPreferredContext = eligibleContexts.includes(context)
      ? context
      : (eligibleContexts.at(-1) ?? context)
    let selectedContext = chooseContextForContent(
      eligibleContexts,
      selectedPreferredContext,
      content,
      hasNumberedMoveText(content) && !hasParsedPlayableSincePosition,
      sectionIndex,
    )
    const parsedTokens = selectedContext.parse(content, sectionIndex)
    let tokens = resolveUnresolvedTextTokens(
      parsedTokens,
      eligibleContexts,
      selectedContext,
      sectionIndex,
    )

    if (!tokens.some((token) => token.type === 'move')) {
      const upcomingPositionContext = section.playbackPositionNumbers
        ? null
        : createUpcomingPositionContext(sections, sectionIndex)

      if (upcomingPositionContext) {
        const upcomingTokens = resolveUnresolvedTextTokens(
          upcomingPositionContext.parse(content, sectionIndex),
          [upcomingPositionContext],
          upcomingPositionContext,
          sectionIndex,
        )

        if (upcomingTokens.some((token) => token.type === 'move')) {
          selectedContext = upcomingPositionContext
          tokens = upcomingTokens
        }
      }
    }

    tokens = resolveAdjacentTextMoveTokens(
      tokens,
      selectedContext.positionNumber,
      sectionIndex,
    )
    tokens = assignMoveTokenIds(tokens, sectionIndex)

    if (tokens.some((token) => token.type === 'move')) {
      if (selectedContext === context) {
        hasParsedPlayableSincePosition = true
      }

      playablePositions.add(selectedContext.positionNumber)
      tokensBySectionIndex.set(sectionIndex, tokens)
    }
  })

  materializePlaybackContinuationAliases(
    tokensBySectionIndex,
    continuationAliases,
  )
  materializeCanonicalPlaybackPaths(tokensBySectionIndex, canonicalDefinitions)

  return {
    playablePositions,
    tokensBySectionIndex,
  }
}

function buildSegmentedPlaybackTokens(
  content: string,
  segments: PlaybackSegment[],
  sectionIndex: number,
) {
  const locatedSegments = segments
    .map((segment) => ({
      index: content.indexOf(segment.start),
      segment,
    }))
    .filter(({ index }) => index >= 0)
    .sort((left, right) => left.index - right.index)
  const tokens: TextPlaybackToken[] = []

  if (!locatedSegments.length) {
    return [{ text: content, type: 'text' as const }]
  }

  if (locatedSegments[0].index > 0) {
    tokens.push({
      text: content.slice(0, locatedSegments[0].index),
      type: 'text',
    })
  }

  for (const [index, located] of locatedSegments.entries()) {
    const end = locatedSegments[index + 1]?.index ?? content.length
    const segmentText = content.slice(located.index, end)
    const segmentContext = new PositionContext(
      located.segment.positionNumber,
      located.segment.parentFen,
    )
    const segmentTokens = prependPlaybackPathPrefix(
      resolveAdjacentTextMoveTokens(
        segmentContext.parse(segmentText, sectionIndex),
        located.segment.positionNumber,
        sectionIndex,
      ),
      located.segment.pathPrefix,
    )
    tokens.push(...segmentTokens)
  }

  return tokens
}

function prependPlaybackPathPrefix(
  tokens: TextPlaybackToken[],
  pathPrefix: string[] | undefined,
) {
  if (!pathPrefix?.length) {
    return tokens
  }

  return tokens.map((token) =>
    token.type === 'move'
      ? {
          ...token,
          path: [...pathPrefix, ...token.path],
        }
      : token,
  )
}

function getEligibleContexts(
  section: RawChapterSection,
  contexts: PositionContext[],
  currentContext: PositionContext,
) {
  const allowed = new Set(
    section.playbackPositionNumbers ?? [
      currentContext.positionNumber,
      ...currentContext.relatedPositionNumbers,
    ],
  )
  const eligible = contexts.filter((candidate) =>
    allowed.has(candidate.positionNumber),
  )

  return eligible.length ? eligible : [currentContext]
}

function assignMoveTokenIds(tokens: TextPlaybackToken[], sectionIndex: number) {
  return tokens.map((token, tokenIndex) =>
    token.type === 'move'
      ? {
          ...token,
          id: `${token.positionNumber}-${sectionIndex}-${tokenIndex}`,
        }
      : token,
  )
}

function materializePlaybackContinuationAliases(
  tokensBySectionIndex: Map<number, TextPlaybackToken[]>,
  aliases: PositionedPlaybackContinuationAlias[],
) {
  for (const [aliasIndex, alias] of aliases.entries()) {
    const sourceTokens = tokensBySectionIndex.get(alias.sectionIndex)

    if (!sourceTokens) {
      continue
    }

    const alternate = findPlaybackMoveOccurrence(
      sourceTokens,
      alias.positionNumber,
      alias.alternateToken,
      alias.alternateOccurrence ?? 0,
    )
    const continuation = findPlaybackMoveOccurrence(
      sourceTokens,
      alias.positionNumber,
      alias.continuationToken,
      alias.continuationOccurrence ?? 0,
    )

    if (!alternate || !continuation) {
      continue
    }

    const continuationIndex = sourceTokens.indexOf(continuation)
    const canonicalParentPath = continuation.path.slice(0, -1)
    const aliasedBranches = new Map<string, Branch>([
      [
        getPlaybackPathKey(canonicalParentPath),
        { fen: alternate.fen, path: alternate.path },
      ],
    ])
    const aliasTokens: TextPlaybackToken[] = []

    for (const token of sourceTokens.slice(continuationIndex)) {
      if (
        token.type !== 'move' ||
        token.hidden ||
        token.positionNumber !== alias.positionNumber ||
        !pathStartsWith(token.path, canonicalParentPath)
      ) {
        continue
      }

      const canonicalTokenParentPath = token.path.slice(0, -1)
      const aliasedParent = aliasedBranches.get(
        getPlaybackPathKey(canonicalTokenParentPath),
      )

      if (!aliasedParent) {
        continue
      }

      const aliasedBranch = applyMove(aliasedParent, token.san)

      if (!aliasedBranch) {
        continue
      }

      aliasedBranches.set(getPlaybackPathKey(token.path), aliasedBranch)
      aliasTokens.push({
        ...token,
        fen: aliasedBranch.fen,
        hidden: true,
        id: `${token.id}-continuation-alias-${aliasIndex}`,
        parentFen: aliasedParent.fen,
        path: aliasedBranch.path,
        sourceId: token.id,
      })
    }

    if (aliasTokens.length) {
      tokensBySectionIndex.set(alias.sectionIndex, [
        ...sourceTokens,
        ...aliasTokens,
      ])
    }
  }
}

function materializeCanonicalPlaybackPaths(
  tokensBySectionIndex: Map<number, TextPlaybackToken[]>,
  definitions: CanonicalPlaybackDefinition[],
) {
  for (const definition of definitions) {
    const canonicalNodes = buildCanonicalPlaybackNodes(definition)
    const canonicalByTransition = groupCanonicalNodesByTransition(
      canonicalNodes.values(),
    )
    const locatedMoves = getLocatedPlaybackMoves(
      tokensBySectionIndex,
      definition.positionNumber,
    )
    const movesByTransition = groupLocatedMovesByTransition(locatedMoves)
    const assignedPaths = new Set<string>()

    for (const [transition, moves] of movesByTransition) {
      const candidates = canonicalByTransition.get(transition)

      if (!candidates?.length) {
        throw new Error(
          `Canonical playback for ${definition.positionNumber} cannot match ${moves[0].token.display}`,
        )
      }
      if (moves.length > candidates.length) {
        throw new Error(
          `Canonical playback for ${definition.positionNumber} has ${moves.length} printed tokens for ${candidates.length} source transitions`,
        )
      }

      for (const [move, node] of matchCanonicalPlaybackMoves(
        moves,
        candidates,
      )) {
        const replacement = {
          ...move.token,
          fen: node.fen,
          parentFen: node.parentFen,
          path: node.path,
          san: node.san,
        }
        const sectionTokens = tokensBySectionIndex.get(move.sectionIndex)

        if (!sectionTokens) {
          throw new Error(
            `Canonical playback section ${move.sectionIndex} disappeared`,
          )
        }
        sectionTokens[move.tokenIndex] = replacement
        move.token = replacement
        assignedPaths.add(getPlaybackPathKey(node.path))
      }
    }

    const aliasesByPath = new Map(
      definition.aliases.map((alias) => [
        getPlaybackPathKey(alias.path),
        alias,
      ]),
    )
    const canonicalSourceMoves = definition.sourcePositionNumbers.flatMap(
      (positionNumber) =>
        getLocatedPlaybackMoves(tokensBySectionIndex, positionNumber),
    )

    for (const node of canonicalNodes.values()) {
      const nodePathKey = getPlaybackPathKey(node.path)

      if (assignedPaths.has(nodePathKey)) {
        continue
      }

      const alias = aliasesByPath.get(nodePathKey)
      const automaticSource = alias
        ? undefined
        : canonicalSourceMoves.find(
            ({ token }) =>
              getPositionIndependentCanonicalTransitionKey(token) ===
              getPositionIndependentCanonicalTransitionKey(node),
          )

      if (!alias && !automaticSource) {
        throw new Error(
          `Canonical playback for ${definition.positionNumber} is missing printed source for ${node.path.join(' ')}`,
        )
      }

      const sourceSectionIndex =
        alias?.sourceSectionIndex ?? automaticSource!.sectionIndex
      const sourceTokens = tokensBySectionIndex.get(sourceSectionIndex)
      const source = alias
        ? sourceTokens
          ? findPlaybackMoveOccurrence(
              sourceTokens,
              alias.sourcePositionNumber,
              alias.sourceToken,
              alias.sourceOccurrence ?? 0,
            )
          : undefined
        : automaticSource!.token

      if (!source || !sourceTokens) {
        throw new Error(
          `Canonical playback alias for ${definition.positionNumber} cannot find ${alias?.sourceToken ?? node.san}`,
        )
      }

      const hiddenAlias: Extract<TextPlaybackToken, { type: 'move' }> = {
        ...source,
        fen: node.fen,
        hidden: true,
        id: `${source.id}-canonical-alias-${definition.positionNumber}-${assignedPaths.size}`,
        parentFen: node.parentFen,
        path: node.path,
        positionNumber: definition.positionNumber,
        san: node.san,
        sourceId: source.id,
      }
      const childIndex = sourceTokens.findIndex(
        (token) =>
          token.type === 'move' &&
          token.positionNumber === definition.positionNumber &&
          pathStartsWith(token.path, node.path),
      )

      sourceTokens.splice(
        childIndex < 0 ? sourceTokens.length : childIndex,
        0,
        hiddenAlias,
      )
      assignedPaths.add(nodePathKey)
    }

    if (assignedPaths.size !== canonicalNodes.size) {
      throw new Error(
        `Canonical playback for ${definition.positionNumber} assigned ${assignedPaths.size} of ${canonicalNodes.size} source paths`,
      )
    }
  }
}

function buildCanonicalPlaybackNodes(definition: CanonicalPlaybackDefinition) {
  const nodes = new Map<string, CanonicalPlaybackNode>()

  for (const [lineIndex, line] of definition.paths.entries()) {
    const rawMoves = line.trim().split(/\s+/).filter(Boolean)
    let acceptedNodes: CanonicalPlaybackNode[] | undefined
    let lastFailure:
      { error: unknown; parentFen: string; rawSan: string } | undefined

    for (const rootFen of [
      definition.initialFen,
      ...definition.alternateFens,
    ]) {
      const chess = new Chess(rootFen)
      const path: string[] = []
      const candidateNodes: CanonicalPlaybackNode[] = []

      try {
        for (const rawSan of rawMoves) {
          const parentFen = chess.fen()

          try {
            const move = chess.move(normalizeSan(rawSan), { strict: false })
            path.push(move.san)
          } catch (error) {
            lastFailure = { error, parentFen, rawSan }
            throw error
          }

          candidateNodes.push({
            fen: chess.fen(),
            parentFen,
            path: [...path],
            positionNumber: definition.positionNumber,
            san: path.at(-1)!,
          })
        }
        acceptedNodes = candidateNodes
        break
      } catch {
        // A canonical line must replay from one root in full. Try the next root.
      }
    }

    if (!acceptedNodes) {
      const failure = lastFailure
      throw new Error(
        `Canonical playback for ${definition.positionNumber}, line ${lineIndex + 1}, cannot play ${failure?.rawSan ?? line} from ${failure?.parentFen ?? definition.initialFen}`,
        { cause: failure?.error },
      )
    }

    for (const node of acceptedNodes) {
      nodes.set(getPlaybackPathKey(node.path), node)
    }
  }

  return nodes
}

function getLocatedPlaybackMoves(
  tokensBySectionIndex: Map<number, TextPlaybackToken[]>,
  positionNumber: string,
) {
  const moves: LocatedPlaybackMove[] = []

  for (const [sectionIndex, tokens] of tokensBySectionIndex) {
    tokens.forEach((token, tokenIndex) => {
      if (
        token.type === 'move' &&
        !token.hidden &&
        token.positionNumber === positionNumber
      ) {
        moves.push({ sectionIndex, token, tokenIndex })
      }
    })
  }

  return moves
}

function groupCanonicalNodesByTransition(
  nodes: Iterable<CanonicalPlaybackNode>,
) {
  const groups = new Map<string, CanonicalPlaybackNode[]>()

  for (const node of nodes) {
    const key = getCanonicalTransitionKey(node)
    groups.set(key, [...(groups.get(key) ?? []), node])
  }

  return groups
}

function groupLocatedMovesByTransition(moves: LocatedPlaybackMove[]) {
  const groups = new Map<string, LocatedPlaybackMove[]>()

  for (const move of moves) {
    const key = getCanonicalTransitionKey(move.token)
    groups.set(key, [...(groups.get(key) ?? []), move])
  }

  return groups
}

function getCanonicalTransitionKey({
  fen,
  parentFen,
  positionNumber,
  san,
}: Pick<
  CanonicalPlaybackNode,
  'fen' | 'parentFen' | 'positionNumber' | 'san'
>) {
  return [
    positionNumber,
    getCanonicalFenState(parentFen),
    san,
    getCanonicalFenState(fen),
  ].join('\u001e')
}

function getPositionIndependentCanonicalTransitionKey({
  fen,
  parentFen,
  san,
}: Pick<CanonicalPlaybackNode, 'fen' | 'parentFen' | 'san'>) {
  return [getCanonicalFenState(parentFen), san, getCanonicalFenState(fen)].join(
    '\u001e',
  )
}

function getCanonicalFenState(fen: string) {
  return fen.split(/\s+/).slice(0, 4).join(' ')
}

function matchCanonicalPlaybackMoves(
  moves: LocatedPlaybackMove[],
  candidates: CanonicalPlaybackNode[],
) {
  const pairings = moves
    .flatMap((move, moveIndex) =>
      candidates.map((candidate, candidateIndex) => ({
        candidate,
        candidateIndex,
        move,
        moveIndex,
        suffixLength: getCommonPathSuffixLength(
          move.token.path,
          candidate.path,
        ),
      })),
    )
    .sort(
      (left, right) =>
        right.suffixLength - left.suffixLength ||
        left.moveIndex - right.moveIndex ||
        left.candidateIndex - right.candidateIndex,
    )
  const assignedMoves = new Set<LocatedPlaybackMove>()
  const assignedCandidates = new Set<CanonicalPlaybackNode>()
  const matches: Array<[LocatedPlaybackMove, CanonicalPlaybackNode]> = []

  for (const { candidate, move } of pairings) {
    if (assignedMoves.has(move) || assignedCandidates.has(candidate)) {
      continue
    }
    assignedMoves.add(move)
    assignedCandidates.add(candidate)
    matches.push([move, candidate])
  }

  if (matches.length !== moves.length) {
    throw new Error('Canonical playback could not assign every printed token')
  }

  return matches
}

function getCommonPathSuffixLength(left: string[], right: string[]) {
  let length = 0

  while (
    length < left.length &&
    length < right.length &&
    left[left.length - 1 - length] === right[right.length - 1 - length]
  ) {
    length += 1
  }

  return length
}

function findPlaybackMoveOccurrence(
  tokens: TextPlaybackToken[],
  positionNumber: string,
  display: string,
  occurrence: number,
) {
  return tokens.filter(
    (token): token is Extract<TextPlaybackToken, { type: 'move' }> =>
      token.type === 'move' &&
      !token.hidden &&
      token.positionNumber === positionNumber &&
      normalizePlaybackToken(token.display) === normalizePlaybackToken(display),
  )[occurrence]
}

function getPlaybackPathKey(path: string[]) {
  return path.join('\u001f')
}

function pathStartsWith(path: string[], prefix: string[]) {
  return (
    path.length > prefix.length &&
    prefix.every((move, index) => path[index] === move)
  )
}

function createUpcomingPositionContext(
  sections: RawChapterSection[],
  sectionIndex: number,
) {
  const nextSection = sections[sectionIndex + 1]

  if (nextSection?.type !== 'position') {
    return null
  }

  const position = nextSection as PositionSection
  return new PositionContext(
    position.content.number,
    position.content.fen,
    position.content.alternateFens,
    position.content.relatedPositionNumbers,
    position.content.playbackAnchors,
    position.content.playbackSegments,
  )
}

function chooseContextForContent(
  contexts: PositionContext[],
  preferredContext: PositionContext,
  content: string,
  preferCurrentContext: boolean,
  sectionIndex: number,
) {
  const preferredScore = scoreContextParse(
    preferredContext,
    content,
    sectionIndex,
  )

  if (
    preferredScore.unresolvedSanCount === 0 ||
    (preferCurrentContext && preferredScore.moveCount > 0)
  ) {
    return preferredContext
  }

  return contexts
    .map((context, contextIndex) => ({
      context,
      contextIndex,
      preferred: context === preferredContext,
      ...scoreContextParse(context, content, sectionIndex),
    }))
    .sort((left, right) => {
      if (left.unresolvedSanCount !== right.unresolvedSanCount) {
        return left.unresolvedSanCount - right.unresolvedSanCount
      }

      if (left.moveCount !== right.moveCount) {
        return right.moveCount - left.moveCount
      }

      if (left.preferred !== right.preferred) {
        return left.preferred ? -1 : 1
      }

      return right.contextIndex - left.contextIndex
    })[0].context
}

function scoreContextParse(
  context: PositionContext,
  content: string,
  sectionIndex: number,
) {
  const tokens = context.clone().parse(content, sectionIndex)

  return {
    moveCount: tokens.filter((token) => token.type === 'move').length,
    unresolvedSanCount: countUnresolvedSan(tokens),
  }
}

function countUnresolvedSan(tokens: TextPlaybackToken[]) {
  return tokens.reduce((count, token) => {
    if (token.type === 'move') {
      return count
    }

    return count + Array.from(token.text.matchAll(movePattern)).length
  }, 0)
}

function resolveUnresolvedTextTokens(
  tokens: TextPlaybackToken[],
  contexts: PositionContext[],
  activeContext: PositionContext,
  sectionIndex: number,
): TextPlaybackToken[] {
  const resolvedTokens: TextPlaybackToken[] = []

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]

    if (token.type === 'move') {
      resolvedTokens.push(token)
      continue
    }

    let text = token.text

    while (tokens[index + 1]?.type === 'text') {
      index += 1
      text += (tokens[index] as Extract<TextPlaybackToken, { type: 'text' }>)
        .text
    }

    resolvedTokens.push(
      ...resolveUnresolvedTextToken(
        text,
        contexts,
        activeContext,
        sectionIndex,
      ),
    )
  }

  return resolvedTokens
}

function resolveUnresolvedTextToken(
  text: string,
  contexts: PositionContext[],
  activeContext: PositionContext,
  sectionIndex: number,
): TextPlaybackToken[] {
  if (!hasNumberedMoveText(text)) {
    return [{ text, type: 'text' }]
  }

  const originalUnresolvedSanCount = countUnresolvedSan([
    { text, type: 'text' },
  ])

  if (!originalUnresolvedSanCount) {
    return [{ text, type: 'text' }]
  }

  const bestFallback = contexts
    .flatMap((context, contextIndex) => {
      if (context === activeContext) {
        return []
      }

      return context
        .previewFallbackParses(text, sectionIndex)
        .map((preview) => ({
          context,
          contextIndex,
          mode: preview.mode,
          moveCount: preview.tokens.filter((token) => token.type === 'move')
            .length,
          unresolvedSanCount: countUnresolvedSan(preview.tokens),
        }))
    })
    .filter((candidate) => candidate.moveCount > 0)
    .sort((left, right) => {
      if (left.unresolvedSanCount !== right.unresolvedSanCount) {
        return left.unresolvedSanCount - right.unresolvedSanCount
      }

      if (left.moveCount !== right.moveCount) {
        return right.moveCount - left.moveCount
      }

      return right.contextIndex - left.contextIndex
    })[0]

  if (
    !bestFallback ||
    bestFallback.unresolvedSanCount >= originalUnresolvedSanCount
  ) {
    return resolveLooseNumberedMoveTokens(
      text,
      contexts,
      activeContext,
      sectionIndex,
    )
  }

  return bestFallback.context.parseFallbackText(
    text,
    sectionIndex,
    bestFallback.mode,
  )
}

function resolveLooseNumberedMoveTokens(
  text: string,
  contexts: PositionContext[],
  activeContext: PositionContext,
  sectionIndex: number,
): TextPlaybackToken[] {
  const parseTokens = tokenizeMoveText(text)
  const resolvedTokens: TextPlaybackToken[] = []
  const contextOrder = [
    activeContext,
    ...contexts.filter((context) => context !== activeContext).reverse(),
  ]
  let resolvedMoveCount = 0

  for (const [tokenIndex, token] of parseTokens.entries()) {
    if (token.type === 'text') {
      resolvedTokens.push(token)
      continue
    }

    if (!token.moveNumber) {
      resolvedTokens.push({
        text: token.display,
        type: 'text',
      })
      continue
    }

    const context = contextOrder.find((candidateContext) =>
      candidateContext
        .clone()
        .parseLooseCandidate(token, sectionIndex, tokenIndex),
    )
    const resolvedToken = context?.parseLooseCandidate(
      token,
      sectionIndex,
      tokenIndex,
    )

    if (!resolvedToken) {
      resolvedTokens.push({
        text: token.display,
        type: 'text',
      })
      continue
    }

    resolvedMoveCount += 1
    resolvedTokens.push(resolvedToken)
  }

  return resolvedMoveCount ? resolvedTokens : [{ text, type: 'text' }]
}

function resolveAdjacentTextMoveTokens(
  tokens: TextPlaybackToken[],
  positionNumber: string,
  sectionIndex: number,
): TextPlaybackToken[] {
  const resolvedTokens: TextPlaybackToken[] = []

  for (const [tokenIndex, token] of tokens.entries()) {
    if (token.type === 'move') {
      resolvedTokens.push(token)
      continue
    }

    const previousMove = findPreviousMoveToken(resolvedTokens)

    if (!previousMove) {
      resolvedTokens.push(token)
      continue
    }

    resolvedTokens.push(
      ...resolveTextMovesFromBranch(
        token.text,
        {
          fen: previousMove.fen,
          path: previousMove.path,
        },
        positionNumber,
        sectionIndex,
        tokenIndex,
      ),
    )
  }

  return resolvedTokens
}

function resolveTextMovesFromBranch(
  text: string,
  branch: Branch,
  positionNumber: string,
  sectionIndex: number,
  sourceTokenIndex: number,
): TextPlaybackToken[] {
  const parseTokens = tokenizeMoveText(text)
  const resolvedTokens: TextPlaybackToken[] = []
  let currentBranch = branch
  let resolvedMoveCount = 0

  for (const [parseTokenIndex, token] of parseTokens.entries()) {
    if (token.type === 'text') {
      appendPlaybackTextToken(resolvedTokens, token.text)
      continue
    }

    const applied = applyAdjacentTokenMove(currentBranch, token)

    if (!applied) {
      appendPlaybackTextToken(resolvedTokens, token.display)
      continue
    }

    currentBranch = applied.branch
    resolvedMoveCount += 1
    resolvedTokens.push({
      display: token.display,
      fen: applied.branch.fen,
      id: `${positionNumber}-${sectionIndex}-adjacent-${sourceTokenIndex}-${parseTokenIndex}`,
      parentFen: applied.parentFen,
      path: applied.branch.path,
      positionNumber,
      san: applied.branch.path.at(-1)!,
      type: 'move',
    })
  }

  return resolvedMoveCount ? resolvedTokens : [{ text, type: 'text' }]
}

function applyAdjacentTokenMove(branch: Branch, token: CandidateToken) {
  const normalizedBranch = token.moveNumber
    ? withFullmove(branch, token.moveNumber)
    : branch
  const nextBranch = applyMove(normalizedBranch, token.san)

  if (!nextBranch) {
    return null
  }

  return {
    branch: nextBranch,
    parentFen: normalizedBranch.fen,
  }
}

function findPreviousMoveToken(tokens: TextPlaybackToken[]) {
  for (let index = tokens.length - 1; index >= 0; index -= 1) {
    const token = tokens[index]

    if (token.type === 'move') {
      return token
    }

    if (token.text.trim()) {
      return null
    }
  }

  return null
}

function appendPlaybackTextToken(tokens: TextPlaybackToken[], text: string) {
  const previousToken = tokens[tokens.length - 1]

  if (previousToken?.type === 'text') {
    previousToken.text += text
    return
  }

  tokens.push({
    text,
    type: 'text',
  })
}

function hasNumberedMoveText(text: string) {
  return /\b\d+\s*(?:\.\.\.|\.)/.test(text)
}

function getPlayableText(section: RawChapterSection) {
  if (typeof section.content === 'string') {
    return section.content
  }

  if (
    section.type === 'panel' &&
    section.content &&
    typeof section.content === 'object' &&
    'text' in section.content &&
    typeof section.content.text === 'string'
  ) {
    return section.content.text
  }

  return ''
}

class PositionContext {
  private branch: Branch
  private readonly baseBlackFen: string
  private readonly baseWhiteFen: string
  private readonly branchHistory: Branch[] = []
  private readonly initialFen: string
  private readonly branchStack: Branch[] = []
  private readonly variationReturnStack: Branch[] = []
  private readonly playbackAnchors: PlaybackAnchor[]
  private readonly playbackSegments: PlaybackSegment[]
  readonly positionNumber: string
  readonly relatedPositionNumbers: string[]

  constructor(
    positionNumber: string,
    initialFen: string,
    alternateFens: string[] = [],
    relatedPositionNumbers: string[] = [],
    playbackAnchors: PlaybackAnchor[] = [],
    playbackSegments: PlaybackSegment[] = [],
  ) {
    this.positionNumber = positionNumber
    this.relatedPositionNumbers = relatedPositionNumbers
    this.playbackAnchors = playbackAnchors
    this.playbackSegments = playbackSegments
    this.initialFen = initialFen
    this.baseWhiteFen = withTurn(initialFen, 'w')
    this.baseBlackFen = withTurn(initialFen, 'b')
    this.branch = {
      fen: initialFen,
      path: [],
    }
    this.branchHistory.push(this.branch)

    for (const fen of alternateFens) {
      this.branchHistory.push({
        fen,
        path: [],
      })
    }
  }

  getPlaybackSegments(sectionIndex: number) {
    return this.playbackSegments.filter(
      (segment) => segment.sectionIndex === sectionIndex,
    )
  }

  clone() {
    const context = new PositionContext(
      this.positionNumber,
      this.initialFen,
      [],
      this.relatedPositionNumbers,
      this.playbackAnchors,
      this.playbackSegments,
    )
    context.branch = { ...this.branch, path: [...this.branch.path] }
    context.branchHistory.length = 0
    context.branchHistory.push(
      ...this.branchHistory.map((branch) => ({
        fen: branch.fen,
        path: [...branch.path],
      })),
    )
    context.branchStack.push(
      ...this.branchStack.map((branch) => ({
        fen: branch.fen,
        path: [...branch.path],
      })),
    )
    context.variationReturnStack.push(
      ...this.variationReturnStack.map((branch) => ({
        fen: branch.fen,
        path: [...branch.path],
      })),
    )

    return context
  }

  previewFallbackParses(text: string, sectionIndex: number) {
    const previews: Array<{
      mode: FallbackParseMode
      tokens: TextPlaybackToken[]
    }> = [
      {
        mode: 'current',
        tokens: this.clone().parse(text, sectionIndex),
      },
    ]

    if (this.variationReturnStack[0]) {
      const pendingReturnContext = this.clone()
      pendingReturnContext.activatePendingVariationReturn()
      previews.push({
        mode: 'pending-return',
        tokens: pendingReturnContext.parse(text, sectionIndex),
      })
    }

    return previews
  }

  parseFallbackText(
    text: string,
    sectionIndex: number,
    mode: FallbackParseMode,
  ) {
    if (mode === 'pending-return') {
      this.activatePendingVariationReturn()
    }

    return this.parse(text, sectionIndex)
  }

  parse(content: string, sectionIndex: number): TextPlaybackToken[] {
    const parseTokens = tokenizeMoveText(content)
    const tokenOccurrences = new Map<string, number>()

    return parseTokens.map((token, tokenIndex) => {
      if (token.type === 'text') {
        this.handleTextBoundary(
          token.text,
          getNextCandidate(parseTokens, tokenIndex),
        )
        return token
      }

      const tokenKey = normalizePlaybackToken(token.display)
      const occurrence = tokenOccurrences.get(tokenKey) ?? 0
      tokenOccurrences.set(tokenKey, occurrence + 1)
      const anchor = this.playbackAnchors.find(
        (candidateAnchor) =>
          candidateAnchor.sectionIndex === sectionIndex &&
          normalizePlaybackToken(candidateAnchor.token) === tokenKey &&
          (candidateAnchor.occurrence ?? 0) === occurrence,
      )
      const candidate = anchor
        ? this.resolvePlaybackAnchor(token, anchor, occurrence)
        : this.resolveCandidate(token, parseTokens, tokenIndex)

      if (!candidate) {
        return {
          text: token.display,
          type: 'text',
        }
      }

      if (
        (!candidate.fromCurrent || token.startsVariation) &&
        !this.variationReturnStack.length
      ) {
        this.variationReturnStack.push(this.branch)
      }

      this.branch = candidate.branch
      this.rememberBranch(this.branch)

      return {
        display: token.display,
        fen: candidate.branch.fen,
        id: `${this.positionNumber}-${sectionIndex}-${tokenIndex}`,
        parentFen: candidate.parentFen,
        path: candidate.branch.path,
        positionNumber: this.positionNumber,
        san: candidate.branch.path.at(-1)!,
        type: 'move',
      }
    })
  }

  private resolvePlaybackAnchor(
    token: CandidateToken,
    anchor: PlaybackAnchor,
    occurrence: number,
  ): BranchCandidate | null {
    const parent: Branch = {
      fen: anchor.parentFen,
      path: anchor.pathPrefix ?? [
        `@${anchor.sectionIndex}:${normalizePlaybackToken(anchor.token)}:${occurrence}`,
      ],
    }
    const branch = applyMove(parent, token.san)

    if (!branch) {
      return null
    }

    return {
      branch,
      exactMoveNumber: true,
      fromCurrent: branchesMatch(parent, this.branch),
      parentFen: parent.fen,
      score: Number.MAX_SAFE_INTEGER,
      sourceIndex: Number.MAX_SAFE_INTEGER,
    }
  }

  parseLooseCandidate(
    token: CandidateToken,
    sectionIndex: number,
    tokenIndex: number,
  ): TextPlaybackToken | null {
    const candidate = this.resolveCandidate(token, [token], 0)

    if (!candidate) {
      return null
    }

    if (
      (!candidate.fromCurrent || token.startsVariation) &&
      !this.variationReturnStack.length
    ) {
      this.variationReturnStack.push(this.branch)
    }

    this.branch = candidate.branch
    this.rememberBranch(this.branch)

    return {
      display: token.display,
      fen: candidate.branch.fen,
      id: `${this.positionNumber}-${sectionIndex}-${tokenIndex}`,
      parentFen: candidate.parentFen,
      path: candidate.branch.path,
      positionNumber: this.positionNumber,
      san: candidate.branch.path.at(-1)!,
      type: 'move',
    }
  }

  private resolveCandidate(
    token: CandidateToken,
    parseTokens: ParseToken[],
    tokenIndex: number,
  ): BranchCandidate | null {
    const candidates: Array<Omit<BranchCandidate, 'score'>> = []

    if (!token.moveNumber || branchCanAnchorToken(this.branch, token)) {
      const continued = applyTokenMove(this.branch, token)

      if (continued) {
        candidates.push({
          branch: continued.branch,
          exactMoveNumber: continued.exactMoveNumber,
          fromCurrent: true,
          parentFen: continued.parentFen,
          sourceIndex: this.branchHistory.length,
        })
      }
    }

    if (token.moveNumber || !candidates.length) {
      for (
        let sourceIndex = this.branchHistory.length - 1;
        sourceIndex >= 0;
        sourceIndex -= 1
      ) {
        const sourceBranch = this.branchHistory[sourceIndex]

        if (!branchCanAnchorToken(sourceBranch, token)) {
          continue
        }

        const branch = applyTokenMove(sourceBranch, token)

        if (branch) {
          candidates.push({
            branch: branch.branch,
            exactMoveNumber: branch.exactMoveNumber,
            fromCurrent: branchesMatch(sourceBranch, this.branch),
            parentFen: branch.parentFen,
            sourceIndex,
          })
        }
      }
    }

    if (token.moveNumber === 1) {
      const restart = applyMove(
        this.createRestartBranch(token.prefix),
        token.san,
      )

      if (restart) {
        const restartParent = this.createRestartBranch(token.prefix)
        candidates.push({
          branch: restart,
          exactMoveNumber: true,
          fromCurrent: false,
          parentFen: restartParent.fen,
          sourceIndex: -1,
        })
      }
    }

    const uniqueCandidates = dedupeCandidates(candidates)

    if (!uniqueCandidates.length) {
      return null
    }

    const scored = uniqueCandidates.map((candidate) => ({
      ...candidate,
      score: scoreContinuation(candidate.branch, parseTokens, tokenIndex + 1),
    }))

    return scored.sort(compareCandidates)[0] ?? null
  }

  private createRestartBranch(prefix: string): Branch {
    return {
      fen: prefix.includes('...') ? this.baseBlackFen : this.baseWhiteFen,
      path: [],
    }
  }

  private handleTextBoundary(text: string, nextCandidate?: CandidateToken) {
    const keepsLabeledVariationBranch = /\n\s*[A-Z]\)/.test(text)
    const nextTokenContinuesBranch =
      nextCandidate && Boolean(applyTokenMove(this.branch, nextCandidate))

    for (const character of text) {
      if (character === '(') {
        this.branchStack.push(this.branch)
      }

      if (character === ')' && this.branchStack.length) {
        const branch = this.branchStack.pop()

        if (branch) {
          this.branch = branch
        }
      }

      if (
        character === '.' &&
        this.variationReturnStack.length &&
        !keepsLabeledVariationBranch &&
        !nextTokenContinuesBranch
      ) {
        const branch = this.variationReturnStack.pop()
        this.variationReturnStack.length = 0

        if (branch) {
          this.branch = branch
        }
      }
    }
  }

  private rememberBranch(branch: Branch) {
    if (this.branchHistory.some((stored) => branchesMatch(stored, branch))) {
      return
    }

    this.branchHistory.push(branch)
  }

  private activatePendingVariationReturn() {
    const branch = this.variationReturnStack[0]
    this.variationReturnStack.length = 0

    if (branch) {
      this.branch = branch
    }
  }
}

function getNextCandidate(parseTokens: ParseToken[], tokenIndex: number) {
  for (let index = tokenIndex + 1; index < parseTokens.length; index += 1) {
    const token = parseTokens[index]

    if (token.type === 'candidate') {
      return token
    }
  }

  return undefined
}

function tokenizeMoveText(content: string): ParseToken[] {
  const tokens: ParseToken[] = []
  let cursor = 0

  for (const match of content.matchAll(movePattern)) {
    const index = match.index ?? 0
    const matchedDisplay = match[0]
    const hasEvaluationSuffix =
      match[4].endsWith('+') &&
      /^[-−](?!\+)/.test(content.slice(index + matchedDisplay.length))
    const rawSan = hasEvaluationSuffix ? match[4].slice(0, -1) : match[4]
    const display = hasEvaluationSuffix
      ? matchedDisplay.slice(0, -1)
      : matchedDisplay
    const prefix = match[1]
      ? display.slice(0, display.length - rawSan.length)
      : ''
    const san = normalizeSan(rawSan)

    if (
      !shouldTokenizeMoveCandidate(
        match,
        content.slice(cursor, index),
        content.slice(index + display.length),
        tokens,
      )
    ) {
      appendTextToken(tokens, content.slice(cursor, index + display.length))
      cursor = index + display.length
      continue
    }

    if (index > cursor) {
      appendTextToken(tokens, content.slice(cursor, index))
    }

    tokens.push({
      display,
      moveNumber: match[2] ? Number(match[2]) : null,
      prefix,
      san,
      startsVariation:
        isVariationIntroText(content.slice(cursor, index)) ||
        isVariationIntroContinuation(content.slice(index + display.length)),
      type: 'candidate',
    })
    cursor = index + display.length
  }

  if (cursor < content.length) {
    appendTextToken(tokens, content.slice(cursor))
  }

  return tokens
}

function appendTextToken(tokens: ParseToken[], text: string) {
  const previousToken = tokens[tokens.length - 1]

  if (previousToken?.type === 'text') {
    previousToken.text += text
    return
  }

  tokens.push({
    text,
    type: 'text',
  })
}

function shouldTokenizeMoveCandidate(
  match: RegExpMatchArray,
  precedingText: string,
  followingText: string,
  tokens: ParseToken[],
) {
  const previousParseToken = tokens.at(-1)
  const previousText =
    previousParseToken?.type === 'text' ? previousParseToken.text : ''

  if (
    !match[2] &&
    (isProsePlanReference(`${previousText}${precedingText}`) ||
      /\band\s*$/i.test(precedingText))
  ) {
    return false
  }

  if (isProseMoveReference(`${previousText}${precedingText}`)) {
    return false
  }

  if (isProseMoveReferenceContinuation(followingText)) {
    return false
  }

  if (
    !match[4].endsWith('+') &&
    /^\s*-\s*(?:[KQRBN])?[a-h][1-8]/.test(followingText)
  ) {
    return false
  }

  if (match[2]) {
    return true
  }

  const previousToken = tokens[tokens.length - 1]

  if (previousToken?.type === 'candidate') {
    return isMoveContinuationText(precedingText)
  }

  if (/^[KQRBN]/.test(normalizeSan(match[4]))) {
    return true
  }

  return (
    /\.\.\.\s*$/.test(precedingText) ||
    /\bwith\s+(?:simply\s+)?$/i.test(precedingText)
  )
}

function isProsePlanReference(text: string) {
  const normalized = text.replace(/\.\.\./g, '')

  return /\b(?:with\s+(?:the\s+)?idea|(?:the\s+)?idea\s+is|cannot\s+move|intending|attempting|threatened|soundest\s+being)\b[^.!?;\n]*$/i.test(
    normalized,
  )
}

export function isProseMoveReference(text: string) {
  return (
    /\bwould\s+(?:immediately\s+)?draw\s+after\b[^!?;\n]*$/i.test(text) ||
    /\b(?:white|black)\s+moves\s*$/i.test(text) ||
    /(?:\b(?:against|allows?|allowed|answer|as|avoid(?:ed|ing|s)?|blow|by means of|compared to|dominates?|followed by|for example|forcing|i\.e\.|in case|intending|manoeuvre|play first|prefers?|prevented by|preventing|starting with|such as|the next (?:white|black) move will be|the threat (?:is|was)|threat|threatens|threatened|threatening|which would allow|with simply|would allow|would play|would prefer)\s*(?:\.\.\.)?\s*)$/i.test(
      text,
    ) ||
    /(?:tactically\s+)?prevented\s*\(\s*(?:\.\.\.)?\s*$/i.test(text) ||
    /\bwould play\s+\.\.\.[KQRBN]?[a-h][1-8](?:[+#])?\s+and,\s+if\s*$/i.test(
      text,
    )
  )
}

export function isProseMoveReferenceContinuation(text: string) {
  return /^\s*(?:dominates?\b|is impossible\b|line\b|(?:is|was|would be|will be)\s+(?:a\s+)?(?:threat|idea|manoeuvre|resource|possibility)\b|would\s+(?:allow|hinder|prevent)\b)/i.test(
    text,
  )
}

export function isProseSanReference(
  text: string,
  index: number,
  displayLength: number,
) {
  const precedingText = text.slice(0, index)
  const followingText = text.slice(index + displayLength)

  return (
    isProsePlanReference(precedingText) ||
    isProseMoveReference(precedingText) ||
    isProseMoveReferenceContinuation(followingText) ||
    /\b(?:by means of|followed by|plan|route|path)\b[^.!?;\n]*$/i.test(
      precedingText,
    ) ||
    /\b(?:avoided|hindered|prevented)\b[^.!?;\n]*\bwith\s*$/i.test(
      precedingText,
    ) ||
    /\banswer\b[^.!?;\n]*\bwith\s*$/i.test(
      precedingText.replace(/\.\.\./g, ''),
    ) ||
    /\b(?:threatens|threatening)\b[^.!?;\n]*-\s*$/i.test(precedingText) ||
    /\band\s*(?:\.\.\.)?$/i.test(precedingText) ||
    /,\s*(?:\.\.\.)?$/.test(precedingText) ||
    /^\s*-\s*(?:[KQRBN])?[a-h][1-8]/.test(followingText)
  )
}

function isVariationIntroText(text: string) {
  return /\b(?:after|alternative|another way|for instance|if|instead|or also|the only alternative|trap|would be|would lead|would lose|would win)\b[^.\n]*$/i.test(
    text,
  )
}

function isVariationIntroContinuation(text: string) {
  return /^\s*(?:would be|would lead|would lose|would win|loses\b|wins\b)/i.test(
    text,
  )
}

function isMoveContinuationText(text: string) {
  const normalized = text
    .replace(/\.\.\./g, '')
    .replace(/[□Z]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (!normalized) {
    return true
  }

  return /^(?:(?:or|and|then|if|ep|A|B)\b|[(),;:+=!?-]|\s)+$/i.test(normalized)
}

function scoreContinuation(
  branch: Branch,
  parseTokens: ParseToken[],
  startIndex: number,
) {
  let score = 0
  let testBranch = branch

  for (let index = startIndex; index < parseTokens.length; index += 1) {
    const token = parseTokens[index]

    if (token.type === 'text') {
      if (token.text.includes(')')) {
        break
      }

      continue
    }

    if (token.moveNumber && !branchCanAnchorToken(testBranch, token)) {
      break
    }

    const nextBranch = applyTokenMove(testBranch, token)?.branch

    if (!nextBranch) {
      break
    }

    score += 1
    testBranch = nextBranch
  }

  return score
}

function compareCandidates(left: BranchCandidate, right: BranchCandidate) {
  if (left.score !== right.score) {
    return right.score - left.score
  }

  if (left.fromCurrent !== right.fromCurrent) {
    return left.fromCurrent ? -1 : 1
  }

  if (left.exactMoveNumber !== right.exactMoveNumber) {
    return left.exactMoveNumber ? -1 : 1
  }

  return right.sourceIndex - left.sourceIndex
}

function dedupeCandidates(candidates: Array<Omit<BranchCandidate, 'score'>>) {
  const seen = new Set<string>()

  return candidates.filter((candidate) => {
    const key = `${candidate.branch.fen}\n${candidate.branch.path.join('\n')}`

    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

function branchCanAnchorToken(branch: Branch, token: CandidateToken) {
  if (!token.moveNumber) {
    return true
  }

  const fenParts = branch.fen.split(' ')
  const turn = fenParts[1]
  const fullmove = Number(fenParts[5])
  const expectedTurn = token.prefix.includes('...') ? 'b' : 'w'

  return (
    turn === expectedTurn &&
    (fullmove === token.moveNumber || branch.path.length === 0)
  )
}

function applyTokenMove(branch: Branch, token: CandidateToken) {
  if (token.moveNumber && !branchCanAnchorToken(branch, token)) {
    return null
  }

  const normalizedBranch = token.moveNumber
    ? withFullmove(branch, token.moveNumber)
    : branch
  const nextBranch = applyMove(normalizedBranch, token.san)

  if (!nextBranch) {
    return null
  }

  return {
    branch: nextBranch,
    exactMoveNumber:
      !token.moveNumber ||
      Number(branch.fen.split(' ')[5]) === token.moveNumber,
    parentFen: normalizedBranch.fen,
  }
}

function withFullmove(branch: Branch, fullmove: number): Branch {
  const fenParts = branch.fen.split(' ')
  fenParts[5] = String(fullmove)

  return {
    fen: fenParts.join(' '),
    path: branch.path,
  }
}

function branchesMatch(left: Branch, right: Branch) {
  return (
    left.fen === right.fen &&
    left.path.length === right.path.length &&
    left.path.every((move, index) => right.path[index] === move)
  )
}

function applyMove(branch: Branch, san: string): Branch | null {
  try {
    const chess = new Chess(branch.fen)
    const move = chess.move(san, { strict: false })

    return {
      fen: chess.fen(),
      path: [...branch.path, move.san],
    }
  } catch {
    return null
  }
}

function normalizePlaybackToken(token: string) {
  return token.replace(/\s+/g, '')
}

function normalizeSan(rawMove: string) {
  const stripped = rawMove
    .replace(/[!?]+$/g, '')
    .replace(/=$/g, '')
    .replace(/^0-0-0/, 'O-O-O')
    .replace(/^0-0/, 'O-O')

  return stripped.replace(/^([a-h](?:x[a-h])?[18])([QRBN])([+#]?)$/, '$1=$2$3')
}

function withTurn(fen: string, turn: 'b' | 'w') {
  const fenParts = fen.split(' ')
  fenParts[1] = turn
  return fenParts.join(' ')
}
