import {test} from 'node:test';
import assert from 'node:assert/strict';
import {getChess} from '../../app/src/mate/chess.ts';
import {code, fen, canonical} from './encoding.mts';
import {liftCycle} from './lift-cycle.mts';

test('a quotient cycle may close after entering another orientation of a symmetric board', () => {
    const start = code('8/8/8/8/3N1k2/2B5/8/K7 w - - 0 1');
    const line = ['Kb2', 'Ke5', 'Ka1', 'Kd6'];
    const result = liftCycle(start, state => {
        const chess = getChess(fen(state));
        for (const move of line) chess.move(move);
        return {state: code(chess.fen()), moves: line};
    });
    assert.notEqual(result.state, start);
    assert.equal(canonical(result.state), canonical(start));
    assert.deepEqual(result.moves, line);
    const replay = getChess(fen(result.state));
    for (let round = 0; round < 3; round++) {
        for (const move of result.moves) replay.move(move);
        assert.equal(code(replay.fen()), result.state);
    }
});

test('a cycle that returns directly retains its entire physical traversal', () => {
    assert.deepEqual(liftCycle(0, state => ({state: (state + 1) % 4, moves: [String(state)]})),
        {state: 0, moves: ['0', '1', '2', '3']});
});
