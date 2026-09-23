import { BASE, NONE, transform, unpack, pack } from './encoding.mts';

/** Last post-White board, before Black's reply, in the current node's orientation. */
export function precedingPostWhite(nodeKey: number): number | null {
    const current = Math.floor(nodeKey / BASE), previous = nodeKey % BASE;
    return previous === NONE ? null : (current & ~63) | (previous & 63);
}

/** A transition must use ONE symmetry for all its boards, not canonicalize them separately. */
export function transitionOrbit(boards: readonly number[]) {
    const variants = Array.from({length: 8}, (_, t) => boards.map(k => transform(k, t)));
    variants.sort((a, b) => { for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i]! - b[i]!; return 0; });
    const keys = new Set(variants.map(v => v.join(',')));
    return {boards: variants[0]!, key: variants[0]!.join(','), weight: keys.size};
}

export function applyEncodedWhiteMove(board: number, move: number) {
    const pieces = unpack(board), index = pieces.indexOf(move >>> 6);
    if (index < 0 || index > 2) throw new Error('White move does not start on a white piece');
    pieces[index] = move & 63;
    return pack(pieces[0]!, pieces[1]!, pieces[2]!, pieces[3]!);
}
