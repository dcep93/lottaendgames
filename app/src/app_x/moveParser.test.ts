import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import chapterManifest from './chapterManifest.json'
import {
  chapterPayloadContentHash,
  chapterPayloadPath,
} from './chapterPayloadManifest'
import type { RawChapterSection } from './chapterTypes'
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

type ChapterPayload = {
  chapters: Array<{
    id: string
    label: string
    sections: RawChapterSection[]
  }>
  contentHash: string
  schemaVersion: number
}

const chapterPayload = JSON.parse(
  readFileSync(
    new URL(`../../public/${chapterPayloadPath}`, import.meta.url),
    'utf8',
  ),
) as ChapterPayload
const chapterSections = getChapterSections('5')
const chapterSixSections = getChapterSections('6')
const chapterSevenSections = getChapterSections('7')
const chapterEightSections = getChapterSections('8')
const chapterNineSections = getChapterSections('9')
const chapterTenSections = getChapterSections('10')
const chapterElevenSections = getChapterSections('11')
const chapterTwelveSections = getChapterSections('12')
const chapterThirteenSections = getChapterSections('13')
const playback = buildChapterPlayback(chapterSections)
const chapterSixPlayback = buildChapterPlayback(chapterSixSections)
const chapterSevenPlayback = buildChapterPlayback(chapterSevenSections)
const chapterEightPlayback = buildChapterPlayback(chapterEightSections)
const chapterNinePlayback = buildChapterPlayback(chapterNineSections)
const navigationByPosition = buildPlaybackNavigation(playback)
const positionFiveOneIndex = chapterSections.findIndex(
  (section) =>
    section.type === 'position' &&
    (section.content as { number?: string }).number === '5.1',
)
const moveSectionIndex = positionFiveOneIndex + 1
const proseSectionIndex = positionFiveOneIndex + 2
const positionFiveThreeMoveSectionIndex = chapterSections.findIndex(
  (section) =>
    section.type === 'moves' &&
    typeof section.content === 'string' &&
    section.content.startsWith('1.Rg5!'),
)
const positionFiveTenTextSectionIndex = chapterSections.findIndex(
  (section) =>
    section.type === 'text' &&
    typeof section.content === 'string' &&
    section.content.startsWith('Here is the zugzwang position'),
)
const positionFiveTenContinuationMoveSectionIndex = chapterSections.findIndex(
  (section) =>
    section.type === 'moves' &&
    typeof section.content === 'string' &&
    section.content.startsWith('1...e4 2.Re1!'),
)
const positionFiveElevenMoveSectionIndex = chapterSections.findIndex(
  (section) =>
    section.type === 'moves' &&
    typeof section.content === 'string' &&
    section.content.startsWith('1.Rc7+!'),
)
const positionSixSixMoveSectionIndex = chapterSixSections.findIndex(
  (section) =>
    section.type === 'moves' &&
    typeof section.content === 'string' &&
    section.content.startsWith('1...g3'),
)
const moveTokens = getMoveTokens(moveSectionIndex)
const proseTokens = getMoveTokens(proseSectionIndex)
const cuttingOffTokens = getMoveTokens(positionFiveThreeMoveSectionIndex)
const zugzwangTokens = getMoveTokens(positionFiveTenTextSectionIndex)
const zugzwangContinuationTokens = getMoveTokens(
  positionFiveTenContinuationMoveSectionIndex,
)
const kopaevTokens = getMoveTokens(positionFiveElevenMoveSectionIndex)
const rookInFrontTokens = getChapterSixMoveTokens(8)
const seriesOfChecksTokens = getChapterSixMoveTokens(positionSixSixMoveSectionIndex)
const positionFiveOneNavigation = navigationByPosition.get('5.1')
const positionFiveOneInitialFen = '4R3/8/7K/8/1kp5/8/8/8 w - - 0 1'
const panelSections = chapterSections.filter(
  (section) => section.type === 'panel',
)
const chapterSixPanels = chapterSixSections.filter(
  (section) => section.type === 'panel',
)
const chapterSixPositionNumbers = new Set(
  chapterSixSections
    .filter((section) => section.type === 'position')
    .map((section) => (section.content as { number: string }).number),
)
const chapterSevenPositionNumbers = getPositionNumbers(chapterSevenSections)
const chapterEightPositionNumbers = getPositionNumbers(chapterEightSections)
const chapterNinePositionNumbers = getPositionNumbers(chapterNineSections)
const chapterTenCaptions = getCaptions(chapterTenSections)
const chapterElevenCaptions = getCaptions(chapterElevenSections)
const chapterTwelveCaptions = getCaptions(chapterTwelveSections)
const chapterThirteenCaptions = getCaptions(chapterThirteenSections)
const sanScanPattern =
  /(?<![A-Za-z0-9])((\d+)\s*(\.\.\.|\.)\s*)?((?:O-O-O|O-O|0-0-0|0-0|[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=?[QRBN])?|[a-h]x[a-h][1-8](?:=?[QRBN])?|[a-h][1-8](?:=?[QRBN])?)(?:[+#])?(?:[!?]+|=)?)/g
const ignoredSanMisses: Set<string> = new Set([
  '5:44:Re1+',
  '6:26:Rg3',
  '6:31:Rh7',
  '7:11:Bf3',
  '7:22:Kg6',
  '7:31:Ke8',
  '8:5:3...Ng3',
  '8:5:Ne3',
  '8:5:Nf5',
  '8:7:Nf5',
  '8:12:Ng2',
  '8:18:Nb2',
  '9:37:Kf5',
  '9:42:Kf5',
  '9:47:Ka2',
  '9:49:Bf5',
  '9:49:Ka2',
])

assert.equal(positionFiveOneIndex, 4)
assert.equal(chapterPayload.schemaVersion, 1)
assert.match(chapterPayload.contentHash, /^sha256:[a-f0-9]{64}$/)
assert.equal(chapterPayload.contentHash, getPayloadContentHash(chapterPayload))
assert.equal(chapterPayload.contentHash, chapterPayloadContentHash)
assert.match(chapterPayloadPath, /^app_x\/chapters\.[a-f0-9]{16}\.json$/)
assert.deepEqual(
  chapterPayload.chapters.map(({ id, label }) => ({ id, label })),
  chapterManifest,
)
assert.equal(positionFiveThreeMoveSectionIndex, 15)
assert.equal(positionFiveTenTextSectionIndex, 62)
assert.equal(positionFiveTenContinuationMoveSectionIndex, 63)
assert.equal(positionFiveElevenMoveSectionIndex, 67)
assert.equal(positionSixSixMoveSectionIndex, 31)
assert.equal(playback.playablePositions.has('5.1'), true)
assert.ok(positionFiveOneNavigation, 'Expected navigation for position 5.1')
validateChapter(chapterSections)
validateChapter(chapterSixSections)
validateChapter(chapterSevenSections)
validateChapter(chapterEightSections)
validateChapter(chapterNineSections)
validateChapter(chapterTenSections)
validateChapter(chapterElevenSections)
validateChapter(chapterTwelveSections)
validateChapter(chapterThirteenSections)
assert.deepEqual(scanUnclickableSan('5', chapterSections), [])
assert.deepEqual(scanUnclickableSan('6', chapterSixSections), [])
assert.deepEqual(scanUnclickableSan('7', chapterSevenSections), [])
assert.deepEqual(scanUnclickableSan('8', chapterEightSections), [])
assert.deepEqual(scanUnclickableSan('9', chapterNineSections), [])
assert.equal(panelSections.length, 2)
for (const section of panelSections) {
  const content = section.content as { text?: unknown; title?: unknown }
  assert.equal(content.title, 'Summary of interesting ideas')
  assert.equal(typeof content.text, 'string')
  const panelText = content.text as string
  assert.equal(panelText.includes('Summary of interesting ideas:'), false)
}
assert.equal(chapterSixPanels.length, 1)
assert.equal(
  (chapterSixPanels[0].content as { title: string }).title,
  'Conclusion',
)
assert.equal(chapterSixPositionNumbers.has('6.1'), true)
assert.equal(chapterSixPositionNumbers.has('6.7'), true)
assert.equal(chapterSixPlayback.playablePositions.has('6.1'), true)
assert.equal(chapterSixPlayback.playablePositions.has('6.6'), true)
assert.equal(chapterSevenPositionNumbers.has('7.1'), true)
assert.equal(chapterSevenPositionNumbers.has('7.6'), true)
assert.equal(chapterSevenPlayback.playablePositions.has('7.1'), true)
assert.equal(chapterSevenPlayback.playablePositions.has('7.6'), true)
assert.equal(chapterEightPositionNumbers.has('8.1'), true)
assert.equal(chapterEightPositionNumbers.has('8.7b'), true)
assert.equal(chapterEightPlayback.playablePositions.has('8.1'), true)
assert.equal(chapterEightPlayback.playablePositions.has('8.7b'), true)
assert.equal(chapterNinePositionNumbers.has('9.1'), true)
assert.equal(chapterNinePositionNumbers.has('9.20'), true)
assert.equal(chapterNinePlayback.playablePositions.has('9.1'), true)
assert.equal(chapterNinePlayback.playablePositions.has('9.20'), true)
assert.equal(getEndingNumbers(chapterTenSections).at(0), '52')
assert.equal(getEndingNumbers(chapterTenSections).at(-1), '68')
assert.equal(getEndingNumbers(chapterElevenSections).at(0), '69')
assert.equal(getEndingNumbers(chapterElevenSections).at(-1), '76')
assert.equal(getEndingNumbers(chapterTwelveSections).at(0), '77')
assert.equal(getEndingNumbers(chapterTwelveSections).at(-1), '92')
assert.equal(getEndingNumbers(chapterThirteenSections).at(0), '93')
assert.equal(getEndingNumbers(chapterThirteenSections).at(-1), '100')
assertNoExtractionArtifacts('10', chapterTenSections)
assertNoExtractionArtifacts('11', chapterElevenSections)
assertNoExtractionArtifacts('12', chapterTwelveSections)
assertNoExtractionArtifacts('13', chapterThirteenSections)
assertNoSplitWordArtifacts('10', chapterTenSections)
assertNoSplitWordArtifacts('11', chapterElevenSections)
assertNoSplitWordArtifacts('12', chapterTwelveSections)
assertNoSplitWordArtifacts('13', chapterThirteenSections)
assert.equal(chapterTenCaptions.has('Position 10.2'), true)
assert.equal(chapterElevenCaptions.has('Position 11.1'), true)
assert.equal(chapterTwelveCaptions.has('Position 12.1'), true)
assert.equal(chapterThirteenCaptions.has('Position 13.4'), true)

assert.deepEqual(findMove(moveTokens, '1.Kg5!').path, ['Kg5'])

assert.deepEqual(findMove(moveTokens, 'Kb3', 0).path, [
  'c3',
  'Kg5',
  'c2',
  'Rc8',
  'Kb3',
])

assert.deepEqual(findMove(moveTokens, '5.Kd2').path, [
  'Kg5',
  'c3',
  'Kf4',
  'c2',
  'Rc8',
  'Kb3',
  'Ke3',
  'Kb2',
  'Kd2',
])

assert.deepEqual(findMove(proseTokens, '1.Rc8?').path, ['Rc8'])
assert.deepEqual(findMove(proseTokens, '1...Kc3!').path, ['Rc8', 'Kc3'])
assert.deepEqual(findMove(cuttingOffTokens, '1...Kb5').path, [
  'Rg8',
  'Kb5',
])
assert.deepEqual(findMove(cuttingOffTokens, '1...a4?').path, [
  'Rg8',
  'a4',
])
assert.deepEqual(findMove(cuttingOffTokens, '2.Kg7', 0).path, [
  'Rg8',
  'Kc5',
  'Kg7',
])
assert.deepEqual(findMove(cuttingOffTokens, '1...a4').path, ['Rg5', 'a4'])
assert.deepEqual(findMove(cuttingOffTokens, '2.Kg7', 1).path, [
  'Rg5',
  'a4',
  'Kg7',
])
assert.deepEqual(findMove(cuttingOffTokens, '3.Rg3!').path, [
  'Rg5',
  'a4',
  'Kg7',
  'a3',
  'Rg3',
])
assert.deepEqual(findMove(cuttingOffTokens, '4.Ra3+').path, [
  'Rg5',
  'a4',
  'Kg7',
  'a3',
  'Rg3',
  'a2',
  'Ra3',
])
assert.deepEqual(findMove(zugzwangTokens, '2.Ke7').path, ['Ke7'])
assert.deepEqual(findMove(zugzwangTokens, '2.Rf1+').path, ['Rf1+'])
assert.deepEqual(findMove(zugzwangTokens, 'Kg4!').path, ['Rf1+', 'Kg4'])
assert.deepEqual(findMove(zugzwangTokens, '3.Ke6', 0).path, [
  'Rf1+',
  'Kg4',
  'Ke6',
])
assert.deepEqual(findMove(zugzwangTokens, '2...Ke5!').path, ['Ke7', 'Ke5'])
assert.deepEqual(findMove(zugzwangTokens, '2...Kf4?').path, ['Ke7', 'Kf4'])
assert.deepEqual(findMove(zugzwangTokens, '3.Ke6', 1).path, [
  'Ke7',
  'Kf4',
  'Ke6',
])
assert.deepEqual(findMove(zugzwangTokens, '3.Kd7').path, [
  'Ke7',
  'Ke5',
  'Kd7',
])
assert.deepEqual(findMove(zugzwangTokens, 'Kd5!').path, [
  'Ke7',
  'Ke5',
  'Kd7',
  'Kd5',
])
assert.equal(findMove(zugzwangContinuationTokens, '1...e4').positionNumber, '5.9')
assert.deepEqual(findMove(zugzwangContinuationTokens, '1...e4').path, [
  'Re3',
  'e4',
])
assert.deepEqual(findMove(zugzwangContinuationTokens, '2.Re1!').path, [
  'Re3',
  'e4',
  'Re1',
])
assert.deepEqual(findMove(zugzwangContinuationTokens, '6.Kd4+').path, [
  'Re3',
  'e4',
  'Re1',
  'Ke5',
  'Ke7',
  'Kf4',
  'Kd6',
  'Kf3',
  'Kd5',
  'e3',
  'Kd4',
])
assert.equal(findMove(rookInFrontTokens, 'Ra8').positionNumber, '6.1')
assert.equal(
  findMove(rookInFrontTokens, 'Ra8').parentFen,
  '6r1/8/P7/1P5k/8/8/7K/8 b - - 0 1',
)
assert.deepEqual(findMove(rookInFrontTokens, 'Ra8').path, ['Ra8'])
assert.deepEqual(findMove(kopaevTokens, '2.Kd7').path, [
  'Rc7+',
  'Kb3',
  'Kd7',
])
assert.deepEqual(findMove(kopaevTokens, '3.Kd6!').path, [
  'Rc7+',
  'Kb3',
  'Kd7',
  'b4',
  'Kd6',
])
assert.deepEqual(findMove(kopaevTokens, '4.Kd5').path, [
  'Rc7+',
  'Kb3',
  'Kd7',
  'b4',
  'Kc6',
  'Ka2',
  'Kd5',
])
assert.deepEqual(findMove(kopaevTokens, '10.Ka2+').path, [
  'Rc7+',
  'Kb3',
  'Kd7',
  'b4',
  'Kc6',
  'Ka2',
  'Kc5',
  'b3',
  'Kc4',
  'b2',
  'Ra7+',
  'Kb1',
  'Kb3',
  'Kc1',
  'Rc7+',
  'Kb1',
  'Rb7',
  'Kc1',
  'Ka2',
])
assert.deepEqual(findMove(seriesOfChecksTokens, '5.Kg6!').path, [
  'h4',
  'Rg7+',
  'Kf4',
  'Rf7+',
  'Kg3',
  'Kg7',
  'h3',
  'Kg6',
])
assert.deepEqual(findMove(seriesOfChecksTokens, '8.Rg7=').path, [
  'h4',
  'Rg7+',
  'Kf4',
  'Rf7+',
  'Kg3',
  'Kg7',
  'h3',
  'Kg6',
  'Kh2',
  'Kg5',
  'g3',
  'Kh4',
  'g2',
  'Rg7',
])
assert.equal(playback.tokensBySectionIndex.has(1), false)
assert.equal(
  isOneMoveFenTransition(
    positionFiveOneInitialFen,
    findMove(moveTokens, '1.Kg5!').fen,
  ),
  true,
)
assert.equal(
  isOneMoveFenTransition(
    findMove(moveTokens, '1.Kg5!').fen,
    findMove(moveTokens, '1...c3', 1).fen,
  ),
  true,
)
assert.equal(
  isOneMoveFenTransition(
    findMove(moveTokens, '1.Kg5!').fen,
    findMove(moveTokens, '1...c3', 0).fen,
  ),
  false,
)
assert.equal(
  isOneMoveFenTransition(
    positionFiveOneInitialFen,
    findMove(moveTokens, 'Kb3', 0).fen,
  ),
  false,
)
assert.equal(
  isOneMoveFenTransition(
    findMove(moveTokens, '5.Kd2').fen,
    findMove(proseTokens, '1...Kc3!').fen,
  ),
  false,
)
assert.equal(
  isOneMoveFenTransition(
    findMove(moveTokens, '5.Kd2').fen,
    positionFiveOneInitialFen,
  ),
  false,
)

const firstMove = getNextNavigationNode(positionFiveOneNavigation, null, {})
assert.ok(firstMove, 'Expected a main first move for position 5.1')
assert.equal(firstMove?.id, findMove(moveTokens, '1.Kg5!').id)
assert.equal(getPreviousNavigationNode(positionFiveOneNavigation, firstMove.id), null)

const branchPreference = getPreferredNextUpdates(
  positionFiveOneNavigation,
  findMove(moveTokens, '5.Kd2').id,
)
assert.equal(
  getNextNavigationNode(
    positionFiveOneNavigation,
    findMove(moveTokens, '1.Kg5!').id,
    branchPreference,
  )?.id,
  findMove(moveTokens, '1...c3', 1).id,
)
assert.equal(
  getNextNavigationNode(
    positionFiveOneNavigation,
    findMove(moveTokens, '1.Kg5!').id,
    {},
  )?.id,
  findMove(moveTokens, '1...c3', 1).id,
)
assert.equal(
  getNextNavigationNode(positionFiveOneNavigation, null, branchPreference)?.id,
  findMove(moveTokens, '1.Kg5!').id,
)
assert.equal(
  getParentFenForNavigationNode(
    positionFiveOneNavigation,
    findMove(moveTokens, '1.Kg5!').id,
    positionFiveOneInitialFen,
  ),
  positionFiveOneInitialFen,
)
assert.equal(
  getParentFenForNavigationNode(
    positionFiveOneNavigation,
    findMove(moveTokens, '5.Kd2').id,
    positionFiveOneInitialFen,
  ),
  findMove(moveTokens, 'Kb2').fen,
)
assert.equal(
  getParentFenForNavigationNode(
    positionFiveOneNavigation,
    'missing-node',
    positionFiveOneInitialFen,
  ),
  undefined,
)

console.log('moveParser tests passed')

function getChapterSections(chapterId: string) {
  const chapter = chapterPayload.chapters.find(
    (chapterData) => chapterData.id === chapterId,
  )

  assert.ok(chapter, `Expected chapter ${chapterId} in chapter payload.`)

  return chapter.sections
}

function getPayloadContentHash(payload: ChapterPayload) {
  return `sha256:${createHash('sha256')
    .update(canonicalStringify(payload.chapters))
    .digest('hex')}`
}

function canonicalStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalStringify).join(',')}]`
  }

  if (value && typeof value === 'object') {
    return `{${Object.entries(value)
      .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
      .map(
        ([key, entryValue]) =>
          `${JSON.stringify(key)}:${canonicalStringify(entryValue)}`,
      )
      .join(',')}}`
  }

  return JSON.stringify(value)
}

function getMoveTokens(sectionIndex: number) {
  const tokens = playback.tokensBySectionIndex.get(sectionIndex)

  if (!tokens) {
    assert.fail(`Expected playback tokens for section ${sectionIndex}`)
  }

  return tokens.filter(isMoveToken)
}

function getChapterSixMoveTokens(sectionIndex: number) {
  const tokens = chapterSixPlayback.tokensBySectionIndex.get(sectionIndex)

  if (!tokens) {
    assert.fail(`Expected chapter 6 playback tokens for section ${sectionIndex}`)
  }

  return tokens.filter(isMoveToken)
}

function getPositionNumbers(sections: RawChapterSection[]) {
  return new Set(
    sections
      .filter((section) => section.type === 'position')
      .map((section) => (section.content as { number: string }).number),
  )
}

function getEndingNumbers(sections: RawChapterSection[]) {
  return sections
    .filter((section) => section.type === 'ending')
    .map((section) => (section.content as { number: string }).number)
}

function getCaptions(sections: RawChapterSection[]) {
  return new Set(
    sections
      .filter((section) => section.type === 'caption')
      .map((section) => section.content as string),
  )
}

function findMove(
  tokens: Array<Extract<TextPlaybackToken, { type: 'move' }>>,
  display: string,
  occurrence = 0,
) {
  const matches = tokens.filter((token) => token.display === display)
  const token = matches[occurrence]

  assert.ok(token, `Expected move token ${display} occurrence ${occurrence}`)

  return token
}

function isMoveToken(
  token: TextPlaybackToken,
): token is Extract<TextPlaybackToken, { type: 'move' }> {
  return token.type === 'move'
}

function validateChapter(sections: RawChapterSection[]) {
  for (const [index, section] of sections.entries()) {
    assert.equal(typeof section.type, 'string')
    assert.ok('content' in section, `Expected content for section ${index}`)

    if (section.type === 'ending') {
      const content = section.content as { number?: unknown; text?: unknown }
      assert.equal(typeof content.number, 'string')
      assert.equal(typeof content.text, 'string')
    }

    if (section.type === 'panel') {
      const content = section.content as { text?: unknown; title?: unknown }
      assert.equal(typeof content.title, 'string')
      assert.equal(typeof content.text, 'string')
    }

    if (section.type === 'position') {
      const content = section.content as {
        fen?: unknown
        markers?: unknown
        number?: unknown
      }
      assert.equal(typeof content.number, 'string')
      assert.equal(typeof content.fen, 'string')

      if (Array.isArray(content.markers)) {
        for (const marker of content.markers) {
          const typedMarker = marker as {
            meaning?: unknown
            square?: unknown
            symbol?: unknown
          }
          assert.equal(typeof typedMarker.square, 'string')
          assert.equal(typeof typedMarker.symbol, 'string')
          assert.equal(typeof typedMarker.meaning, 'string')
        }
      }
    }
  }
}

function assertNoExtractionArtifacts(
  chapterNumber: string,
  sections: RawChapterSection[],
) {
  const text = JSON.stringify(sections)
  const artifacts = ['�', 'J::', 'J:', 'l:I', 'l:r', 'l:t', '<;t>', '\\t>']
  const foundArtifacts = artifacts.filter((artifact) => text.includes(artifact))

  assert.deepEqual(
    foundArtifacts,
    [],
    `Chapter ${chapterNumber} should not contain known PDF chess-font artifacts.`,
  )
}

function assertNoSplitWordArtifacts(
  chapterNumber: string,
  sections: RawChapterSection[],
) {
  const text = JSON.stringify(sections)
  const artifacts = [
    'Undoubte dly',
    'sev eral',
    'endg ames',
    'tech nique',
    'posit ions',
    'theoret ical',
    'pract ical',
    'impor tant',
    'bish op',
    'check mate',
    'coord inated',
  ]
  const foundArtifacts = artifacts.filter((artifact) => text.includes(artifact))

  assert.deepEqual(
    foundArtifacts,
    [],
    `Chapter ${chapterNumber} should not contain known split-word PDF text artifacts.`,
  )
}

function scanUnclickableSan(
  chapterNumber: string,
  sections: RawChapterSection[],
): string[] {
  const scannedPlayback = buildChapterPlayback(sections)
  const misses: string[] = []

  for (const [sectionIndex, section] of sections.entries()) {
    const sectionText = getSectionText(section)

    if (!sectionText) {
      continue
    }

    const tokens = scannedPlayback.tokensBySectionIndex.get(sectionIndex)

    if (!tokens) {
      misses.push(
        ...findSanDisplays(sectionText).map(
          (display) => `${chapterNumber}:${sectionIndex}:${display}`,
        ),
      )
      continue
    }

    for (const token of tokens) {
      if (token.type === 'text') {
        misses.push(
          ...findSanDisplays(token.text).map(
            (display) => `${chapterNumber}:${sectionIndex}:${display}`,
          ),
        )
      }
    }
  }

  return misses.filter((miss) => !ignoredSanMisses.has(miss))
}

function getSectionText(section: RawChapterSection) {
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

function findSanDisplays(text: string) {
  return Array.from(text.matchAll(sanScanPattern))
    .map((match) => ({
      display: match[0],
      index: match.index ?? 0,
    }))
    .filter(({ display, index }) => !shouldIgnoreSanDisplay(display, text, index))
    .map(({ display }) => display)
}

function shouldIgnoreSanDisplay(display: string, text: string, index: number) {
  if (/^\d+$/.test(display)) {
    return true
  }

  return (
    /^[a-h][1-8]$/.test(display) &&
    !/\d\s*(?:\.|\.\.\.)\s*$/.test(text.slice(Math.max(0, index - 12), index))
  )
}
