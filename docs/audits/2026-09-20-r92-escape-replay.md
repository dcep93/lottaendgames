# r9.2 safe-escape witness replay

r9.2 now ranks king defense first, then absence of any legal Black reply attacking
or capturing the knight, then the existing Euclidean center proximity. Its
before-White attacked-and-undefended trigger is unchanged. Earlier rules retain
priority, and support classification is unchanged.

Replayed all 452 representative cycles from the exhaustive Ke5 audit against the
updated policy. Each surviving example passed three repetitions, including all
White and history-dependent Black best-move checks, exact board return, and
unsupported classification after every White move.

| Prior witness type | Tested | Still repeats |
|---|---:|---:|
| Knight shuttle | 418 | 14 |
| Bishop shuttle | 19 | 19 |
| King shuffle | 15 | 15 |
| Total | 452 | 48 |

**404 saved knight-shuttle witnesses are broken.** This is not an exhaustive
new audit: components may contain other cycles and changed moves may introduce
new ones. No updated direct-cycle or reachability count is claimed.

The supplied Nc6+ Kd6 Nd4 Ke5 example now selects Nb5 or Ne2 on the first move.
Both prevent an immediate renewed attack, whereas Nc6+ permits Kd6.

Loaded remaining minimal loop:
[1. Nh5+ Kg5 2. Ng3 Kf6](http://localhost:5173/mate/bishop-knight#fen=8/8/5k2/8/3KB3/6N1/8/8_w_-_-_0_1&moves=Nh5%2B,Kg5,Ng3,Kf6&cursor=0).
All its post-White positions remain unsupported under the revised policy.

Validation: all 648 mate tests and all 8 audit-scaffold tests pass; production
build passes. New regression cases cover the supplied loop in all eight
symmetries and a two-step Black approach prevented by White's king, ensuring
actual legal replies are used rather than geometric distance alone.

Replay details: `/Users/danielcepeda/repos/_codex_output/r92-safe-escape-witnesses.json`.
