import { unpack, distance, square } from './encoding.mts';
export type CyclicPlacement = {key: number; weight: number; size: number; families: number[]};
const central = new Set([27, 28, 35, 36]);
const region = (s: number) => central.has(s) ? 'central' : s % 8 === 0 || s % 8 === 7 || s < 8 || s >= 56 ? 'edge' : 'interior';

export function positionMotifs(placements: CyclicPlacement[], selectedSize: number | null) {
    const boards = placements.map(p => {
        const [k, b, n, bk] = unpack(p.key);
        const motif = `${p.size === 99 ? 'unsupported' : p.size + '-diagonal'}; ${region(k)} king; ${region(b)} bishop; bishop ${distance(k,b) === 1 ? '' : 'not '}king-protected; knight ${distance(k,n) === 1 ? '' : 'not '}king-protected`;
        return {...p, motif, K: square(k), B: square(b), N: square(n), black: square(bk)};
    });
    const directBySize: Record<number, number> = {};
    const groups = new Map<string, {motif: string; positions: number; families: Set<number>}>();
    for (const board of boards) {
        directBySize[board.size] = (directBySize[board.size] ?? 0) + board.weight;
        const group = groups.get(board.motif) ?? {motif: board.motif, positions: 0, families: new Set<number>()};
        group.positions += board.weight;
        for (const id of board.families) group.families.add(id);
        groups.set(board.motif, group);
    }
    return {directBySize, allCyclePlacements: boards.reduce((n,b) => n + b.weight, 0),
        selectedCyclePlacements: boards.filter(b => selectedSize ? b.size === selectedSize : b.size !== 99).reduce((n,b) => n+b.weight, 0),
        motifs: [...groups.values()].map(g => ({...g, families: [...g.families].sort((a,b) => a-b)})).sort((a,b) => b.positions-a.positions || a.motif.localeCompare(b.motif)), boards};
}
