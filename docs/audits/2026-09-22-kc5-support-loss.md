# Supported-position support-loss census after Kc5

On 2026-09-22, declared **Kc5** for White Kc6, Ba4, Nd5 against Black Ka6, including all eight board symmetries. This is an r2.5 preference subordinate to r1.5; no support classification changed.

The loaded best-policy line now stays supported after every White move and reaches mate:

`1. Kc5 Ka5 2. Bd7 Ka6 3. Kb4 Kb7 4. Kb5 Kb8 5. Kb6 Ka8 6. Bc8 Kb8 7. Ba6 Ka8 8. Nf6 Kb8 9. Nd7+ Ka8 10. Bb7#`

## Full count

The exhaustive placement census classified 13,660,584 post-White boards and selected all 150,268 supported starts. All tied best White moves and Black replies are followed, with Black return history retained. Reaching another supported diagonal or losing support does not terminate exploration. Mate, capture and stalemate are terminal; repetition and fifty-move claims are excluded. Black follows the app's policy, not arbitrary legal defenses.

“Can lose support” means **at least one** best-policy continuation becomes unsupported immediately after a White move before mate. It does not mean every branch loses support. “Next White move” means after the initial Black reply. Positions are physical placements, including symmetry copies, with counters ignored. The denominator is supported starts, not all chess positions, and is not a retrograde-reachability claim.

| Starting diagonal | Supported starts | Lose support on next White move | Can eventually lose support | Eventually (%) |
|---|---:|---:|---:|---:|
| 7 | 134,144 | 5,704 | 20,816 | 15.52% |
| 5 | 13,576 | 304 | 304 | 2.24% |
| 3 | 2,548 | 8 | 8 | 0.31% |
| **All** | **150,268** | **6,016** | **21,128** | **14.06%** |

129,140 starts (85.94%) have no best-policy continuation that loses support before termination. This includes terminal failures; it is not a forced-mate count.

The independent cycle audit still finds **zero reachable loops**. 145,988 starts can reach mate and 4,296 can reach capture/stalemate; those outcomes can overlap.

## Verification and artifacts

- 198 bishop-and-knight policy/phase tests passed; production build passed.
- Exhaustive graph: 24,404 history states, 25,012 transitions, zero cyclic components.
- Policy snapshot fingerprint: `8401b7af44361d91b137c2b129bbec43a081877a356af61b51be87fa0aa4699c`.
- The audit was run against the Kc5 working changes on parent `ada3eb1`; the manifest records that parent, while its bundle fingerprint captures the actual audited policy.
- Full audit directory: `/Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-22-kc5-support-loss`.
- Machine-readable count: `support-loss.json` in that directory.
- Counting script: `/Users/danielcepeda/repos/_codex_output/bn-count-support-loss.mts` (run against the same policy checkout as the graph).

The counting script re-evaluates every distinct White-turn board in the completed graph, including terminal White branches omitted from stored edges. Each resulting board's support comes from the full census. Mate is excluded as a support-loss event; an unsupported board before capture or stalemate is included. It propagates loss backwards through every graph edge and weights starting roots by their symmetry multiplicity.

Command:

```sh
cd app
npm run audit:unsupported -- --scope supported --out /Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-22-kc5-support-loss --workers 4 --gate loops
npx tsx /Users/danielcepeda/repos/_codex_output/bn-count-support-loss.mts /Users/danielcepeda/repos/_codex_output/bn-audit-2026-09-22-kc5-support-loss
```
