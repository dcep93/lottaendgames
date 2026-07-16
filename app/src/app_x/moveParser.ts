import { Chess } from 'chess.js'
import type {
  PlaybackAnchor,
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
      id: string
      parentFen: string
      path: string[]
      positionNumber: string
      san: string
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
      : eligibleContexts.at(-1) ?? context
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
    const segmentTokens = resolveAdjacentTextMoveTokens(
      segmentContext.parse(segmentText, sectionIndex),
      located.segment.positionNumber,
      sectionIndex,
    )
    tokens.push(...segmentTokens)
  }

  return tokens
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

function assignMoveTokenIds(
  tokens: TextPlaybackToken[],
  sectionIndex: number,
) {
  return tokens.map((token, tokenIndex) =>
    token.type === 'move'
      ? {
          ...token,
          id: `${token.positionNumber}-${sectionIndex}-${tokenIndex}`,
        }
      : token,
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
  const preferredScore = scoreContextParse(preferredContext, content, sectionIndex)

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
      text += (tokens[index] as Extract<TextPlaybackToken, { type: 'text' }>).text
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

  const originalUnresolvedSanCount = countUnresolvedSan([{ text, type: 'text' }])

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
      san: token.san,
      type: 'move',
    })
  }

  return resolvedMoveCount ? resolvedTokens : [{ text, type: 'text' }]
}

function applyAdjacentTokenMove(branch: Branch, token: CandidateToken) {
  const normalizedBranch =
    token.moveNumber
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
        san: token.san,
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
      path: [
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
      san: token.san,
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
      const restart = applyMove(this.createRestartBranch(token.prefix), token.san)

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
    const display = match[0]
    const prefix = match[1] ? display.slice(0, display.length - match[4].length) : ''
    const san = normalizeSan(match[4])

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
  if (isProseMoveReference(precedingText)) {
    return false
  }

  if (isProseMoveReferenceContinuation(followingText)) {
    return false
  }

  if (/^\s*-\s*(?:[KQRBN])?[a-h][1-8]/.test(followingText)) {
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

export function isProseMoveReference(text: string) {
  return /(?:\b(?:allows?|allowed|answer|as|blow|by means of|dominates?|followed by|for example|forcing|i\.e\.|in case|intending|manoeuvre|play first|prefers?|prevented by|preventing|such as|the threat (?:is|was)|threat|threatens|threatened|threatening|which would allow|would allow|would play|would prefer)\s*(?:\.\.\.)?\s*)$/i.test(
    text,
  )
}

export function isProseMoveReferenceContinuation(text: string) {
  return /^\s*(?:dominates?\b|is impossible\b|(?:is|was|would be|will be)\s+(?:a\s+)?(?:threat|idea|manoeuvre|resource|possibility)\b|would\s+(?:allow|hinder|prevent)\b)/i.test(
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
    isProseMoveReference(precedingText) ||
    isProseMoveReferenceContinuation(followingText) ||
    /\b(?:by means of|followed by|plan|route|path)\b[^.!?;\n]*$/i.test(
      precedingText,
    ) ||
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

  return /^(?:(?:or|and|then|if|A|B)\b|[(),;:+=!?-]|\s)+$/i.test(
    normalized,
  )
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

function dedupeCandidates(
  candidates: Array<Omit<BranchCandidate, 'score'>>,
) {
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

  const normalizedBranch =
    token.moveNumber
      ? withFullmove(branch, token.moveNumber)
      : branch
  const nextBranch = applyMove(normalizedBranch, token.san)

  if (!nextBranch) {
    return null
  }

  return {
    branch: nextBranch,
    exactMoveNumber:
      !token.moveNumber || Number(branch.fen.split(' ')[5]) === token.moveNumber,
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
    .replace(/(?<![QRBN])=$/g, '')
    .replace(/^0-0-0/, 'O-O-O')
    .replace(/^0-0/, 'O-O')

  return stripped.replace(
    /^([a-h](?:x[a-h])?[18])([QRBN])([+#]?)$/,
    '$1=$2$3',
  )
}

function withTurn(fen: string, turn: 'b' | 'w') {
  const fenParts = fen.split(' ')
  fenParts[1] = turn
  return fenParts.join(' ')
}
