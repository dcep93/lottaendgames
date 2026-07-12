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

type DiagramExtractionReportEntry = {
  chapter: number
  fen?: string
  label: string
  number: string
  reason?: string
  status: 'kept-caption' | 'promoted' | 'promoted-with-warnings'
}

const chapterPayload = JSON.parse(
  readFileSync(
    new URL(`../../public/${chapterPayloadPath}`, import.meta.url),
    'utf8',
  ),
) as ChapterPayload
const diagramExtractionReport = JSON.parse(
  readFileSync(
    new URL('./pdf/diagram_extraction_report.json', import.meta.url),
    'utf8',
  ),
) as DiagramExtractionReportEntry[]
const chapterOneSections = getChapterSections('1')
const chapterThreeSections = getChapterSections('3')
const chapterFourSections = getChapterSections('4')
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
const chapterOnePositionNumbers = getPositionNumbers(chapterOneSections)
const chapterSevenPositionNumbers = getPositionNumbers(chapterSevenSections)
const chapterEightPositionNumbers = getPositionNumbers(chapterEightSections)
const chapterNinePositionNumbers = getPositionNumbers(chapterNineSections)
const chapterTenPositionNumbers = getPositionNumbers(chapterTenSections)
const chapterElevenPositionNumbers = getPositionNumbers(chapterElevenSections)
const chapterTwelvePositionNumbers = getPositionNumbers(chapterTwelveSections)
const chapterThirteenPositionNumbers = getPositionNumbers(chapterThirteenSections)
const chapterTenCaptions = getCaptions(chapterTenSections)
const chapterElevenCaptions = getCaptions(chapterElevenSections)
const chapterTwelveCaptions = getCaptions(chapterTwelveSections)
const chapterThirteenCaptions = getCaptions(chapterThirteenSections)
const chapterTenPlayback = buildChapterPlayback(chapterTenSections)
const chapterElevenPlayback = buildChapterPlayback(chapterElevenSections)
const chapterTenPhilidorTokens = getChapterMoveTokens(
  chapterTenPlayback,
  chapterTenSections.findIndex(
    (section) =>
      typeof section.content === 'string' &&
      section.content.includes('The text move threatens 3.Kd6'),
  ),
)
const chapterElevenAnalysisTokens = getChapterMoveTokens(
  chapterElevenPlayback,
  chapterElevenSections.findIndex(
    (section) =>
      typeof section.content === 'string' &&
      section.content.startsWith('4...Rg1!'),
  ),
)
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
validateChapter(chapterOneSections)
validateChapter(chapterThreeSections)
validateChapter(chapterFourSections)
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
assert.equal(getEndingNumbers(chapterOneSections).at(0), '1')
assert.equal(getEndingNumbers(chapterOneSections).at(-1), '9')
assert.deepEqual(
  [...chapterOnePositionNumbers],
  Array.from({ length: 25 }, (_, index) => `1.${index + 1}`),
)
assert.equal(getCaptions(chapterOneSections).size, 0)
assert.deepEqual(
  chapterPayload.chapters.flatMap(({ sections }) => getEndingNumbers(sections)),
  Array.from({ length: 100 }, (_, index) => String(index + 1)),
)
assert.equal(getEndingNumbers(chapterThreeSections).at(0), '10')
assert.equal(getEndingNumbers(chapterThreeSections).at(-1), '15')
assert.equal(getEndingNumbers(chapterFourSections).at(0), '16')
assert.equal(getEndingNumbers(chapterFourSections).at(-1), '20')
assert.deepEqual(
  [...getPositionNumbers(chapterThreeSections)],
  Array.from({ length: 10 }, (_, index) => `3.${index + 1}`),
)
assert.deepEqual(
  [...getPositionNumbers(chapterFourSections)],
  Array.from({ length: 13 }, (_, index) => `4.${index + 1}`),
)
assert.equal(getCaptions(chapterThreeSections).size, 0)
assert.equal(getCaptions(chapterFourSections).size, 0)
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
assertNoExtractionArtifacts('1', chapterOneSections)
assertNoExtractionArtifacts('3', chapterThreeSections)
assertNoExtractionArtifacts('4', chapterFourSections)
assertNoExtractionArtifacts('11', chapterElevenSections)
assertNoExtractionArtifacts('12', chapterTwelveSections)
assertNoExtractionArtifacts('13', chapterThirteenSections)
assertNoSplitWordArtifacts('10', chapterTenSections)
assertNoSplitWordArtifacts('1', chapterOneSections)
assertNoSplitWordArtifacts('3', chapterThreeSections)
assertNoSplitWordArtifacts('4', chapterFourSections)
assertNoSplitWordArtifacts('11', chapterElevenSections)
assertNoSplitWordArtifacts('12', chapterTwelveSections)
assertNoSplitWordArtifacts('13', chapterThirteenSections)
assertNoNotationOcrArtifacts('10', chapterTenSections)
assertNoNotationOcrArtifacts('1', chapterOneSections)
assertNoNotationOcrArtifacts('3', chapterThreeSections)
assertNoNotationOcrArtifacts('4', chapterFourSections)
assertNoNotationOcrArtifacts('11', chapterElevenSections)
assertNoNotationOcrArtifacts('12', chapterTwelveSections)
assertNoNotationOcrArtifacts('13', chapterThirteenSections)
assert.equal(chapterTenPositionNumbers.has('10.1'), true)
assert.equal(chapterTenPositionNumbers.has('10.2'), true)
assert.equal(chapterElevenPositionNumbers.has('11.1'), true)
assert.equal(chapterTwelvePositionNumbers.has('12.1'), true)
assert.equal(chapterThirteenPositionNumbers.has('13.4'), true)
assert.equal(chapterElevenPositionNumbers.has('12.1'), false)
assert.equal(chapterThirteenPositionNumbers.has('13.24'), true)
assertDiagramExtractionReport()
assert.equal(
  chapterTenPhilidorTokens.filter((token) => token.display === '3.Kd6').length,
  1,
)
assert.equal(
  findMove(chapterElevenAnalysisTokens, '4...Rg1!').positionNumber,
  '11.2',
)
assert.equal(findMove(chapterElevenAnalysisTokens, '3.d6').positionNumber, '11.1')

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

function getChapterMoveTokens(
  scannedPlayback: ReturnType<typeof buildChapterPlayback>,
  sectionIndex: number,
) {
  assert.notEqual(sectionIndex, -1, 'Expected chapter move section to exist.')
  const tokens = scannedPlayback.tokensBySectionIndex.get(sectionIndex)

  if (!tokens) {
    assert.fail(`Expected playback tokens for section ${sectionIndex}`)
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

function assertDiagramExtractionReport() {
  const chaptersById = new Map<string, RawChapterSection[]>([
    ['1', chapterOneSections],
    ['3', chapterThreeSections],
    ['4', chapterFourSections],
    ['10', chapterTenSections],
    ['11', chapterElevenSections],
    ['12', chapterTwelveSections],
    ['13', chapterThirteenSections],
  ])
  const positionNumbersByChapter = new Map<string, Set<string>>([
    ['1', chapterOnePositionNumbers],
    ['3', getPositionNumbers(chapterThreeSections)],
    ['4', getPositionNumbers(chapterFourSections)],
    ['10', chapterTenPositionNumbers],
    ['11', chapterElevenPositionNumbers],
    ['12', chapterTwelvePositionNumbers],
    ['13', chapterThirteenPositionNumbers],
  ])
  const captionsByChapter = new Map<string, Set<string>>([
    ['1', getCaptions(chapterOneSections)],
    ['3', getCaptions(chapterThreeSections)],
    ['4', getCaptions(chapterFourSections)],
    ['10', chapterTenCaptions],
    ['11', chapterElevenCaptions],
    ['12', chapterTwelveCaptions],
    ['13', chapterThirteenCaptions],
  ])
  const promotedRows = diagramExtractionReport.filter(
    ({ status }) => status === 'promoted' || status === 'promoted-with-warnings',
  )
  const keptRows = diagramExtractionReport.filter(
    ({ status }) => status === 'kept-caption',
  )

  assert.ok(
    promotedRows.length >= 80,
    'Expected the extraction report to document promoted chapter 10-13 diagrams.',
  )

  for (const [chapterId, sections] of chaptersById) {
    assertNoDuplicatePositionNumbers(chapterId, sections)
  }

  for (const row of promotedRows) {
    const chapterId = String(row.chapter)
    const positionNumbers = positionNumbersByChapter.get(chapterId)

    assert.ok(positionNumbers, `Unexpected extracted chapter ${chapterId}.`)
    assert.ok(row.fen, `${row.label} should include an extracted FEN.`)
    assert.equal(
      positionNumbers.has(row.number),
      true,
      `${row.label} should be promoted to a position section.`,
    )
  }

  for (const row of keptRows) {
    const chapterId = String(row.chapter)
    const captions = captionsByChapter.get(chapterId)

    assert.ok(captions, `Unexpected kept-caption chapter ${chapterId}.`)
    assert.equal(typeof row.reason, 'string')
    assert.equal(
      captions.has(row.label),
      true,
      `${row.label} should remain a caption when extraction keeps it.`,
    )
  }

  for (const [chapterId, captions] of captionsByChapter) {
    for (const caption of captions) {
      if (!/^(Analysis diagram|Position) \d+\./.test(caption)) {
        continue
      }

      assert.equal(
        keptRows.some(
          (row) => String(row.chapter) === chapterId && row.label === caption,
        ),
        true,
        `${caption} should have a kept-caption report entry.`,
      )
    }
  }
}

function assertNoDuplicatePositionNumbers(
  chapterNumber: string,
  sections: RawChapterSection[],
) {
  const positionNumbers = sections
    .filter((section) => section.type === 'position')
    .map((section) => (section.content as { number: string }).number)
  const duplicates = positionNumbers.filter(
    (number, index) => positionNumbers.indexOf(number) !== index,
  )

  assert.deepEqual(
    duplicates,
    [],
    `Chapter ${chapterNumber} should not have duplicate position numbers.`,
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
    'aReady',
    'aRhough',
    'aRernative',
    'aRerna tives',
    'resuR',
    'consuRed',
    'com mon',
    'op position',
    'be fore',
    'be tween',
    'posi tions',
    'centralfiles',
    'con trols',
    'oc cupy',
    'suc ceeds',
    'ex ample',
    'How ever',
    'de fender',
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

function assertNoNotationOcrArtifacts(
  chapterNumber: string,
  sections: RawChapterSection[],
) {
  const text = JSON.stringify(sections)
  const artifacts = [
    'J ie2',
    'RId1',
    'RIe1',
    'RIg1',
    'RIg l',
    'RIh',
    'c;tJ',
    'cJf',
    'dS +',
    'gS fS',
    'h 55.g5',
    'h 65.Kg4',
    'l:la l',
    'ria l',
    'Wxfs',
    '®',
    '<J',
    '<ii',
    '£4',
    '£7',
    'R. Je3',
    'c2-dl',
    'el-f2',
    'JJ.g3',
    'I!e2',
    'g 55',
    'g 56',
    'b8K+',
  ]
  const foundArtifacts = artifacts.filter((artifact) => text.includes(artifact))

  assert.deepEqual(
    foundArtifacts,
    [],
    `Chapter ${chapterNumber} should not contain known OCR-damaged notation.`,
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
