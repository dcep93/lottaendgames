# Two Bishops Rule E/F Order Design

Rename visible Rule WW to Rule E and visible Rule X to Rule F. Move both directly above Rule G in the active priority order. Preserve their scoring, applicability, and help text apart from the rule names.

The active policy order becomes: safeguards, Rule E, Rule F, Rule G, Rule N, Rule O, Rule W2, Rule W3, Rule W.

Verify the visible descriptions, direct Rule E and Rule F behavior, focused tests, build, lint, and an independently validated h1-oriented loop loaded at `cursor=0`.
