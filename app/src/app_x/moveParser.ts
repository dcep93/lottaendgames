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
  parent: Branch | null
  score: number
}

const movePattern =
  /(?<![A-Za-z0-9])((\d+)\s*(\.\.\.|\.)\s*)?((?:O-O-O|O-O|0-0-0|0-0|[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=?[QRBN])?|[a-h]x[a-h][1-8](?:=?[QRBN])?|[a-h][1-8](?:=?[QRBN])?)(?:[+#])?(?:[!?]+|=)?)/g

export function buildChapterPlayback(
  sections: RawChapterSection[],
): ChapterPlayback {
  const playablePositions = new Set<string>()
  const tokensBySectionIndex = new Map<number, TextPlaybackToken[]>()
  let context: PositionContext | null = null

  sections.forEach((section, sectionIndex) => {
    if (section.type === 'position') {
      const position = section as PositionSection
      context = new PositionContext(position.content.number, position.content.fen)
      return
    }

    if (!context || (section.type !== 'moves' && section.type !== 'text')) {
      return
    }

    const content = typeof section.content === 'string' ? section.content : ''
    const tokens = context.parse(content, sectionIndex)

    if (tokens.some((token) => token.type === 'move')) {
      playablePositions.add(context.positionNumber)
      tokensBySectionIndex.set(sectionIndex, tokens)
    }
  })

  return {
    playablePositions,
    tokensBySectionIndex,
  }
}

class PositionContext {
  private branch: Branch
  private readonly baseBlackFen: string
  private readonly baseWhiteFen: string
  readonly positionNumber: string
  private restartParent: Branch | null = null

  constructor(positionNumber: string, initialFen: string) {
    this.positionNumber = positionNumber
    this.baseWhiteFen = withTurn(initialFen, 'w')
    this.baseBlackFen = withTurn(initialFen, 'b')
    this.branch = {
      fen: initialFen,
      path: [],
    }
  }

  parse(content: string, sectionIndex: number): TextPlaybackToken[] {
    const parseTokens = tokenizeMoveText(content)

    return parseTokens.map((token, tokenIndex) => {
      if (token.type === 'text') {
        this.handleTextBoundary(token.text)
        return token
      }

      const candidate = this.resolveCandidate(token, parseTokens, tokenIndex)

      if (!candidate) {
        return {
          text: token.display,
          type: 'text',
        }
      }

      this.branch = candidate.branch

      if (candidate.parent) {
        this.restartParent = candidate.parent
      }

      return {
        display: token.display,
        fen: candidate.branch.fen,
        id: `${this.positionNumber}-${sectionIndex}-${tokenIndex}`,
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
    const continued = applyMove(this.branch, token.san)

    if (continued) {
      candidates.push({
        branch: continued,
        parent: null,
      })
    }

    if (token.moveNumber === 1) {
      const restart = applyMove(this.createRestartBranch(token.prefix), token.san)

      if (restart) {
        candidates.push({
          branch: restart,
          parent: this.branch,
        })
      }
    }

    if (!candidates.length) {
      return null
    }

    const scored = candidates.map((candidate) => ({
      ...candidate,
      score: scoreContinuation(candidate.branch, parseTokens, tokenIndex + 1),
    }))

    return scored.sort((left, right) => right.score - left.score)[0] ?? null
  }

  private createRestartBranch(prefix: string): Branch {
    return {
      fen: prefix.includes('...') ? this.baseBlackFen : this.baseWhiteFen,
      path: [],
    }
  }

  private handleTextBoundary(text: string) {
    if (this.restartParent && /[.)]/.test(text)) {
      this.branch = this.restartParent
      this.restartParent = null
    }
  }
}

function tokenizeMoveText(content: string): ParseToken[] {
  const tokens: ParseToken[] = []
  let cursor = 0

  for (const match of content.matchAll(movePattern)) {
    const index = match.index ?? 0
    const display = match[0]
    const prefix = match[1] ? display.slice(0, display.length - match[4].length) : ''
    const san = normalizeSan(match[4])

    if (index > cursor) {
      tokens.push({
        text: content.slice(cursor, index),
        type: 'text',
      })
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
    tokens.push({
      text: content.slice(cursor),
      type: 'text',
    })
  }

  return tokens
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
      if (/[.)]/.test(token.text)) {
        break
      }

      continue
    }

    const nextBranch = applyMove(testBranch, token.san)

    if (!nextBranch) {
      break
    }

    score += 1
    testBranch = nextBranch
  }

  return score
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
