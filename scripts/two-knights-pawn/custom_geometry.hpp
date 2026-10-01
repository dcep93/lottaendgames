#pragma once
#include <algorithm>
#include <array>
#include <cassert>
#include <cstdint>
#include <cstdlib>
#include <vector>

// Custom game: KNN against an h-pawn (h4..h2), then a stationary Qh1.
// Captures are prohibited, but every piece retains its normal attacks.
namespace custom_knnp {
constexpr uint32_t PAIRS = 2016, SLICE = 64 * PAIRS * 64;
constexpr uint32_t BOARDS = 4 * SLICE, SLOTS = 2 * BOARDS;
constexpr uint16_t INF = 65535, NO_MATE = 65534;
struct Position {
  int layer, w, a, b, k;
};
inline std::array<std::vector<int>, 64> kingMoves, knightMoves;
inline std::array<uint64_t, 64> kingAttacks{}, knightAttacks{};
inline int pairId[64][64];
inline std::array<std::array<int, 2>, PAIRS> pairSquares;
inline int distance(int a, int b) {
  return std::max(std::abs(a % 8 - b % 8), std::abs(a / 8 - b / 8));
}
inline void initialize() {
  int id = 0;
  for (int a = 0; a < 64; ++a)
    for (int b = a + 1; b < 64; ++b) {
      pairId[a][b] = pairId[b][a] = id;
      pairSquares[id++] = {a, b};
    }
  for (int a = 0; a < 64; ++a)
    for (int b = 0; b < 64; ++b) {
      int dx = std::abs(a % 8 - b % 8), dy = std::abs(a / 8 - b / 8);
      if (std::max(dx, dy) == 1) {
        kingMoves[a].push_back(b);
        kingAttacks[a] |= 1ull << b;
      }
      if (dx * dy == 2) {
        knightMoves[a].push_back(b);
        knightAttacks[a] |= 1ull << b;
      }
    }
}
inline int piece(Position s) { return 7 + 8 * s.layer; }
inline uint32_t board(Position s) {
  return ((s.layer * 64 + s.w) * PAIRS + pairId[s.a][s.b]) * 64 + s.k;
}
inline uint32_t key(Position s, int side) { return 2 * board(s) + side; }
inline Position decode(uint32_t id) {
  id /= 2;
  int k = id % 64;
  id /= 64;
  auto ab = pairSquares[id % PAIRS];
  id /= PAIRS;
  return {int(id / 64), int(id % 64), ab[0], ab[1], k};
}
inline bool base(Position s) {
  int p = piece(s);
  return s.w != s.a && s.w != s.b && s.a != s.b && p != s.w && p != s.a &&
         p != s.b && s.k != p && s.k != s.a && s.k != s.b &&
         distance(s.w, s.k) > 1;
}
inline bool whiteAttacks(Position s, int sq) {
  return ((kingAttacks[s.w] | knightAttacks[s.a] | knightAttacks[s.b]) >> sq) &
         1;
}
inline bool queenAttacks(Position s, int sq) {
  int dx = sq % 8 - 7, dy = sq / 8;
  if (dx != 0 && dy != 0 && -dx != dy)
    return false;
  int step = (dx == 0 ? 0 : -1) + (dy == 0 ? 0 : 8);
  for (int q = 7 + step; q != sq; q += step)
    if (q == s.a || q == s.b || q == s.k)
      return false;
  return true;
}
inline bool blackAttacksWhite(Position s) {
  return s.layer == 0 ? queenAttacks(s, s.w) : s.w == piece(s) - 9;
}
// The side that just moved cannot have left its own king in check.
inline bool valid(Position s, int side) {
  return base(s) && (side == 0 ? !whiteAttacks(s, s.k) : !blackAttacksWhite(s));
}
inline bool occupied(Position s, int q) {
  return q == s.w || q == s.a || q == s.b || q == s.k || q == piece(s);
}
template <class F> void white(Position s, F emit) {
  for (int to : kingMoves[s.w]) {
    if (occupied(s, to) || distance(to, s.k) <= 1)
      continue;
    auto t = s;
    t.w = to;
    if (!blackAttacksWhite(t))
      emit(key(t, 1));
  }
  for (int which = 0; which < 2; ++which) {
    int from = which == 0 ? s.a : s.b;
    for (int to : knightMoves[from]) {
      if (occupied(s, to))
        continue;
      auto t = s;
      if (which == 0)
        t.a = to;
      else
        t.b = to;
      if (!blackAttacksWhite(t))
        emit(key(t, 1));
    }
  }
}
template <class F> void black(Position s, F emit) {
  for (int to : kingMoves[s.k]) {
    if (occupied(s, to) || whiteAttacks(s, to))
      continue;
    auto t = s;
    t.k = to;
    emit(key(t, 0));
  }
  if (s.layer > 0 && !whiteAttacks(s, s.k) && !occupied(s, piece(s) - 8)) {
    auto t = s;
    --t.layer;
    emit(key(t, 0));
  }
}
template <class F> void successors(uint32_t id, F emit) {
  auto s = decode(id);
  if (id & 1)
    black(s, emit);
  else
    white(s, emit);
}
// Reverse quiet edges. Both endpoints' validity implies the corresponding
// forward king-safety test, including newly blocked/unblocked queen rays.
template <class F> void predecessors(uint32_t id, F emit) {
  auto s = decode(id);
  if (id & 1) {
    for (int from : kingMoves[s.w]) {
      auto t = s;
      t.w = from;
      if (valid(t, 0))
        emit(key(t, 0));
    }
    for (int from : knightMoves[s.a]) {
      auto t = s;
      t.a = from;
      if (valid(t, 0))
        emit(key(t, 0));
    }
    for (int from : knightMoves[s.b]) {
      auto t = s;
      t.b = from;
      if (valid(t, 0))
        emit(key(t, 0));
    }
  } else {
    for (int from : kingMoves[s.k]) {
      auto t = s;
      t.k = from;
      if (valid(t, 1))
        emit(key(t, 1));
    }
    if (s.layer < 3) {
      auto t = s;
      ++t.layer;
      if (valid(t, 1))
        emit(key(t, 1));
    }
  }
}
inline bool inCheck(uint32_t id) {
  auto s = decode(id);
  return id & 1 ? whiteAttacks(s, s.k) : blackAttacksWhite(s);
}
inline int moveCode(uint32_t from, uint32_t to) {
  auto s = decode(from), t = decode(to);
  if (s.layer != t.layer)
    return piece(s) * 64 + piece(t);
  if (s.k != t.k)
    return s.k * 64 + t.k;
  if (s.w != t.w)
    return s.w * 64 + t.w;
  int old = s.a != t.a && s.a != t.b ? s.a : s.b;
  int next = t.a != s.a && t.a != s.b ? t.a : t.b;
  return old * 64 + next;
}
} // namespace custom_knnp
