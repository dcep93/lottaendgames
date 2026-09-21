/** Restrict starting positions only; supported continuations never stop at a smaller diagonal. */
export function includesRoot(size: number, scope: string, diagonal = 0): boolean {
    return scope === 'supported'
        ? size !== 99 && (!diagonal || size === diagonal)
        : size === 99;
}

export function auditGate(counts: { audited: number; canLoop: number; canFail: number; canMate: number }, gate: string): boolean {
    if (!counts.audited) return false;
    if (gate === 'loops') return counts.canLoop === 0;
    if (gate === 'mate') return counts.canLoop === 0 && counts.canFail === 0 && counts.canMate === counts.audited;
    throw new Error('gate must be loops or mate');
}
