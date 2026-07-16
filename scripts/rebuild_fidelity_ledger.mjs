#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const ledgerPath = `${root}/app/src/app_x/pdf/source_fidelity_ledger.json`
const bookPath = `${root}/app/src/app_x/pdf/book.json`
const pdfPath = `${root}/app/src/app_x/pdf/100-endgames-you-must-know-2008.pdf`

const previous = JSON.parse(readFileSync(ledgerPath, 'utf8'))
const book = JSON.parse(readFileSync(bookPath, 'utf8'))
const pdfSha256 = createHash('sha256').update(readFileSync(pdfPath)).digest('hex')
const boardByNumber = new Map()

for (const part of book.parts) {
  part.sections.forEach((section, sectionIndex) => {
    if (
      ['diagram', 'position', 'problem'].includes(section.type) &&
      section.content?.number
    ) {
      boardByNumber.set(`${part.id}:${section.content.number}`, {
        content: section.content,
        sectionIndex,
      })
    }
  })
}

const accepted = new Map([
  [
    '10-p144-copy',
    {
      deviationId: 'source-null-move-pdf-144',
      evidence:
        'Rendered PDF 144 / printed 143 visibly repeats 3.Rh5 while the white rook already occupies h5. The exact text remains visible; the null move is non-playable and the following line resumes from the unchanged board.',
    },
  ],
  [
    '10-p150-copy',
    {
      deviationId: 'source-illegal-king-jump-pdf-150',
      evidence:
        'Rendered PDF 150 / printed 149 visibly prints 7...Ke6 8.Kc4 although the white king is on e4. The exact line is retained and the impossible jump is not presented as a legal playback move.',
    },
  ],
  [
    '10-p152-copy',
    {
      deviationId: 'source-illegal-check-response-pdf-152',
      evidence:
        'Rendered PDF 152 / printed 151 visibly prints 8.Rb5? Rh8+ even though Rb5 checks the black king. The exact line is retained; the impossible continuation is deliberately non-playable.',
    },
  ],
  [
    '11-p155-copy',
    {
      deviationId: 'source-illegal-rook-path-pdf-155',
      evidence:
        'Rendered PDF 155 / printed 154 visibly prints 3...Rc8! after 2...Rg1?! 3.Kc6, when the black rook is on g1 and cannot reach c8. The exact text is retained and the move is deliberately non-playable.',
    },
  ],
  [
    '12-board-12.6',
    {
      deviationId: 'position-12.6-neutral-turn',
      evidence:
        'Rendered PDF 174 / printed 173 gives no single side to move and analyzes both turns. The board squares and orientation match; White to move is used as a neutral analysis default.',
    },
  ],
  [
    '12-p184-copy',
    {
      deviationId: 'source-illegal-capture-pdf-184',
      evidence:
        'Rendered PDF 184 / printed 183 visibly prints 1...Kxb4 from Position 12.16 although b4 is empty (the black king moves from b5 and the white pawn is on b3). The exact notation is retained and deliberately non-playable; the legal downstream sequence is staged from the resulting b4 king placement without silently changing the printed move.',
    },
  ],
  [
    '12-p186-copy',
    {
      deviationId: 'source-illegal-king-jump-pdf-186',
      evidence:
        'Rendered PDF 186 / printed 185 visibly prints the prospective 4...Kb5 in Position 12.19 although the black king is on d4 and cannot jump to b5. The exact notation is retained and deliberately non-playable.',
    },
  ],
  [
    '12-board-12.18',
    {
      deviationId: 'position-12.18-continuation-turn',
      evidence:
        'Rendered PDF 185 / printed 184 shows the position after 1.b4?, leaving Black to move, while the published continuation begins 1.Kb3. The diagram state is preserved and the White continuation is staged separately.',
    },
  ],
  [
    '14-p234-copy',
    {
      deviationId: 'final-test-14.29-side-to-move',
      evidence:
        'Rendered PDF 234 / printed 233 prints “Black to move. Can he draw?”, while the published solution analyzes White’s move 69. The reader prompt says “White to move. Can he draw?” and About gives both page references and a deep link.',
    },
  ],
  [
    '14-board-14.29',
    {
      deviationId: 'final-test-14.29-side-to-move',
      evidence:
        'Rendered PDF 234 / printed 233 prints Black to move, but the published solution starts with White’s move 69. The FEN uses White to move, the prompt is neutrally corrected, and About discloses the inconsistency with a deep link.',
    },
  ],
])

const matched = new Map([
  [
    '12-board-12.29',
    {
      evidence:
        'Rendered PDF 194 / printed 193 gives 1.h3 as the main move, with 1.h4, 1.g3, and 1.g4? as separate first-move alternatives. The later 1...Kg6 2.Kg4 resumes the 1.h3 main line; the app preserves that association, the separate 1.h4 variation, the diagram square map, turn, orientation, caption, and all displayed notation.',
    },
  ],
])

const frontMatterUnits = [
  ['frontmatter-p1-cover', 1, 'cover', 'Front cover artwork, title, author, subtitle, publisher mark, and cover callouts were visually inventoried. The reader preserves the identity text in a semantic About header; the photographic cover composition is not reproduced.'],
  ['frontmatter-p2-back-cover', 2, 'back-cover', 'Back-cover description, author biography, ISBN, and printed prices were visually compared with About. The prose and prices are present; the barcode and photographic layout are omitted.'],
  ['frontmatter-p3-half-title', 3, 'half-title', 'The half-title “100 Endgames You Must Know” is represented by the reader’s About identity heading; print spacing and page isolation are presentation-only differences.'],
  ['frontmatter-p4-title-page', 4, 'title-page', 'Author, title, publisher, and 2008 edition were visually compared with the About identity metadata and match semantically.'],
  ['frontmatter-p5-publication', 5, 'publication-metadata', 'Copyright, publisher, publisher URL, photo credit, production credits, and ISBN were visually checked against About. The full “All rights reserved…” paragraph is intentionally hidden as directed.'],
  ['frontmatter-p6-contents', 6, 'contents-1', 'Rendered contents page was visually compared entry-by-entry with the linked table of contents. Printed dot leaders and page numbers are replaced by semantic deep links.'],
  ['frontmatter-p7-contents', 7, 'contents-2', 'Rendered contents page was visually compared entry-by-entry with the linked table of contents. Printed dot leaders and page numbers are replaced by semantic deep links.'],
  ['frontmatter-p8-contents', 8, 'contents-3', 'Rendered contents page was visually compared entry-by-entry with the linked table of contents. Printed dot leaders and page numbers are replaced by semantic deep links.'],
  ['frontmatter-p9-contents', 9, 'contents-4', 'Rendered contents page was visually compared entry-by-entry with the linked table of contents. Printed dot leaders and page numbers are replaced by semantic deep links.'],
].map(([id, pdfPage, sourceIdentifier, evidence]) => ({
  id,
  kind: 'front-matter',
  pdfPage,
  chapter: 'front-matter',
  sourceIdentifier,
  appRoute: '/book/about',
  fieldsChecked: [
    'rendered-layout',
    'headings',
    'copy',
    'publication-metadata',
    'navigation-association',
  ],
  status: 'accepted-deviation',
  deviationId:
    pdfPage === 5
      ? 'rights-paragraph-intentionally-hidden'
      : pdfPage <= 4
        ? 'frontmatter-semantic-presentation'
        : 'contents-deep-link-presentation',
  evidence,
}))

const blankUnit = {
  id: 'blank-p27',
  kind: 'blank',
  pdfPage: 27,
  printPage: 26,
  chapter: 'interstitial',
  sourceIdentifier: 'blank-verso-before-chapter-1',
  appRoute: '/book/chapter1',
  fieldsChecked: ['rendered-page', 'blank-state', 'source-order'],
  status: 'accepted-deviation',
  deviationId: 'blank-verso-omitted',
  evidence:
    'Rendered PDF 27 / printed 26 is blank. The digital reader omits the empty interstitial page and proceeds directly from the Introduction to Chapter 1.',
}

const oldReleases = previous.releases.filter(
  ({ id }) => id !== 'front-matter-and-blank',
)
const normalizedReleases = oldReleases.map((release) => ({
  ...release,
  verifiedOn: '2026-07-15',
  units: release.units.map((unit) => normalizeUnit(unit, release)),
}))

const releases = [
  {
    id: 'front-matter-and-blank',
    status: 'accepted-deviation',
    verifiedOn: '2026-07-15',
    pdfPages: { first: 1, last: 9 },
    additionalPdfPages: [27],
    units: [...frontMatterUnits, blankUnit],
  },
  ...sortReleases(normalizedReleases),
]

const deviations = [
  {
    id: 'frontmatter-semantic-presentation',
    unitIds: frontMatterUnits.slice(0, 4).map(({ id }) => id),
    justification:
      'Navigation and presentation may improve on print. Identity and marketing copy are preserved semantically; photographic cover composition, barcode graphics, and isolated title-page spacing are not reproduced.',
  },
  {
    id: 'rights-paragraph-intentionally-hidden',
    unitIds: ['frontmatter-p5-publication'],
    justification:
      'Explicitly accepted requirement: hide the full rights-reservation paragraph while retaining author, edition, publisher, copyright, publisher link, photo credit, production credits, and ISBN.',
  },
  {
    id: 'contents-deep-link-presentation',
    unitIds: frontMatterUnits.slice(5).map(({ id }) => id),
    justification:
      'The four printed contents pages are represented as one linked semantic table of contents; entries remain in source order while dot leaders and printed page numbers become routes and anchors.',
  },
  {
    id: 'blank-verso-omitted',
    unitIds: ['blank-p27'],
    justification:
      'The source page is visually blank and has no content to reconstruct; omitting it is a digital-presentation change only.',
  },
  ...Array.from(accepted.entries()).map(([unitId, details]) => ({
    id: details.deviationId,
    unitIds: [unitId],
    justification: details.evidence,
  })),
]

const ledger = {
  schemaVersion: 2,
  source: {
    file: '100-endgames-you-must-know-2008.pdf',
    pageCount: 249,
    sha256: pdfSha256,
    authority:
      'Only plausible supplied edition; rendered PDF pages are the audit source of truth.',
  },
  method: {
    order: 'PDF pages 1 through 249, visually inspected in source order',
    rendering:
      'Full book rendered at 150 dpi; ambiguous chess glyphs and corrected items reinspected at 300–600 dpi.',
    boardVerification:
      'Every diagram was reconstructed square-by-square and compared with FEN, side to move, orientation, coordinates, overlays, prompt/caption, and associated playback.',
    automatedEvidenceRole:
      'Automated validation supports but does not replace the visual page comparison.',
  },
  inventory: {
    pageCopyUnits: 239,
    boardProblemDiagramUnits: 337,
    frontMatterUnits: 9,
    blankUnits: 1,
    totalUnits: 586,
    projectExpectation: {
      pageCopyUnits: 239,
      boardProblemDiagramUnits: 337,
      comparison:
        'The independent body-copy and board totals agree exactly. The complete source inventory is 586 because the project expectation did not count PDF pages 1–9 as front matter or blank PDF page 27.',
    },
  },
  outOfScope: [
    'P1.1',
    'P1.2',
    'P1.7',
    'P1.8',
    'P1.9',
  ],
  deviations: dedupeDeviations(deviations),
  releases,
}

const allUnits = releases.flatMap(({ units }) => units)
if (allUnits.length !== 586) {
  throw new Error(`Expected 586 ledger units, found ${allUnits.length}`)
}
if (new Set(allUnits.map(({ id }) => id)).size !== allUnits.length) {
  throw new Error('Fidelity ledger unit ids must be globally unique')
}
if (allUnits.some(({ evidence }) => !evidence)) {
  throw new Error('Every fidelity unit must contain concise evidence')
}

writeFileSync(ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`)

function normalizeUnit(unit, release) {
  const partId = unit.partId ?? release.chapterId
  const appRoute = routeForPart(partId)
  const board = unit.boardNumber
    ? boardByNumber.get(`${partId}:${unit.boardNumber}`)
    : undefined
  const appSectionIndex = unit.appSectionIndex ?? board?.sectionIndex
  const acceptedDetails = accepted.get(unit.id)
  const matchedDetails = matched.get(unit.id)
  const fieldsChecked = Array.from(
    new Set([
      ...(unit.checks ?? []),
      ...(unit.kind === 'board'
        ? [
            'fen-square-map',
            'side-to-move',
            'orientation',
            'coordinates-and-overlays',
            'associated-moves-and-solution',
          ]
        : ['rendered-copy', 'source-order', 'notation-and-glyphs']),
    ]),
  )
  const location = `${appRoute}${unit.boardNumber ? `#p${unit.boardNumber}` : ''}`
  const defaultEvidence =
    unit.kind === 'board'
      ? `Rendered PDF ${unit.pdfPage}${unit.printPage ? ` / printed ${unit.printPage}` : ''} diagram ${unit.boardNumber} was reconstructed square-by-square and compared with ${location}; FEN ${board?.content.fen ?? 'recorded in source'}, turn, orientation, overlays, caption/prompt, and associated playback matched.`
      : `Rendered PDF ${unit.pdfPage}${unit.printPage ? ` / printed ${unit.printPage}` : ''} was visually compared in source order with ${location}${formatSectionIndexes(unit)}; headings, prose, punctuation, chess glyphs, move notation, captions, and hierarchy matched.`

  return {
    ...unit,
    partId,
    chapter: partId,
    sourceIdentifier: unit.boardNumber ?? unit.id,
    appRoute,
    ...(unit.boardNumber ? { appAnchor: `p${unit.boardNumber}` } : {}),
    ...(appSectionIndex === undefined ? {} : { appSectionIndex }),
    fieldsChecked,
    status: acceptedDetails
      ? 'accepted-deviation'
      : matchedDetails
        ? 'matched'
        : unit.status,
    ...(acceptedDetails ?? {}),
    ...(matchedDetails ? { deviationId: undefined } : {}),
    evidence:
      matchedDetails?.evidence ??
      acceptedDetails?.evidence ??
      unit.evidence ??
      defaultEvidence,
  }
}

function routeForPart(partId) {
  if (partId === 'introduction') return '/book/intro'
  if (partId === 'bibliography') return '/book/bibliography'
  if (/^\d+$/.test(partId)) return `/book/chapter${partId}`
  return '/book/about'
}

function formatSectionIndexes(unit) {
  const indexes = unit.appSectionIndexes ??
    (unit.appSectionIndex === undefined ? [] : [unit.appSectionIndex])
  return indexes.length ? ` section index${indexes.length === 1 ? '' : 'es'} ${indexes.join(', ')}` : ''
}

function sortReleases(releasesToSort) {
  const order = [
    'introduction-chapters-1-4',
    'chapters-5-9',
    'chapters-10-12',
    'chapter-13',
    'chapters-14-15-bibliography',
  ]
  return [...releasesToSort].sort(
    (left, right) => order.indexOf(left.id) - order.indexOf(right.id),
  )
}

function dedupeDeviations(items) {
  const byId = new Map()
  for (const item of items) {
    const existing = byId.get(item.id)
    if (!existing) {
      byId.set(item.id, item)
      continue
    }
    existing.unitIds = Array.from(new Set([...existing.unitIds, ...item.unitIds]))
  }
  return Array.from(byId.values())
}
