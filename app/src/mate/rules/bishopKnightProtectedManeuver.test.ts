import assert from 'node:assert/strict';
import test from 'node:test';
import {protectedCentralManeuverTargets as targets} from './bishopKnightProtectedManeuver';

test('protected routing rejects off-board, occupied, or unprotected landing squares', () => {
  assert.deepEqual(targets('8/8/8/8/2k1N3/4K3/8/7B w - - 0 1'), ['d2']);
  // A bishop on f3 cuts the d2-f3-d4 branch, leaving the longer f2-d3-f4-e2-d4 route.
  assert.deepEqual(targets('8/8/8/8/2k1N3/4KB2/8/8 w - - 0 1'), ['f2']);
  assert.deepEqual(targets('8/8/8/8/2k5/4K3/8/1N5B w - - 0 1'), []);
});

test('protected routing stops on a central target and declines unreachable targets', () => {
  assert.deepEqual(targets('8/8/8/8/3N4/4K3/8/3k3B w - - 6 4'), []);
  // With Ka1 the protection ring contains no central target.
  assert.deepEqual(targets('7B/8/8/8/4k3/8/1N6/K7 w - - 0 1'), []);
});
