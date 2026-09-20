export const BASE = 1 << 24, NONE = BASE - 1;
export const square = (n: number) => 'abcdefgh'[n & 7] + ((n >> 3) + 1);
export const sqIndex = (s: string) => s.charCodeAt(0) - 97 + (Number(s[1]) - 1) * 8;
export const pack = (wk: number, b: number, n: number, bk: number) => (wk << 18) | (b << 12) | (n << 6) | bk;
export const unpack = (k: number) => [k >>> 18, (k >>> 12) & 63, (k >>> 6) & 63, k & 63];
export const distance = (a: number, b: number) => Math.max(Math.abs((a & 7) - (b & 7)), Math.abs((a >> 3) - (b >> 3)));
export const transforms = Array.from({ length: 8 }, (_, t) => Array.from({ length: 64 }, (_, s) => { const x = s & 7, y = s >> 3; return [[x, y], [7 - y, x], [7 - x, 7 - y], [y, 7 - x], [7 - x, y], [x, 7 - y], [y, x], [7 - y, 7 - x]][t]!.reduce((a, v, i) => a + v * (i ? 8 : 1), 0); }));
export function transform(k: number, t: number) { const s = unpack(k), m = transforms[t]!; return pack(m[s[0]!]!, m[s[1]!]!, m[s[2]!]!, m[s[3]!]!); }
export function canonical(k: number) { let best = k; for (let t = 1; t < 8; t++)
    best = Math.min(best, transform(k, t)); return best; }
export function pair(k: number, p = NONE) { let a = k, b = p; for (let t = 1; t < 8; t++) {
    const x = transform(k, t), y = p === NONE ? NONE : transform(p, t);
    if (x < a || (x === a && y < b)) {
        a = x;
        b = y;
    }
} return a * BASE + b; }
export function fen(k: number, turn = 'w') { const p = unpack(k), pieces = ['K', 'B', 'N', 'k'], ranks: string[] = []; for (let r = 7; r >= 0; r--) {
    let row = '', empty = 0;
    for (let f = 0; f < 8; f++) {
        const i = p.indexOf(r * 8 + f);
        if (i < 0)
            empty++;
        else {
            if (empty)
                row += empty;
            empty = 0;
            row += pieces[i];
        }
    }
    if (empty)
        row += empty;
    ranks.push(row);
} return ranks.join('/') + ' ' + turn + ' - - 0 1'; }
export function code(f: string) { const p: number[] = []; let rank = 7, file = 0; for (const c of f.split(' ')[0]!) {
    if (c === '/') {
        rank--;
        file = 0;
    }
    else if (/\d/.test(c))
        file += Number(c);
    else {
        const i = 'KBNk'.indexOf(c);
        if (i >= 0)
            p[i] = rank * 8 + file;
        file++;
    }
} if (p.length !== 4 || p.some(x => x === undefined))
    throw new Error('Missing piece'); return pack(p[0]!, p[1]!, p[2]!, p[3]!); }
export function* rootOrbits() { for (let wk = 0; wk < 64; wk++) {
    if (transforms.some(t => t[wk]! < wk))
        continue;
    for (let b = 0; b < 64; b++) {
        if (b === wk)
            continue;
        for (let n = 0; n < 64; n++) {
            if (n === wk || n === b)
                continue;
            for (let bk = 0; bk < 64; bk++) {
                if (bk === b || bk === n || distance(wk, bk) <= 1)
                    continue;
                const k = pack(wk, b, n, bk);
                let same = 1, valid = true;
                for (let t = 1; t < 8; t++) {
                    const x = transform(k, t);
                    if (x < k) {
                        valid = false;
                        break;
                    }
                    if (x === k)
                        same++;
                }
                if (valid)
                    yield { key: k, weight: 8 / same };
            }
        }
    }
} }
