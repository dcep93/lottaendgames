# Reflected two-knights Standard start

Standard begins with White Kf1, Ng1, Nh1 and Black Ka8, h4. Each Start Over alternates the complete position by file reflection: White Kc1, Na1, Nb1 and Black Kh8, a4. Reloading a shared board preserves its orientation; restarting alternates based on the session starting orientation. Training remains unchanged.

The existing table is reused by canonicalizing a-file pawn or stationary-Qa1 positions into h-file coordinates. No new solver graph or game rules are needed. Both starts have DTM 57 (mate in 29 White moves). Reflected successor values, optimal Black reply sets and canonical White tie ordering must agree. Captures stay prohibited, only queen promotion is allowed, the queen stays stationary, and the fifty-move rule remains ignored.
