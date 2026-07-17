import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { Chess } from 'chess.js'
import { renderToStaticMarkup } from 'react-dom/server'
import { resolveAppRoute } from '../routing'
import { buildBookReferenceIndex } from './bookReferences'
import { validateBookSource } from './bookSourceValidation'
import { ProblemStudyGroup } from './ChapterViewer'
import { hydrateRuntimeChapter } from './chapterRuntime'
import { buildRuntimeChapter } from './chapterRuntimeBuild'
import type { ProblemSection } from './chapterTypes'
import type { TextPlaybackToken } from './moveParser'

type SourceProblem = {
  fen: string
  number: string
  playbackStartFen?: string
  playbackLines: readonly string[]
  prompt: string
  solution: string
}

type ExpectedPathState = {
  fen: string
  parentFen: string
  path: string[]
  san: string
}

const sourceProblems = [
  {
    number: '2.01',
    prompt: 'White to move. Is it a draw?',
    fen: '8/8/K7/N7/8/7p/7k/8 w - - 0 1',
    solution:
      'Yes, 1.Nc4! Kg2 2.Ne3+ Kf2 3.Ng4+= The white knight enters the right circuit.',
    playbackLines: ['Nc4 Kg2 Ne3+ Kf2 Ng4+'],
  },
  {
    number: '2.02',
    prompt: 'White to move. Is it a draw?',
    fen: '8/8/K7/8/7N/7p/7k/8 w - - 0 1',
    solution: 'No. 1.Nf3+ Kg2 2.Ne1+ Kg3-+ the pawn promotes.',
    playbackLines: ['Nf3+ Kg2 Ne1+ Kg3'],
  },
  {
    number: '2.03',
    prompt: 'White to move. Is it a draw?',
    fen: '7Q/8/8/3K4/8/8/2pk4/8 w - - 0 1',
    solution:
      'No, because the king is inside the winning zone. 1.Qd4+ Ke2 2.Qc3 Kd1 3.Qd3+ Kc1 4.Kc4! Kb2 5.Qb3+ Ka1 6.Qc3+ Kb1 7.Kb3 c1Q 8.Qd3+ Ka1 9.Qa6+ Kb1 10.Qa2 mate.',
    playbackLines: [
      'Qd4+ Ke2 Qc3 Kd1 Qd3+ Kc1 Kc4 Kb2 Qb3+ Ka1 Qc3+ Kb1 Kb3 c1=Q Qd3+ Ka1 Qa6+ Kb1 Qa2#',
    ],
  },
  {
    number: '2.04',
    prompt: 'Black to move. What should you play and with which result?',
    fen: '4k3/R7/5K2/4P3/8/8/8/1r6 b - - 0 1',
    solution:
      "1...Re1! Since it is impossible to get to Philidor's position, Black tries K&H, other moves lose. See Ending 56.",
    playbackLines: ['Re1'],
  },
  {
    number: '2.05',
    prompt: 'White to move. What should you play and with which result?',
    fen: '8/2K5/8/8/3kN3/8/7p/8 w - - 0 1',
    solution:
      '1.Nf2! Setting up a barrier. 1...Kc3 (1...Ke3 2.Ng4+; 1...Ke5 2.Ng4+) 2.Kd6 Kd2 3.Ke5 Ke2 4.Nh1 Kf3 5.Kd4! Kg2 6.Ke3 Kxh1 7.Kf2=.',
    playbackLines: [
      'Nf2 Kc3 Kd6 Kd2 Ke5 Ke2 Nh1 Kf3 Kd4 Kg2 Ke3 Kxh1 Kf2',
      'Nf2 Ke3 Ng4+',
      'Nf2 Ke5 Ng4+',
    ],
  },
  {
    number: '2.06',
    prompt: 'Black to move. Is it a draw?',
    fen: '3b4/8/2K5/1P6/3B4/8/4k3/8 b - - 0 1',
    playbackStartFen: '3b4/8/2K5/1P6/3B4/8/4k3/8 b - - 0 4',
    solution:
      'Yes: the black king takes the rear opposition. 4...Kd3! 5.Bb6 Bg5 6.Bc7 Be3 7.Bd6 (7.Kb7!? Kc4 8.Ka6 Kb3! 9.Bb6 Bg5 10.Bf2 Bd8 11.Be1 Ka4!=) 7...Kc4!=.',
    playbackLines: [
      'Kd3 Bb6 Bg5 Bc7 Be3 Bd6 Kc4',
      'Kd3 Bb6 Bg5 Bc7 Be3 Kb7 Kc4 Ka6 Kb3 Bb6 Bg5 Bf2 Bd8 Be1 Ka4',
    ],
  },
  {
    number: '2.07',
    prompt: 'White to move. Is it a draw?',
    fen: '8/7K/6P1/8/6k1/2b5/8/2B5 w - - 0 1',
    solution:
      'White wins because the h6-f8 diagonal has just 3 squares. 1.Bh6 Kh5 2.Bg7 Bd2 3.Bd4 Bh6 4.Be3 Bf8 5.Bd2 Kg4 6.Bh6+-.',
    playbackLines: ['Bh6 Kh5 Bg7 Bd2 Bd4 Bh6 Be3 Bf8 Bd2 Kg4 Bh6+'],
  },
  {
    number: '2.08',
    prompt:
      'Black to move. Is 1...Bc4 a good or a bad move? Or is it irrelevant?',
    fen: '8/5k2/8/1b2PP2/4K3/8/3B4/8 b - - 0 1',
    solution:
      '1...Bc4 is a mistake, the correct move is 1...Bd7 (1...Bc4? 2.Bg5 Bb3 3.Kd4 Ba2 4.Kc5 Bb3 5.Kd6 Bc4 6.e6++-) 2.Bg5 Bc8!= 3.Kf4 Bd7=.',
    playbackLines: [
      'Bd7 Bg5 Bc8 Kf4 Bd7',
      'Bc4 Bg5 Bb3 Kd4 Ba2 Kc5 Bb3 Kd6 Bc4 e6+',
    ],
  },
  {
    number: '2.09',
    prompt: 'White to move. Is it a draw?',
    fen: '8/1PbB4/8/6k1/4K3/5P2/8/8 w - - 0 1',
    solution:
      'It is a draw: the black bishop controls both enemy pawns from the same diagonal and the blockade cannot be lifted. 1.Bc8 Bh2 2.Kd5 Kf6 3.Kc6 Ke7 4.Kb6 Bb8! 5.Bg4 Kd6 6.Bh3 Ke7 7.Kc6 Bf4=.',
    playbackLines: [
      'Bc8 Bh2 Kd5 Kf6 Kc6 Ke7 Kb6 Bb8 Bg4 Kd6 Bh3 Ke7 Kc6 Bf4',
    ],
  },
  {
    number: '2.10',
    prompt: 'Black to move. Is it a draw?',
    fen: '8/6k1/p5p1/8/8/1B3K2/3b4/8 b - - 0 1',
    solution:
      'No. Black wins: his pawns are far apart for the defender to cope. For example: 1...Kf6 2.Kg4 Ke5 3.Bc2 g5 4.Bd3 a5 5.Bc2 Kd4 6.Kf3 Kc3 7.Bd1 Kb4 8.Ke2 Bf4 9.Kd3 a4 10.Kc2 a3 11.Kb1 Kc3 12.Ka2 Bd6 13.Bg4 Kd2 14.Kb1 Ke3 15.Ka2 Kf4 16.Bd1 g4 and so on.',
    playbackLines: [
      'Kf6 Kg4 Ke5 Bc2 g5 Bd3 a5 Bc2 Kd4 Kf3 Kc3 Bd1 Kb4 Ke2 Bf4 Kd3 a4 Kc2 a3 Kb1 Kc3 Ka2 Bd6 Bg4 Kd2 Kb1 Ke3 Ka2 Kf4 Bd1 g4',
    ],
  },
  {
    number: '2.11',
    prompt: 'White to move. What should you play and with which result?',
    fen: '3R4/4K3/8/8/3pk3/8/8/8 w - - 0 1',
    solution:
      'White wins by outflanking his opponent: 1.Kd6! d3 2.Kc5 Ke3 3.Kc4 d2 4.Kc3+-.',
    playbackLines: ['Kd6 d3 Kc5 Ke3 Kc4 d2 Kc3'],
  },
  {
    number: '2.12',
    prompt: 'Black to move. Is it a draw?',
    fen: 'R7/8/8/8/8/pk1K4/8/8 b - - 0 1',
    solution:
      'Yes, 1...Kb2! (1...a2? 2.Rb8+ Ka3 3.Kc2 a1N+ 4.Kc3+-) 2.Rb8+ Kc1! 3.Ra8 Kb2 4.Kd2 a2 5.Rb8+ Ka1! (5...Ka3 6.Kc2+-) 6.Kc2=.',
    playbackLines: [
      'Kb2 Rb8+ Kc1 Ra8 Kb2 Kd2 a2 Rb8+ Ka1 Kc2',
      'a2 Rb8+ Ka3 Kc2 a1=N+ Kc3',
      'Kb2 Rb8+ Kc1 Ra8 Kb2 Kd2 a2 Rb8+ Ka3 Kc2',
    ],
  },
  {
    number: '2.13',
    prompt: 'White to move. Can he win?',
    fen: 'R7/4k3/P7/8/8/8/6K1/r7 w - - 0 1',
    solution: '1.a7! Kf7 (1...Kd6 2.Rd8++-) 2.Rh8+-.',
    playbackLines: ['a7 Kf7 Rh8', 'a7 Kd6 Rd8+'],
  },
  {
    number: '2.14',
    prompt: 'White to move. Is it worth playing on?',
    fen: '8/3K4/8/8/8/4p3/2Pk4/8 w - - 0 1',
    solution:
      'White can draw: 1.c4 e2 2.c5 e1Q 3.c6 Black has no checks and the white pawn reaches the 7th rank.',
    playbackLines: ['c4 e2 c5 e1=Q c6'],
  },
  {
    number: '2.15',
    prompt: 'White to move. Can he win?',
    fen: '8/3Pk3/8/1K3P2/8/8/8/8 w - - 0 1',
    solution: 'Yes, 1.Kc6! Kd8 2.Kd5 Kxd7 3.f6+-.',
    playbackLines: ['Kc6 Kd8 Kd5 Kxd7 f6'],
  },
  {
    number: '2.16',
    prompt: 'White to move. What should he do and with which result?',
    fen: '8/8/8/3p4/5k2/3P4/8/2K5 w - - 0 1',
    solution:
      '1.d4! (1.Kd2?? d4 2.Ke2 Kg3 3.Kd2 Kf3 4.Kc2 Ke2 5.Kc1 Kxd3 6.Kd1 Kc3 7.Kc1 d3-+) 1...Ke4 2.Kc2 Kxd4 3.Kd2!=.',
    playbackLines: [
      'd4 Ke4 Kc2 Kxd4 Kd2',
      'Kd2 d4 Ke2 Kg3 Kd2 Kf3 Kc2 Ke2 Kc1 Kxd3 Kd1 Kc3 Kc1 d3',
    ],
  },
  {
    number: '2.17',
    prompt: 'White to move. Can he draw?',
    fen: '7K/8/8/8/8/2p4N/8/2k5 w - - 0 1',
    solution:
      'Yes, by finding the right circuit for the knight. 1.Nf4! (1.Nf2?? c2 2.Nd3+ Kd2 3.Nc5 Kc3 4.Ne4+ Kb4 5.Nf2 Kc4-+) 1...c2 2.Ne2+! Kd2 (2...Kd1 3.Nc3+ Kd2 4.Na2) 3.Nd4=.',
    playbackLines: [
      'Nf4 c2 Ne2+ Kd2 Nd4',
      'Nf2 c2 Nd3+ Kd2 Nc5 Kc3 Ne4+ Kb4 Nf2 Kc4',
      'Nf4 c2 Ne2+ Kd1 Nc3+ Kd2 Na2',
    ],
  },
  {
    number: '2.18',
    prompt: 'White to move. Can he win?',
    fen: '2k5/8/8/8/6P1/8/8/4K3 w - - 0 1',
    solution:
      '1.Kf2! is the only way to reach the key squares. 1...Kd7 2.Kg3 Ke6 3.Kh4 Kf6 4.Kh5 Kg7 5.Kg5 Kf7 6.Kh6+-.',
    playbackLines: ['Kf2 Kd7 Kg3 Ke6 Kh4 Kf6 Kh5 Kg7 Kg5 Kf7 Kh6'],
  },
  {
    number: '2.19',
    prompt: 'White to move. What is the correct result?',
    fen: '8/6P1/8/8/5K2/8/6k1/7q w - - 0 1',
    solution:
      'Draw. 1.g8Q+ Kf1! (1...Kf2 2.Qa2+ Kf1 3.Qb1+ Kg2 4.Qc2+ Kh3 5.Qd3+ Kg2 6.Qe2+ Kg1 7.Kg3+-) 2.Qc4+ Kg1! 3.Qc1+ Kh2!=.',
    playbackLines: [
      'g8=Q+ Kf1 Qc4+ Kg1 Qc1+ Kh2',
      'g8=Q+ Kf2 Qa2+ Kf1 Qb1+ Kg2 Qc2+ Kh3 Qd3+ Kg2 Qe2+ Kg1 Kg3',
    ],
  },
  {
    number: '2.20',
    prompt: 'White to move. Can he win?',
    fen: '1r6/8/8/8/1P1k4/K7/8/7R w - - 0 1',
    solution:
      'Yes, by cutting the king off: 1.Rh5! See Ending 62 (1.Rc1 Kd5= see Ending 59).',
    playbackLines: ['Rh5', 'Rc1 Kd5'],
  },
  {
    number: '2.21',
    prompt: 'White to move. What is the correct result?',
    fen: '8/8/8/3kp3/8/8/8/3K4 w - - 0 1',
    solution: 'Draw. 1.Ke1!= Ke4 2.Ke2.',
    playbackLines: ['Ke1 Ke4 Ke2'],
  },
  {
    number: '2.22',
    prompt: 'White to move. Can he win?',
    fen: '8/8/1k5p/8/1P5P/1K6/8/8 w - - 0 1',
    solution: '1.h5!+- See Ending 83 (1.Kc4 h5=).',
    playbackLines: ['h5', 'Kc4 h5'],
  },
  {
    number: '2.23',
    prompt:
      'Suppose you have already spent 30 of your 50 moves to get here. It is time to be accurate. What would you do?',
    fen: '8/2k4B/4K3/4N3/8/8/8/8 w - - 0 1',
    solution:
      '1.Nd7! Also winning in less than 20 moves are the moves Bc2 and Kd5; but the text move is pure tactics. 1...Kc6 (1...Kb7 2.Bd3) 2.Bd3 closing the way out 2...Kc7 3.Bb5! Kd8 4.Nf6 Kc7 5.Nd5+ building the cage. 5...Kd8 6.Kd6 Kc8 7.Ke7 Kb7 8.Kd7 Kb8 9.Ba6 Ka7 10.Bc8 Kb8 11.Nb4 Ka7 12.Kc7 Ka8 13.Bb7+ Ka7 14.Nc6 mate. See Ending 93.',
    playbackLines: [
      'Nd7 Kc6 Bd3 Kc7 Bb5 Kd8 Nf6 Kc7 Nd5+ Kd8 Kd6 Kc8 Ke7 Kb7 Kd7 Kb8 Ba6 Ka7 Bc8 Kb8 Nb4 Ka7 Kc7 Ka8 Bb7+ Ka7 Nc6#',
      'Nd7 Kb7 Bd3',
    ],
  },
  {
    number: '2.24',
    prompt: 'White to move. Can he draw?',
    fen: '8/4KP1q/8/8/3k4/8/8/8 w - - 0 1',
    solution:
      'Yes, because the black king is out of the winning zone, but White needs to find an only and paradoxical move. 1.Kf6!= (1.Ke8? Kd5 2.f8Q Ke6-+; 1.Ke6? Qg7 2.Ke7 Ke5-+).',
    playbackLines: [
      'Kf6',
      'Ke8 Kd5 f8=Q Ke6',
      'Ke6 Qg7 Ke7 Ke5',
    ],
  },
  {
    number: '2.25',
    prompt: 'Black to move. Can he draw?',
    fen: '8/5R2/K7/8/5pk1/8/8/8 b - - 0 1',
    solution:
      "Yes, Black draws if he knows the 'shoulder-charging' idea. (Ending 24) 1...Kf3!! (1...f3? loses: 2.Kb5 Kg3 3.Kc4 f2 4.Kd3 Kg2 5.Ke2 and White arrives in time; we will see this rule in Ending 21) 2.Kb5 Ke3 3.Kc4 f3 4.Re7+ Kd2!=.",
    playbackLines: [
      'Kf3 Kb5 Ke3 Kc4 f3 Re7+ Kd2',
      'f3 Kb5 Kg3 Kc4 f2 Kd3 Kg2 Ke2',
    ],
  },
  {
    number: '2.26',
    prompt: 'Black to move. Would you trade queens on c5 to win?',
    fen: '8/8/3Q1p2/1q1P4/3k4/3p4/8/2K5 b - - 0 1',
    solution:
      'No. White can keep the opposition. 1...Qc5+?? (1...Qc4+ wins) 2.Qxc5+ Kxc5 3.Kd2 Kd6 4.Ke3! Ke5 5.Kd2! (keeping the opposition is more important than taking a pawn). 5...Kd6 6.Ke3 Kxd5 7.Kxd3= Suba-Huerga, Benidorm 2007.',
    playbackLines: [
      'Qc5+ Qxc5+ Kxc5 Kd2 Kd6 Ke3 Ke5 Kd2 Kd6 Ke3 Kxd5 Kxd3',
      'Qc4+',
    ],
  },
] as const satisfies readonly SourceProblem[]

const book = validateBookSource(
  JSON.parse(readFileSync(new URL('./pdf/book.json', import.meta.url), 'utf8')),
)
const chapter = book.parts.find(({ id }) => id === '2')
assert.ok(chapter, 'Expected Chapter 2 source')
assert.deepEqual(
  { id: chapter.id, label: chapter.label, name: chapter.name },
  { id: '2', label: 'Chapter 2', name: 'Basic Test' },
)
assert.equal(chapter.sections.length, 27)
assert.deepEqual(chapter.sections[0], { content: '2. Basic Test', type: 'title' })

const problems = chapter.sections.filter(
  (section): section is ProblemSection => section.type === 'problem',
)
assert.equal(problems.length, 26)
assert.deepEqual(
  problems.map(({ content }) => content.number),
  sourceProblems.map(({ number }) => number),
)
assert.equal(
  sourceProblems.reduce(
    (count, { playbackLines }) => count + playbackLines.length - 1,
    0,
  ),
  18,
  'The independent fixture must retain all 18 printed branches.',
)

for (const [index, expected] of sourceProblems.entries()) {
  const actual = problems[index].content
  assert.equal(actual.orientation, 'white', `${expected.number} orientation`)
  assert.equal(actual.number, expected.number)
  assert.equal(actual.prompt, expected.prompt, `${expected.number} prompt`)
  assert.equal(actual.fen, expected.fen, `${expected.number} FEN`)
  assert.doesNotThrow(() => new Chess(actual.fen), `${expected.number} legal FEN`)
  assert.equal(
    canonicalizePrintText(actual.solution),
    canonicalizePrintText(expected.solution),
    `${expected.number} source solution`,
  )
}

const problemByNumber = new Map(
  problems.map((problem) => [problem.content.number, problem]),
)
const sourceByNumber: ReadonlyMap<string, SourceProblem> = new Map(
  sourceProblems.map(
    (problem): [string, SourceProblem] => [problem.number, problem],
  ),
)

assert.match(
  canonicalSolution('2.03'),
  /7\.Kb3 c1Q/,
  '2.03 must promote the c-pawn on c1 as printed.',
)
assert.doesNotMatch(canonicalSolution('2.03'), /\be1Q\b/)
assert.equal(problemContent('2.07').fen, '8/7K/6P1/8/6k1/2b5/8/2B5 w - - 0 1')
assert.equal(problemContent('2.08').fen, '8/5k2/8/1b2PP2/4K3/8/3B4/8 b - - 0 1')
assert.match(
  canonicalSolution('2.16'),
  /4\.Kc2 Ke2 5\.Kc1 Kxd3 6\.Kd1 Kc3 7\.Kc1 d3-\+/,
  '2.16 must retain the exact legal losing branch from the source.',
)
assert.doesNotMatch(canonicalSolution('2.16'), /4\.Ke2/)
assert.equal(problemContent('2.24').fen, '8/4KP1q/8/8/3k4/8/8/8 w - - 0 1')

const runtime = hydrateRuntimeChapter(
  buildRuntimeChapter(chapter, buildBookReferenceIndex(book.parts)),
)
assert.equal(runtime.playback.playablePositions.size, 26)

for (const [sectionIndex, problem] of problems.entries()) {
  const source = sourceByNumber.get(problem.content.number)
  assert.ok(source)
  const actualMoves = moveTokens(runtime.playback.tokensBySectionIndex.get(sectionIndex + 1))
  assert.ok(actualMoves.length > 0, `${source.number} must expose playback moves`)

  for (const token of actualMoves) {
    const chess = new Chess(token.parentFen)
    assert.ok(
      chess.move(token.san, { strict: false }),
      `${source.number} emitted illegal token ${token.display}`,
    )
    assert.equal(chess.fen(), token.fen, `${source.number} ${token.display} result`)
  }

  const expectedPaths = buildExpectedPathStates(source)
  const actualMovesByPath = new Map<string, typeof actualMoves>()
  for (const token of actualMoves) {
    const key = pathKey(token.path)
    actualMovesByPath.set(key, [...(actualMovesByPath.get(key) ?? []), token])
  }

  for (const [key, expected] of expectedPaths) {
    const candidates = actualMovesByPath.get(key) ?? []
    assert.ok(
      candidates.some(
        (candidate) =>
          candidate.parentFen === expected.parentFen &&
          candidate.fen === expected.fen,
      ),
      `${source.number} is missing exact source path ${expected.path.join(' ')}: ${JSON.stringify(
        { candidates, expected },
      )}`,
    )
  }
}

const alternatives = new Chess(problemContent('2.23').fen)
assert.ok(alternatives.move('Bc2', { strict: false }), '2.23 Bc2 must be legal')
alternatives.load(problemContent('2.23').fen)
assert.ok(alternatives.move('Kd5', { strict: false }), '2.23 Kd5 must be legal')
assert.match(canonicalSolution('2.23'), /moves Bc2 and Kd5/)

const hiddenMarkup = renderProblems(false)
const revealedMarkup = renderProblems(true)
const anchorIds = sourceProblems.flatMap(({ number }) => [
  `p${number}`,
  `p${number}-solution`,
])
assert.equal(new Set(anchorIds).size, 52)

for (const markup of [hiddenMarkup, revealedMarkup]) {
  for (const anchorId of anchorIds) {
    assert.equal(
      countMatches(markup, new RegExp(`id="${escapeRegExp(anchorId)}"`, 'g')),
      1,
      `Expected exactly one rendered #${anchorId} anchor`,
    )
    const resolution = resolveAppRoute('/book/chapter2', `#${anchorId}`)
    assert.deepEqual(resolution.route, {
      anchorId,
      chapterId: '2',
      module: 'book',
    })
    assert.equal(resolution.href, `/book/chapter2#${anchorId}`)
  }
}

assert.equal(countMatches(hiddenMarkup, />Show solution<\/button>/g), 26)
assert.equal(countMatches(hiddenMarkup, />Hide solution<\/button>/g), 0)
assert.equal(countMatches(hiddenMarkup, /id="problem-2\.\d{2}-solution"/g), 0)
assert.equal(countMatches(revealedMarkup, />Show solution<\/button>/g), 0)
assert.equal(countMatches(revealedMarkup, />Hide solution<\/button>/g), 26)
assert.equal(
  countMatches(revealedMarkup, /id="problem-2\.\d{2}-solution"/g),
  26,
)

console.log('Chapter 2 source fidelity tests passed')

function canonicalizePrintText(value: string) {
  return value
    .replace(/([a-h](?:x[a-h])?[18])=([QRBN])/g, '$1$2')
    .replace(/(\d+)\.\.\.\s+/g, '$1...')
    .replace(/(\d+)\.\s+/g, '$1.')
    .replace(/\s+/g, ' ')
    .trim()
}

function problemContent(number: string) {
  const problem = problemByNumber.get(number)
  assert.ok(problem, `Expected source problem ${number}`)
  return problem.content
}

function canonicalSolution(number: string) {
  return canonicalizePrintText(problemContent(number).solution)
}

function moveTokens(tokens: TextPlaybackToken[] | undefined) {
  return (tokens ?? []).filter(
    (token): token is Extract<TextPlaybackToken, { type: 'move' }> =>
      token.type === 'move',
  )
}

function buildExpectedPathStates(problem: SourceProblem) {
  const paths = new Map<string, ExpectedPathState>()

  for (const sourceLine of problem.playbackLines) {
    const chess = new Chess(problem.playbackStartFen ?? problem.fen)
    const path: string[] = []

    for (const sourceMove of sourceLine.split(/\s+/)) {
      const parentFen = chess.fen()
      const applied = chess.move(sourceMove, { strict: false })
      assert.ok(applied, `${problem.number} source move must be legal: ${sourceMove}`)
      path.push(applied.san)
      const expected = {
        fen: chess.fen(),
        parentFen,
        path: [...path],
        san: applied.san,
      }
      const key = pathKey(path)
      const existing = paths.get(key)

      if (existing) {
        assert.deepEqual(existing, expected, `${problem.number} duplicate source path`)
      } else {
        paths.set(key, expected)
      }
    }
  }

  return paths
}

function pathKey(path: string[]) {
  return JSON.stringify(path)
}

function renderProblems(revealed: boolean) {
  return renderToStaticMarkup(
    <>
      {problems.map((section, zeroBasedIndex) => {
        const index = zeroBasedIndex + 1

        return (
          <ProblemStudyGroup
            activeBoards={{}}
            activePositionNumber={null}
            index={index}
            key={section.content.number}
            navigationByPosition={runtime.navigationByPosition}
            onBookNavigate={() => undefined}
            onMoveClick={() => undefined}
            onPositionReset={() => undefined}
            onPositionStep={() => undefined}
            onToggleSolution={() => undefined}
            playback={runtime.playback}
            referenceSpans={runtime.referencesBySectionIndex.get(index)}
            revealed={revealed}
            section={section}
          />
        )
      })}
    </>,
  )
}

function countMatches(value: string, pattern: RegExp) {
  return value.match(pattern)?.length ?? 0
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
