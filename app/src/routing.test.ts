import assert from 'node:assert/strict'
import {
  bookEndingAnchorId,
  bookPathForChapterId,
  bookPositionAnchorId,
  matePath,
  resolveAppRoute,
} from './routing'
import { encodeMateFen } from './mate/share'

const sharedRookFen =
  '4k3/8/8/8/8/8/8/4K2R w K - 7 12'
const sharedRookTrainFen =
  '8/8/8/8/3k4/8/1R6/3K4 w - - 0 1'
const sharedKnnStandardFen =
  '4k3/p7/8/8/8/8/8/1N2K1N1 w - - 0 1'
const sharedKnnTrainFen =
  '7k/8/5NKN/8/8/8/p7/8 w - - 0 1'

assert.deepEqual(resolveAppRoute('/', ''), {
  href: '/book/about',
  route: { anchorId: null, chapterId: 'about', module: 'book' },
})
assert.deepEqual(resolveAppRoute('/book', ''), {
  href: '/book/about',
  route: { anchorId: null, chapterId: 'about', module: 'book' },
})
assert.deepEqual(resolveAppRoute('/book/about', ''), {
  href: '/book/about',
  route: { anchorId: null, chapterId: 'about', module: 'book' },
})
assert.deepEqual(resolveAppRoute('/book/about', '#e1'), {
  href: '/book/about',
  route: { anchorId: null, chapterId: 'about', module: 'book' },
})
assert.deepEqual(resolveAppRoute('/book/intro', ''), {
  href: '/book/intro',
  route: { anchorId: null, chapterId: 'introduction', module: 'book' },
})
assert.deepEqual(resolveAppRoute('/book/chapter1', '#e1'), {
  href: '/book/chapter1#e1',
  route: { anchorId: 'e1', chapterId: '1', module: 'book' },
})
assert.deepEqual(resolveAppRoute('/book/chapter15', '#pI.1'), {
  href: '/book/chapter15#pI.1',
  route: { anchorId: 'pI.1', chapterId: '15', module: 'book' },
})
assert.deepEqual(resolveAppRoute('/book/chapter2', '#p2.01'), {
  href: '/book/chapter2#p2.01',
  route: { anchorId: 'p2.01', chapterId: '2', module: 'book' },
})
assert.deepEqual(
  resolveAppRoute('/book/chapter5', '#pcutting-off-series-1'),
  {
    href: '/book/chapter5#pcutting-off-series-1',
    route: {
      anchorId: 'pcutting-off-series-1',
      chapterId: '5',
      module: 'book',
    },
  },
)
assert.deepEqual(resolveAppRoute('/book/bibliography', ''), {
  href: '/book/bibliography',
  route: { anchorId: null, chapterId: 'bibliography', module: 'book' },
})
assert.deepEqual(resolveAppRoute('/mate', '#ignored'), {
  href: '/mate',
  route: {
    module: 'mate',
    mateId: null,
    mateMode: null,
    sharedFen: null,
  },
})
assert.deepEqual(resolveAppRoute('/mate/rook/train'), {
  href: '/mate/rook/train',
  route: {
    module: 'mate',
    mateId: 'rook',
    mateMode: 'train',
    sharedFen: null,
  },
})
assert.deepEqual(resolveAppRoute('/mate/rook/close'), {
  href: '/mate',
  route: {
    module: 'mate',
    mateId: null,
    mateMode: null,
    sharedFen: null,
  },
})
assert.deepEqual(resolveAppRoute('/mate/queen', '#not-supported-yet'), {
  href: '/mate',
  route: {
    module: 'mate',
    mateId: null,
    mateMode: null,
    sharedFen: null,
  },
})
assert.deepEqual(resolveAppRoute('/mate/rook/train', '#not-supported-yet'), {
  href: '/mate',
  route: {
    module: 'mate',
    mateId: null,
    mateMode: null,
    sharedFen: null,
  },
})
assert.deepEqual(
  resolveAppRoute('/mate/rook', encodeMateFen(sharedRookFen)),
  {
    href: `/mate/rook${encodeMateFen(sharedRookFen)}`,
    route: {
      module: 'mate',
      mateId: 'rook',
      mateMode: 'standard',
      sharedFen: sharedRookFen,
    },
  },
)
assert.deepEqual(
  resolveAppRoute(
    '/mate/rook/train',
    encodeMateFen(sharedRookTrainFen),
  ),
  {
    href: `/mate/rook/train${encodeMateFen(sharedRookTrainFen)}`,
    route: {
      module: 'mate',
      mateId: 'rook',
      mateMode: 'train',
      sharedFen: sharedRookTrainFen,
    },
  },
)
assert.deepEqual(
  resolveAppRoute(
    '/mate/two-knights-pawn',
    encodeMateFen(sharedKnnStandardFen),
  ),
  {
    href: `/mate/two-knights-pawn${encodeMateFen(sharedKnnStandardFen)}`,
    route: {
      module: 'mate',
      mateId: 'two-knights-pawn',
      mateMode: 'standard',
      sharedFen: sharedKnnStandardFen,
    },
  },
)
assert.deepEqual(
  resolveAppRoute(
    '/mate/two-knights-pawn/train',
    encodeMateFen(sharedKnnTrainFen),
  ),
  {
    href: `/mate/two-knights-pawn/train${encodeMateFen(sharedKnnTrainFen)}`,
    route: {
      module: 'mate',
      mateId: 'two-knights-pawn',
      mateMode: 'train',
      sharedFen: sharedKnnTrainFen,
    },
  },
)
for (const [pathname, hash] of [
  ['/mate/rook/train', encodeMateFen(sharedRookFen)],
  ['/mate/two-knights-pawn/train', encodeMateFen(sharedKnnStandardFen)],
  ['/mate/two-knights-pawn', encodeMateFen(sharedKnnTrainFen)],
  ['/mate/rook', '#fen=%E0%A4%A'],
] as const) {
  assert.deepEqual(resolveAppRoute(pathname, hash), {
    href: '/mate',
    route: {
      module: 'mate',
      mateId: null,
      mateMode: null,
      sharedFen: null,
    },
  })
}
assert.deepEqual(resolveAppRoute('/mate/not-a-mating-set'), {
  href: '/mate',
  route: {
    module: 'mate',
    mateId: null,
    mateMode: null,
    sharedFen: null,
  },
})
assert.deepEqual(resolveAppRoute('/mate/rook/train/extra'), {
  href: '/mate',
  route: {
    module: 'mate',
    mateId: null,
    mateMode: null,
    sharedFen: null,
  },
})
assert.deepEqual(resolveAppRoute('/book/chapter16', '#e1'), {
  href: '/book/about',
  route: { anchorId: null, chapterId: 'about', module: 'book' },
})
assert.deepEqual(resolveAppRoute('/book/chapter1', '#not-an-anchor'), {
  href: '/book/chapter1',
  route: { anchorId: null, chapterId: '1', module: 'book' },
})

assert.equal(bookPathForChapterId('about'), '/book/about')
assert.equal(bookPathForChapterId('introduction'), '/book/intro')
assert.equal(bookPathForChapterId('1'), '/book/chapter1')
assert.equal(bookPathForChapterId('15'), '/book/chapter15')
assert.equal(bookPathForChapterId('bibliography'), '/book/bibliography')
assert.equal(bookPathForChapterId('16'), '/book/about')
assert.equal(bookEndingAnchorId('1'), 'e1')
assert.equal(bookPositionAnchorId('1.4'), 'p1.4')
assert.equal(matePath('bishop-knight', 'standard'), '/mate/bishop-knight')
assert.equal(matePath('bishop-knight', 'train'), '/mate/bishop-knight/train')

for (const mateId of [
  'queen',
  'rook',
  'two-bishops',
  'bishop-knight',
  'two-knights-pawn',
] as const) {
  assert.deepEqual(resolveAppRoute(matePath(mateId, 'standard')), {
    href: `/mate/${mateId}`,
    route: {
      module: 'mate',
      mateId,
      mateMode: 'standard',
      sharedFen: null,
    },
  })
  assert.deepEqual(resolveAppRoute(matePath(mateId, 'train')), {
    href: `/mate/${mateId}/train`,
    route: {
      module: 'mate',
      mateId,
      mateMode: 'train',
      sharedFen: null,
    },
  })
}

console.log('routing tests passed')
