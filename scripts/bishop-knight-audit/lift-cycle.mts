import assert from 'node:assert/strict';

// A symmetric board can have several valid canonical orientations. Replaying a
// quotient cycle may therefore enter a physical cycle after a transient round.
export function liftCycle(start: number, advance: (state: number) => {state: number; moves: string[]}) {
    const seen = new Map<number, number>();
    const moves: string[] = [];
    let state = start;
    while (!seen.has(state)) {
        assert.ok(seen.size < 8, 'A D4 orbit has at most eight orientations');
        seen.set(state, moves.length);
        const next = advance(state);
        moves.push(...next.moves);
        state = next.state;
    }
    return {state, moves: moves.slice(seen.get(state)!)};
}
