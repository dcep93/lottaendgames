import { Chess } from 'chess.js'
import type { PositionSection, RawChapterSection } from './chapterTypes'

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
      )
      contexts.push(context)
      hasParsedPlayableSincePosition = false
      return
    }

    if (
      !context ||
      (section.type !== 'moves' &&
        section.type !== 'panel' &&
        section.type !== 'text')
    ) {
      return
    }

    const content = getPlayableText(section)
    context = chooseContextForContent(
      contexts,
      context,
      content,
      section.type === 'moves' && !hasParsedPlayableSincePosition,
      sectionIndex,
    )
    const tokens = context.parse(content, sectionIndex)

    if (tokens.some((token) => token.type === 'move')) {
      hasParsedPlayableSincePosition = true
      playablePositions.add(context.positionNumber)
      tokensBySectionIndex.set(sectionIndex, tokens)
    }
  })

  return {
    playablePositions,
    tokensBySectionIndex,
  }
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
  readonly positionNumber: string

  constructor(
    positionNumber: string,
    initialFen: string,
    alternateFens: string[] = [],
  ) {
    this.positionNumber = positionNumber
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

  clone() {
    const context = new PositionContext(this.positionNumber, this.initialFen)
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

  parse(content: string, sectionIndex: number): TextPlaybackToken[] {
    const parseTokens = tokenizeMoveText(content)

    return parseTokens.map((token, tokenIndex) => {
      if (token.type === 'text') {
        this.handleTextBoundary(
          token.text,
          getNextCandidate(parseTokens, tokenIndex),
        )
        return token
      }

      const candidate = this.resolveCandidate(token, parseTokens, tokenIndex)

      if (!candidate) {
        return {
          text: token.display,
          type: 'text',
        }
      }

      if (!candidate.fromCurrent && !this.variationReturnStack.length) {
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
  if (hasProseMoveBlocker(precedingText)) {
    return false
  }

  if (/^\s*-\s*[a-h][1-8]/.test(followingText)) {
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

function hasProseMoveBlocker(text: string) {
  return /(?:\b(?:by means of|followed by|forcing|manoeuvre|such as|the threat is|threatening|which would allow|would allow)\s*(?:\.\.\.)?\s*)$/i.test(
    text,
  )
}

function isMoveContinuationText(text: string) {
  const normalized = text
    .replace(/\.\.\./g, '')
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
