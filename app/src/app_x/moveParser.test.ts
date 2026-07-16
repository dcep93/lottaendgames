import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import {
  chapterPayloadContentHash,
  chapterPayloadPath,
} from './chapterPayloadManifest'
import type { BookSource, RawChapterSection } from './chapterTypes'
import {
  buildChapterPlayback,
  isProseMoveReference,
  isProseSanReference,
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
    playback: {
      tokensBySectionIndex: Array<[number, TextPlaybackToken[]]>
    }
    sections: RawChapterSection[]
  }>
  contentHash: string
  schemaVersion: number
  sourceContentHash: string
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
const book = JSON.parse(
  readFileSync(new URL('./pdf/book.json', import.meta.url), 'utf8'),
) as BookSource
const diagramExtractionReport = JSON.parse(
  readFileSync(
    new URL('./pdf/diagram_extraction_report.json', import.meta.url),
    'utf8',
  ),
) as DiagramExtractionReportEntry[]
const introductionSections = getChapterSections('introduction')
const chapterOneSections = getChapterSections('1')
const chapterTwoSections = getChapterSections('2')
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
const chapterFourteenSections = getChapterSections('14')
const chapterFifteenSections = getChapterSections('15')
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
    section.type === 'text' &&
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
    section.type === 'text' &&
    typeof section.content === 'string' &&
    section.content.startsWith('1...e4 2.Re1!'),
)
const positionFiveElevenMoveSectionIndex = chapterSections.findIndex(
  (section) =>
    section.type === 'text' &&
    typeof section.content === 'string' &&
    section.content.startsWith('1.Rc7+!'),
)
const positionSixSixMoveSectionIndex = chapterSixSections.findIndex(
  (section) =>
    section.type === 'text' &&
    typeof section.content === 'string' &&
    section.content.startsWith('1...g3'),
)
const rookInFrontMoveSectionIndex = chapterSixSections.findIndex(
  (section) =>
    section.type === 'text' &&
    typeof section.content === 'string' &&
    section.content.includes('here, with ...Ra8'),
)
const moveTokens = getMoveTokens(moveSectionIndex)
const proseTokens = getMoveTokens(proseSectionIndex)
const cuttingOffTokens = getMoveTokens(positionFiveThreeMoveSectionIndex)
const zugzwangTokens = getMoveTokens(positionFiveTenTextSectionIndex)
const zugzwangContinuationTokens = getMoveTokens(
  positionFiveTenContinuationMoveSectionIndex,
)
const kopaevTokens = getMoveTokens(positionFiveElevenMoveSectionIndex)
const rookInFrontTokens = getChapterSixMoveTokens(rookInFrontMoveSectionIndex)
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

assert.equal(positionFiveOneIndex, 4)
assert.equal(isProseMoveReference('which was tactically prevented by ...'), true)
assert.equal(isProseMoveReference('prevented the lethal blow ...'), true)
assert.equal(chapterPayload.schemaVersion, 2)
assert.match(chapterPayload.contentHash, /^sha256:[a-f0-9]{64}$/)
assert.equal(chapterPayload.contentHash, getPayloadContentHash(chapterPayload))
assert.equal(chapterPayload.contentHash, chapterPayloadContentHash)
assert.match(chapterPayloadPath, /^app_x\/chapter-runtime\.[a-f0-9]{16}\.json$/)
assert.equal(
  chapterPayload.sourceContentHash,
  `sha256:${createHash('sha256')
    .update(canonicalStringify(book.parts))
    .digest('hex')}`,
)
assert.deepEqual(
  chapterPayload.chapters.map(({ id, label }) => ({ id, label })),
  book.parts.map(({ id, label }) => ({ id, label })),
)
for (const sectionIndex of [
  positionFiveThreeMoveSectionIndex,
  positionFiveTenTextSectionIndex,
  positionFiveTenContinuationMoveSectionIndex,
  positionFiveElevenMoveSectionIndex,
  positionSixSixMoveSectionIndex,
]) {
  assert.notEqual(sectionIndex, -1)
}
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
assert.deepEqual(scanUnclickableSan('introduction', introductionSections), [])
assert.deepEqual(scanUnclickableSan('1', chapterOneSections), [])
assert.deepEqual(scanUnclickableSan('2', chapterTwoSections), [])
assert.deepEqual(scanUnclickableSan('3', chapterThreeSections), [])
assert.deepEqual(scanUnclickableSan('4', chapterFourSections), [])
assert.deepEqual(scanUnclickableSan('10', chapterTenSections), [])
assert.deepEqual(scanUnclickableSan('11', chapterElevenSections), [])
assert.deepEqual(scanUnclickableSan('12', chapterTwelveSections), [])
assert.deepEqual(scanUnclickableSan('13', chapterThirteenSections), [])
assert.equal(panelSections.length, 5)
const summaryPanels = panelSections.filter(
  (section) =>
    (section.content as { title?: unknown }).title ===
    'Summary of interesting ideas',
)
assert.equal(summaryPanels.length, 2)
assert.equal(
  panelSections.filter(
    (section) =>
      (section.content as { title?: unknown }).title === 'Conclusion',
  ).length,
  3,
)
for (const section of summaryPanels) {
  const content = section.content as { text?: unknown; title?: unknown }
  assert.equal(content.title, 'Summary of interesting ideas')
  assert.equal(typeof content.text, 'string')
  const panelText = content.text as string
  assert.equal(panelText.includes('Summary of interesting ideas:'), false)
}
const chapterFiveConclusion = panelSections.find(
  (section) =>
    (section.content as { title?: unknown }).title === 'Conclusion',
)
assert.ok(chapterFiveConclusion)
assert.equal(
  (chapterFiveConclusion.content as { text: string }).text.includes(
    'dramatically decreased',
  ),
  true,
)
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

const chaptersSevenToNinePlayback = new Map([
  ['7', chapterSevenPlayback],
  ['8', chapterEightPlayback],
  ['9', chapterNinePlayback],
])
const exactBranchParentExpectations = [
  {
    chapterId: '7',
    display: 'Kf5',
    parentFen: '6K1/5P2/3b1k1B/8/8/8/8/8 b - - 1 1',
    positionNumber: '7.4',
    sectionIndex: 23,
  },
  {
    chapterId: '7',
    display: '7.Bc3',
    parentFen: '4K3/5Pb1/4k3/8/8/8/3B4/8 w - - 12 7',
    positionNumber: '7.4',
    sectionIndex: 23,
  },
  {
    chapterId: '7',
    display: 'Bh6',
    occurrence: 1,
    parentFen: '4K3/5Pb1/4k3/8/8/2B5/8/8 b - - 13 7',
    positionNumber: '7.4',
    sectionIndex: 23,
  },
  {
    chapterId: '8',
    display: '3...Kb1?',
    parentFen: '8/8/8/8/8/8/pnk5/B3K3 b - - 4 3',
    positionNumber: '8.5',
    sectionIndex: 21,
  },
  {
    chapterId: '8',
    display: '4.Kd2',
    parentFen: '8/8/8/8/8/8/pn6/Bk2K3 w - - 5 4',
    positionNumber: '8.5',
    sectionIndex: 21,
  },
  {
    chapterId: '8',
    display: '5...Nc5!',
    parentFen: '8/8/8/8/n7/8/p7/B1k1K3 b - - 8 5',
    positionNumber: '8.5',
    sectionIndex: 21,
  },
  {
    chapterId: '8',
    display: '1...Nd8',
    parentFen: '8/2KPkn2/8/8/8/5B2/8/8 b - - 1 1',
    positionNumber: '8.7a',
    sectionIndex: 30,
  },
  {
    chapterId: '8',
    display: '2.Bd5+',
    parentFen: '3n4/2KPk3/8/8/8/5B2/8/8 w - - 2 2',
    positionNumber: '8.7a',
    sectionIndex: 30,
  },
  {
    chapterId: '9',
    display: '1...Kf7',
    parentFen: '8/4k3/8/4PPB1/4K3/1b6/8/8 b - - 1 1',
    positionNumber: '9.4',
    sectionIndex: 20,
  },
  {
    chapterId: '9',
    display: '2.Kd4',
    parentFen: '8/5k2/8/4PPB1/4K3/1b6/8/8 w - - 2 2',
    positionNumber: '9.4',
    sectionIndex: 20,
  },
  {
    chapterId: '9',
    display: '2.Kf4',
    parentFen: '8/3k4/8/4PPB1/4K3/1b6/8/8 w - - 2 2',
    positionNumber: '9.4',
    sectionIndex: 20,
  },
  {
    chapterId: '9',
    display: '3.Kd2?',
    parentFen: '8/8/4k3/8/2bPP3/4K1B1/8/8 w - - 3 3',
    positionNumber: '9.6',
    sectionIndex: 28,
  },
  {
    chapterId: '9',
    display: 'Bb5!',
    parentFen: '8/8/4k3/8/2bPP3/6B1/3K4/8 b - - 4 3',
    positionNumber: '9.6',
    sectionIndex: 28,
  },
  {
    chapterId: '9',
    display: '3...Bb3',
    parentFen: '8/8/4k3/8/2bPPB2/4K3/8/8 b - - 4 3',
    positionNumber: '9.6',
    sectionIndex: 28,
  },
  {
    chapterId: '9',
    display: '3...Ba2',
    parentFen: '8/8/4k3/8/2bPPB2/4K3/8/8 b - - 4 3',
    positionNumber: '9.6',
    sectionIndex: 28,
  },
  {
    chapterId: '9',
    display: '4.Kd3',
    parentFen: '8/8/4k3/8/3PPB2/1b2K3/8/8 w - - 5 4',
    positionNumber: '9.6',
    sectionIndex: 28,
  },
  {
    chapterId: '9',
    display: '3.Kf4',
    parentFen: '8/8/2k5/8/2bPP3/4K1B1/8/8 w - - 3 3',
    positionNumber: '9.6',
    sectionIndex: 28,
  },
  {
    chapterId: '9',
    display: '2.c7+',
    parentFen: '3k4/1K6/2P1P3/8/5b2/1B6/8/8 w - - 2 2',
    positionNumber: '9.9',
    sectionIndex: 40,
  },
  {
    chapterId: '9',
    display: '2...Bd6',
    parentFen: '3k4/8/1KP1P3/8/5b2/1B6/8/8 b - - 3 2',
    positionNumber: '9.9',
    sectionIndex: 40,
  },
  {
    chapterId: '9',
    display: '3.Kd1',
    parentFen: '8/7B/8/8/5b2/1p2p3/1k2K3/8 w - - 2 3',
    positionNumber: '9.12',
    sectionIndex: 57,
  },
  {
    chapterId: '9',
    display: '3...Ka1!',
    parentFen: '8/7B/8/8/5b2/1p2p3/1k6/3K4 b - - 3 3',
    positionNumber: '9.12',
    sectionIndex: 57,
  },
  {
    chapterId: '9',
    display: '2...Kb4',
    parentFen: '8/8/8/5B2/5b2/1pk1p3/8/3K4 b - - 1 2',
    positionNumber: '9.12',
    sectionIndex: 57,
  },
] as const

for (const expectation of exactBranchParentExpectations) {
  const sourcePlayback = chaptersSevenToNinePlayback.get(expectation.chapterId)
  assert.ok(sourcePlayback, `Expected Chapter ${expectation.chapterId} playback`)
  const sourceMove = findMove(
    getChapterMoveTokens(sourcePlayback, expectation.sectionIndex),
    expectation.display,
    'occurrence' in expectation ? expectation.occurrence : 0,
  )
  const runtimeMove = findMove(
    getRuntimePlaybackTokens(
      expectation.chapterId,
      expectation.sectionIndex,
    ).filter(isMoveToken),
    expectation.display,
    'occurrence' in expectation ? expectation.occurrence : 0,
  )

  assert.equal(sourceMove.positionNumber, expectation.positionNumber)
  assert.equal(sourceMove.parentFen, expectation.parentFen)
  assert.equal(
    isOneMoveFenTransition(sourceMove.parentFen, sourceMove.fen),
    true,
    `${expectation.chapterId}:${expectation.sectionIndex}:${expectation.display} must be a legal one-move transition`,
  )
  assert.deepEqual(
    {
      fen: runtimeMove.fen,
      parentFen: runtimeMove.parentFen,
      path: runtimeMove.path,
      positionNumber: runtimeMove.positionNumber,
      san: runtimeMove.san,
    },
    {
      fen: sourceMove.fen,
      parentFen: sourceMove.parentFen,
      path: sourceMove.path,
      positionNumber: sourceMove.positionNumber,
      san: sourceMove.san,
    },
    `${expectation.chapterId}:${expectation.sectionIndex}:${expectation.display} runtime playback must match source playback`,
  )
}

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

const chapterElevenParentFenExpectations = [
  // PDF 162 / printed 161.
  [46, '5.Rg7+', 0, '11.6', '8/5k2/6RK/5P1P/8/8/8/5r2 w - - 5 5'],
  [46, '6.Rg8', 0, '11.6', '8/6R1/5k1K/5P1P/8/8/8/5r2 w - - 7 6'],
  [46, '2...Rb1!', 0, '11.6', '8/5k2/8/1r4RP/5PK1/8/8/8 b - - 3 2'],
  // PDF 163 / printed 162.
  [48, '6...Kg7?', 0, '11.7', '8/5k2/2R5/5K1P/5P2/8/8/6r1 b - - 7 6'],
  [48, '7.Rg6+', 0, '11.7', '8/6k1/2R5/5K1P/5P2/8/8/6r1 w - - 8 7'],
  [48, '9...Ra1', 0, '11.7', '4R3/8/7k/5K1P/5P2/8/8/1r6 b - - 13 9'],
  // PDF 164 / printed 163; the two 23.Re6 moves belong to different branches.
  [50, '23.Re6', 0, '11.8', '8/4K1k1/3R4/5P2/8/8/4r3/8 w - - 1 23'],
  [50, '23.Re6', 1, '11.8', '8/4K2k/3R4/5P2/8/8/4r3/8 w - - 1 23'],
  [50, '25...Rb8', 0, '11.8', 'r7/5K1k/4RP2/8/8/8/8/8 b - - 2 25'],
  [50, '26.Re1', 0, '11.8', 'r7/5K2/4RP1k/8/8/8/8/8 w - - 3 26'],
  // PDF 165 / printed 164.
  [52, '8.Ke4', 0, '11.9', '8/2R4P/6k1/8/5P2/5K2/8/7r w - - 3 8'],
  [52, '19.Kg8+', 0, '11.9', '5K2/4R2P/6k1/8/5P2/8/8/7r w - - 25 19'],
  // PDF 167 / printed 166.
  [60, '2.Re6+!', 0, '11.11', '8/8/1r3kP1/5P2/4RK2/8/8/8 w - - 2 2'],
  // PDF 169 / printed 168.
  [75, 'Rf4', 0, '11.14', 'R7/7k/8/2K5/P5r1/8/8/8 b - - 9 9'],
  [75, '6...Kh7', 0, '11.14', 'R7/6k1/P1r5/8/5K1P/8/8/8 b - - 2 6'],
] as const

for (const [sectionIndex, display, occurrence, positionNumber, parentFen] of chapterElevenParentFenExpectations) {
  const token = findMove(
    getChapterMoveTokens(chapterElevenPlayback, sectionIndex),
    display,
    occurrence,
  )
  assert.equal(token.positionNumber, positionNumber)
  assert.equal(token.parentFen, parentFen)
}

const chapterElevenPositionElevenNineTokens = getChapterMoveTokens(
  chapterElevenPlayback,
  52,
)
assert.equal(chapterElevenPositionElevenNineTokens.length, 120)
assert.equal(
  chapterElevenPositionElevenNineTokens.some(
    ({ display, parentFen }) =>
      display === 'Kg5' &&
      parentFen === '8/7k/5K1P/5P2/8/4R3/r7/8 w - - 11 11',
  ),
  false,
  'PDF 165 / printed 164 prose “Threatening Rc6 and Kg5” must not become a move on a stale branch.',
)

const sourceBoardAssociationRanges = [
  {
    chapterId: '13',
    endDisplay: '9.Rb8+',
    expectedPositionNumber: '13.7',
    sectionIndex: 23,
    startDisplay: '5.Ra7',
  },
  {
    chapterId: '13',
    endDisplay: '5.h6',
    expectedPositionNumber: '13.22',
    sectionIndex: 74,
    startDisplay: '4.Kg5',
  },
  {
    chapterId: '13',
    endDisplay: 'Rb5=',
    expectedPositionNumber: '13.29',
    sectionIndex: 99,
    startDisplay: '3.Qf2+',
  },
] as const
const sourceBoardAssociationMismatches = sourceBoardAssociationRanges.flatMap(
  (expectation) => {
    const moves = getRuntimeMoveRange(expectation)
    return moves
      .filter(
        ({ positionNumber }) =>
          positionNumber !== expectation.expectedPositionNumber,
      )
      .map(
        ({ display, positionNumber }) =>
          `${expectation.chapterId}:${expectation.sectionIndex}:${display} ` +
          `${positionNumber} -> ${expectation.expectedPositionNumber}`,
      )
  },
)
const sourceMovesExpectedToBePlayable = [
  ['11', 46, '11.6', ['5.Rg7+', '6.Rg8', '2...Rb1!']],
  ['11', 48, '11.7', ['6...Kg7?', '7.Rg6+', '9...Ra1']],
  ['11', 50, '11.8', ['23.Re6', '25...Rb8', '26.Re1']],
  ['11', 52, '11.9', ['8.Ke4', '10.Kd5', '19.Kg8+']],
  ['11', 60, '11.11', ['2.Re6+!']],
  ['11', 75, '11.14', ['Rf4', '6...Kh7']],
  ['12', 35, '12.8', ['6.Kb4']],
  ['12', 54, '12.14', ['4...Kc6!']],
  ['12', 62, '12.16', ['1...Kxb4', '2.Ke5', 'Kxb3', '4.Kg5', '5.Kxh5']],
  ['12', 72, '12.19', ['4...Kb5', '5...Kd6']],
  ['12', 94, '12.25', ['1...h6', '7.Kd4', 'Kd6=']],
  [
    '12',
    98,
    '12.27',
    [
      '2...Kh6',
      '3.Kf5!',
      '4.Kg5',
      '4.g3',
      '4...Kh6',
      '5.Kf6',
      '6.Kg7',
      '7.h4+',
      '3.Kh5',
      '4.h3',
      '4.h4',
      '4.g4?',
      '5.Kh4',
      '4...h6',
      '5.Kg4!',
      '5.Kh6',
    ],
  ],
  ['12', 120, '12.32', ['3.Kb4+', 'd4', '4.Kxa4']],
  ['12', 140, '12.38', ['6.Kc5', '7.Kb5', '8.Kc6']],
  ['13', 9, '13.4', ['12...Kb8', '13.Nb5', '14.Nc7+']],
  ['13', 13, '13.5', ['19...Kg7']],
  [
    '13',
    23,
    '13.7 / 13.8',
    [
      '4...Kc8',
      '6...Kb8',
      '7.Rf8+',
      '8.Ra8+',
      '8.Ka4!',
      '6...Rd3+',
      '11...Rd3',
      '12.Kc4!',
    ],
  ],
  ['13', 32, '13.10', ['14.Ke6', '16.Kd6', '17.Bd5', 'Rh6+=']],
  ['13', 39, '13.12', ['9.Kd5!?']],
  [
    '13',
    45,
    '13.15',
    [
      '35.Bf5',
      '38.Rd7+',
      '39.Rd6+',
      '40.Be6+',
      '41.Ra6',
      '42.Kd5',
      '43.Be4',
      '44.Ke5',
      '45.Re6+',
      '46.Rh6',
      '47.Rh7+',
      '48.Ra7',
      '49.Kd5',
      '49...Kf8',
      '50.Bf5',
    ],
  ],
  ['13', 51, '13.16', ['2.Kf4', '3.Rh7+', '4.Ke4']],
  ['13', 53, '13.17', ['7.Kg5', '9.Kf4+', '10.Rh8+', '16.Ke4']],
  [
    '13',
    55,
    '13.18',
    [
      '22.Rxe4',
      '23.Bd6',
      '24.Bb4',
      '26.Ba5',
      '27.Bb6?!',
      '27...Ra3+',
      '28.Kg4',
      '30.Ke5',
      '31.Re2+',
    ],
  ],
  ['13', 59, '13.19', ['Bf7=', '8...Kg7=']],
  [
    '13',
    74,
    '13.22 / 13.23',
    [
      '3.Ra8+',
      '3...Kf8!',
      '3...Kh8',
      'Kg8?!',
      '6.Kh7',
      '6...Kf7!',
      '8...Bc2',
      'Kg8=',
    ],
  ],
  ['13', 90, '13.28', ['6.Qb7+']],
  ['13', 99, '13.29', ['6.Kc6+', '7.Qe8+', '8.Qe3+', '9.Qd4', '11.Qc8']],
  [
    '14',
    10,
    '14.10',
    ['61.Qg3', '63.Qc3+', '64.Qb3+', '65.Kf2', '66.Ke2', '67.Kd3'],
  ],
  ['14', 14, '14.14', ['63...Rh8+', 'Rh7!', '63...Kf4!', '64.Ra4+']],
  [
    '14',
    17,
    '14.17',
    [
      '101.Kc7',
      '102.Ke5',
      '103.Kc7',
      '103.Kg3',
      '104.Kg3',
      '105.Kg1',
      '106.Kg2',
      '103...Rd2+',
      '105.Kg2',
    ],
  ],
  ['14', 23, '14.23', ['56.Kxg3', 'Qg5+']],
  ['14', 25, '14.25', ['77.Bxf5+?']],
  [
    '14',
    27,
    '14.27',
    [
      '83.Bd5',
      '85.Kc6',
      '86.Kb7!',
      '87.Ka6',
      '87.Kb7!',
      '88.Ka6',
      '84.Bd4',
      '86.Be5',
    ],
  ],
  [
    '14',
    34,
    '14.34',
    ['a5', '4.b7', '6.b8=Q', '6...a2', '7.Kb6!', '7...Kb2', '8.Kc5+'],
  ],
] as const
const unplayableSourceMoves = sourceMovesExpectedToBePlayable.flatMap(
  ([chapterId, sectionIndex, intendedPosition, displays]) => {
    const leftoverText = normalizeSourceMoveText(
      getRuntimePlaybackTokens(chapterId, sectionIndex)
        .filter((token) => token.type === 'text')
        .map(({ text }) => text)
        .join(''),
    )

    return displays
      .filter((display) =>
        leftoverText.includes(normalizeSourceMoveText(display)),
      )
      .map(
        (display) =>
          `${chapterId}:${sectionIndex}:${display} -> ${intendedPosition}`,
      )
  },
)
assert.deepEqual(
  {
    sourceBoardAssociationMismatches,
    unplayableSourceMoves,
  },
  {
    sourceBoardAssociationMismatches: [],
    unplayableSourceMoves: [],
  },
  'Every source move must be playable from the board governing its variation.',
)

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
  assert.notEqual(sectionIndex, -1, 'Expected chapter 6 move section to exist.')
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

function getRuntimePlaybackTokens(chapterId: string, sectionIndex: number) {
  const chapter = chapterPayload.chapters.find(({ id }) => id === chapterId)
  assert.ok(chapter, `Expected runtime chapter ${chapterId}`)
  const entry = chapter.playback.tokensBySectionIndex.find(
    ([candidateIndex]) => candidateIndex === sectionIndex,
  )
  assert.ok(
    entry,
    `Expected runtime playback for Chapter ${chapterId}, section ${sectionIndex}`,
  )
  return entry[1]
}

function getRuntimeMoveRange({
  chapterId,
  endDisplay,
  sectionIndex,
  startDisplay,
}: {
  chapterId: string
  endDisplay: string
  sectionIndex: number
  startDisplay: string
}) {
  const moves = getRuntimePlaybackTokens(chapterId, sectionIndex).filter(
    isMoveToken,
  )
  const startIndex = moves.findIndex(
    ({ display }) =>
      normalizeSourceMoveText(display) === normalizeSourceMoveText(startDisplay),
  )
  const endIndex = moves.findIndex(
    ({ display }, index) =>
      index >= startIndex &&
      normalizeSourceMoveText(display) === normalizeSourceMoveText(endDisplay),
  )

  assert.notEqual(
    startIndex,
    -1,
    `Expected ${chapterId}:${sectionIndex}:${startDisplay}`,
  )
  assert.notEqual(
    endIndex,
    -1,
    `Expected ${chapterId}:${sectionIndex}:${endDisplay}`,
  )

  return moves.slice(startIndex, endIndex + 1)
}

function normalizeSourceMoveText(value: string) {
  return value.replace(/\s+/g, '')
}

function getPositionNumbers(sections: RawChapterSection[]) {
  return new Set(
    sections
      .filter((section) => section.type === 'position')
      .map((section) => (section.content as { number: string }).number),
  )
}

function getBoardNumbers(sections: RawChapterSection[]) {
  return new Set(
    sections
      .filter(
        (section) =>
          section.type === 'diagram' ||
          section.type === 'position' ||
          section.type === 'problem',
      )
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
    ['14', chapterFourteenSections],
    ['15', chapterFifteenSections],
  ])
  const boardNumbersByChapter = new Map<string, Set<string>>([
    ['1', getBoardNumbers(chapterOneSections)],
    ['3', getBoardNumbers(chapterThreeSections)],
    ['4', getBoardNumbers(chapterFourSections)],
    ['10', getBoardNumbers(chapterTenSections)],
    ['11', getBoardNumbers(chapterElevenSections)],
    ['12', getBoardNumbers(chapterTwelveSections)],
    ['13', getBoardNumbers(chapterThirteenSections)],
    ['14', getBoardNumbers(chapterFourteenSections)],
    ['15', getBoardNumbers(chapterFifteenSections)],
  ])
  const captionsByChapter = new Map<string, Set<string>>([
    ['1', getCaptions(chapterOneSections)],
    ['3', getCaptions(chapterThreeSections)],
    ['4', getCaptions(chapterFourSections)],
    ['10', chapterTenCaptions],
    ['11', chapterElevenCaptions],
    ['12', chapterTwelveCaptions],
    ['13', chapterThirteenCaptions],
    ['14', getCaptions(chapterFourteenSections)],
    ['15', getCaptions(chapterFifteenSections)],
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
    const boardNumbers = boardNumbersByChapter.get(chapterId)

    assert.ok(boardNumbers, `Unexpected extracted chapter ${chapterId}.`)
    assert.ok(row.fen, `${row.label} should include an extracted FEN.`)
    assert.equal(
      boardNumbers.has(row.number),
      true,
      `${row.label} should be promoted to a board section.`,
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
      assert.equal(typeof content.text, 'string')
      if (content.title !== undefined) {
        assert.equal(typeof content.title, 'string')
      }
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

  return misses
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

  if (isProseSanReference(text, index, display.length)) {
    return true
  }

  return (
    /^[a-h][1-8]$/.test(display) &&
    !/\d\s*(?:\.|\.\.\.)\s*$/.test(text.slice(Math.max(0, index - 12), index))
  )
}
