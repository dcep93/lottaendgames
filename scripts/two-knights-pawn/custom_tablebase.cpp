#include "custom_geometry.hpp"
#include <chrono>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <sstream>
#include <string>
using namespace custom_knnp;
using namespace std;

static string square(int q) {
  return string(1, char('a' + q % 8)) + char('1' + q / 8);
}
static string fen(uint32_t id) {
  auto s = decode(id);
  string out;
  for (int r = 7; r >= 0; --r) {
    int empty = 0;
    for (int f = 0; f < 8; ++f) {
      int q = r * 8 + f;
      char c = q == s.w               ? 'K'
               : q == s.k             ? 'k'
               : q == s.a || q == s.b ? 'N'
               : q == piece(s)        ? (s.layer ? 'p' : 'q')
                                      : 0;
      if (c) {
        if (empty)
          out += char('0' + empty);
        empty = 0;
        out += c;
      } else
        ++empty;
    }
    if (empty)
      out += char('0' + empty);
    if (r)
      out += '/';
  }
  return out + (id & 1 ? " b" : " w") + " - - 0 1";
}
static string uci(uint32_t from, uint32_t to) {
  int c = moveCode(from, to);
  return square(c / 64) + square(c % 64) +
         (decode(from).layer == 1 && decode(to).layer == 0 ? "q" : "");
}
static void put32(ostream &out, uint32_t v) {
  for (int i = 0; i < 4; ++i)
    out.put(char(v >> (8 * i)));
}
static void put16(ostream &out, uint16_t v) {
  out.put(char(v));
  out.put(char(v >> 8));
}
static bool seen(const vector<uint8_t> &bits, uint32_t id) {
  return bits[id >> 3] & (1 << (id & 7));
}
static void mark(vector<uint8_t> &bits, uint32_t id) {
  bits[id >> 3] |= 1 << (id & 7);
}
static void require(bool ok, const string &message, uint32_t id) {
  if (!ok) {
    cerr << message << " id=" << id << " " << fen(id) << endl;
    exit(1);
  }
}
int main(int argc, char **argv) {
  if (argc != 2) {
    cerr << "usage: custom_tablebase OUTPUT_DIRECTORY\n";
    return 1;
  }
  initialize();
  filesystem::create_directories(argv[1]);
  string dir = argv[1];
  const uint32_t root = key({3, 27, 28, 23, 56}, 0);
  vector<uint16_t> dtm(SLOTS, INF);
  vector<uint8_t> pending(BOARDS, 0);
  vector<uint32_t> queue;
  queue.reserve(SLOTS / 2);
  uint64_t validCount[2] = {}, edgeCount = 0;
  uint32_t mates = 0;
  cerr << "Initializing " << SLOTS << " indexed slots" << endl;
  for (uint32_t id = 0; id < SLOTS; ++id) {
    auto s = decode(id);
    if (!valid(s, id & 1))
      continue;
    ++validCount[id & 1];
    if (id & 1) {
      int count = 0;
      black(s, [&](uint32_t) { ++count; });
      pending[id / 2] = count;
      if (count == 0 && inCheck(id)) {
        dtm[id] = 0;
        queue.push_back(id);
        ++mates;
      }
    }
  }
  cerr << "Retrograde: " << mates << " checkmates, legal nodes "
       << validCount[0] << " + " << validCount[1] << endl;
  uint16_t maxDtm = 0;
  size_t head = 0;
  while (head < queue.size()) {
    uint32_t id = queue[head++];
    auto d = dtm[id];
    maxDtm = max(maxDtm, d);
    predecessors(id, [&](uint32_t parent) {
      if (dtm[parent] != INF)
        return;
      if ((parent & 1) == 0 || --pending[parent / 2] == 0) {
        require(d + 1 < NO_MATE, "distance overflow", parent);
        dtm[parent] = d + 1;
        queue.push_back(parent);
      }
    });
    if (head % 5000000 == 0)
      cerr << "Solved " << head << ", queued " << queue.size() << ", depth "
           << d << endl;
  }
  const uint64_t solved = queue.size();
  cerr << "Solved " << solved << ", maximum DTM " << maxDtm
       << ". Auditing all valid edges and Bellman equations." << endl;
  // Independent full forward Bellman audit, also checking forward -> reverse
  // membership on a deterministic spread; reverse edge totals must agree.
  uint64_t reverseCount = 0;
  uint64_t sampledReverseChecks = 0;
  for (uint32_t id = 0; id < SLOTS; ++id) {
    auto s = decode(id);
    if (!valid(s, id & 1))
      continue;
    int count = 0;
    uint16_t lo = INF, hi = 0;
    successors(id, [&](uint32_t child) {
      ++count;
      ++edgeCount;
      require(valid(decode(child), child & 1), "invalid successor", id);
      lo = min(lo, dtm[child]);
      hi = max(hi, dtm[child]);
      if (id % 8191 == 0) {
        bool found = false;
        predecessors(child, [&](uint32_t p) {
          if (p == id)
            found = true;
        });
        require(found, "missing reverse edge", id);
        ++sampledReverseChecks;
      }
    });
    uint16_t expected = INF;
    if (count == 0) {
      if ((id & 1) && inCheck(id))
        expected = 0;
    } else if ((id & 1) == 0) {
      if (lo != INF)
        expected = lo + 1;
    } else if (hi != INF)
      expected = hi + 1;
    require(expected == dtm[id], "Bellman mismatch", id);
    predecessors(id, [&](uint32_t p) {
      ++reverseCount;
      require(valid(decode(p), p & 1), "invalid predecessor", id);
      if (id % 8191 == 0) {
        bool found = false;
        successors(p, [&](uint32_t c) {
          if (c == id)
            found = true;
        });
        require(found, "spurious reverse edge", id);
      }
    });
    if (id % 16000000 == 0)
      cerr << "Audited slot " << id << endl;
  }
  require(edgeCount == reverseCount, "forward/reverse edge totals differ",
          root);
  pending.clear();
  pending.shrink_to_fit();
  queue.clear();
  queue.push_back(root);
  vector<uint8_t> reachable((SLOTS + 7) / 8, 0);
  mark(reachable, root);
  head = 0;
  cerr << "Forward reachability through every permitted move" << endl;
  while (head < queue.size()) {
    uint32_t id = queue[head++];
    successors(id, [&](uint32_t child) {
      if (!seen(reachable, child)) {
        mark(reachable, child);
        queue.push_back(child);
      }
    });
    if (head % 10000000 == 0)
      cerr << "Reached " << head << ", queued " << queue.size() << endl;
  }
  uint64_t win[4][2] = {}, nonwin[4][2] = {}, terminal[4][2] = {};
  uint32_t records = queue.size();
  ofstream out(dir + "/tablebase.bin", ios::binary);
  out.write("KNNHDTM1", 8);
  put32(out, SLOTS);
  put32(out, records);
  put32(out, reachable.size());
  put32(out, 1);
  put32(out, 0);
  put32(out, 0);
  out.write((const char *)reachable.data(), reachable.size());
  // Fixture examples are selected across all layers, both sides and values;
  // additional evenly-spaced positions prevent policy-only validation.
  ofstream fixtures(dir + "/fixtures.json");
  fixtures << "[\n";
  bool firstFixture = true;
  int groups[4][2][3] = {};
  uint32_t fixtureCount = 0;
  for (uint32_t id = 0; id < SLOTS; ++id) {
    if (!seen(reachable, id))
      continue;
    auto s = decode(id);
    auto value = dtm[id];
    put16(out, value == INF ? NO_MATE : value);
    (value == INF ? nonwin : win)[s.layer][id & 1]++;
    vector<uint32_t> children;
    successors(id, [&](uint32_t child) {
      require(seen(reachable, child), "reachable graph not closed", id);
      children.push_back(child);
    });
    if (children.empty())
      terminal[s.layer][id & 1]++;
    int category = children.empty() ? 0 : value == INF ? 1 : 2;
    bool special = groups[s.layer][id & 1][category]++ < 3;
    if (special || id % 131071 == 0 || id == root) {
      if (!firstFixture)
        fixtures << ",\n";
      firstFixture = false;
      ++fixtureCount;
      fixtures << "{\"fen\":\"" << fen(id) << "\",\"id\":" << id
               << ",\"dtm\":" << (value == INF ? -1 : int(value))
               << ",\"moves\":[";
      bool first = true;
      for (auto child : children) {
        if (!first)
          fixtures << ',';
        first = false;
        fixtures << "{\"uci\":\"" << uci(id, child) << "\",\"id\":" << child
                 << ",\"dtm\":" << (dtm[child] == INF ? -1 : int(dtm[child]))
                 << "}";
      }
      fixtures << "]}";
    }
  }
  fixtures << "\n]\n";
  out.close();
  ofstream stats(dir + "/summary.json");
  stats << "{\n\"slots\":" << SLOTS << ",\"records\":" << records
        << ",\"validWhite\":" << validCount[0]
        << ",\"validBlack\":" << validCount[1] << ",\"solved\":" << solved
        << ",\"maxDtm\":" << maxDtm
        << ",\"rootDtm\":" << (dtm[root] == INF ? -1 : int(dtm[root]))
        << ",\"edgesAudited\":" << edgeCount
        << ",\"reverseEdgesAudited\":" << reverseCount
        << ",\"reverseMembershipSamples\":" << sampledReverseChecks
        << ",\"fixtures\":" << fixtureCount << ",\"layers\":[";
  for (int l = 0; l < 4; ++l) {
    if (l)
      stats << ',';
    stats << "{\"layer\":" << l << ",\"winning\":[" << win[l][0] << ','
          << win[l][1] << "],\"noForcedMate\":[" << nonwin[l][0] << ','
          << nonwin[l][1] << "],\"terminal\":[" << terminal[l][0] << ','
          << terminal[l][1] << "]}";
  }
  stats << "]}\n";
  ofstream line(dir + "/root-line.json");
  line << "{\"fen\":\"" << fen(root)
       << "\",\"dtm\":" << (dtm[root] == INF ? -1 : int(dtm[root]))
       << ",\"uci\":[";
  if (dtm[root] != INF) {
    uint32_t id = root;
    bool first = true;
    while (dtm[id] > 0) {
      uint32_t best = SLOTS;
      successors(id, [&](uint32_t c) {
        if (dtm[c] + 1 == dtm[id] &&
            (best == SLOTS || uci(id, c) < uci(id, best)))
          best = c;
      });
      require(best != SLOTS, "missing optimal move", id);
      if (!first)
        line << ',';
      first = false;
      line << '"' << uci(id, best) << '"';
      id = best;
    }
  }
  line << "]}\n";
  cerr << "DONE reachable=" << records << " root DTM=" << dtm[root]
       << " output=" << dir << endl;
}
