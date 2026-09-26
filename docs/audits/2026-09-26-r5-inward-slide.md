# R5 allows an inward king slide — 2026-09-26

In the reported Ba8/Kb7/Nc6 versus Kd7 position, Nc6 is more central than Kb7 and Kb6 advances while retaining knight protection. The opposition-check part of r5 now skips its knight hop when an inward knight allows this safe king slide. The check uses two simple candidate squares, occupancy, center distance, and Black-king adjacency; no legal-response search is added. R5 text is unchanged.

Kb6 is now the sole preferred move. The original Kc1/Nb2 versus Kc3 pattern still checks with Nd1 because its inward slide is blocked. Both cases pass all eight D4 transforms. All 34 focused tests and the build pass.

One of the previous two displayed loops remains: an r7 king shuffle with two D4 post-White positions. Replay of the earlier 318 witnesses finds 53 survivors before the middle-16 presentation exclusion, and no older full-audit witnesses return. Five-second sampling completed 218 roots (219 started), finding zero additional cycles. These are not global counts. Only one displayed motif/example remains, so the standing 10-plus-2 cannot be filled.

The surviving example passes independent preferred-White/legal-Black closure and exclusion checks. Its orientation allows Black to be equidistant from a8 and h1.

- [Kb4, Ke5, Kb5, Kd4](http://localhost:5173/mate/bishop-knight#fen=8/8/8/1KN5/2Bk4/8/8/8_w_-_-_0_1&moves=Kb4,Ke5,Kb5,Kd4&cursor=0)
