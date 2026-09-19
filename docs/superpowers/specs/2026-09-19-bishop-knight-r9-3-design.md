# r9.3: escape a nearby pair with the bishop

Add r9.3 between r9.2 and r10. Evaluate the trigger before White moves: both minor pieces must be within two king steps of Black, and neither may be defended by White's central king. The user explicitly confirmed that defense of either piece disables this rule. Central means d4/e4/d5/e5.

When active, first prefer a resulting position where White’s central king defends either minor piece. Such outcomes tie under r9.3. Otherwise rank by maximum bishop Euclidean distance from Black. This includes central-king defense established by the candidate move, as requested for 2. Kd4. Knight distance does not contribute. Escaping beyond two steps retains credit. Earlier rules and r10 remain unchanged. Add the user's rule text and a timing/exemption note to the modal.

Verify the trigger boundary, separate exemptions, symmetry, and bishop-only scoring. Run the Mate suite and build; verify and load a minimal unsupported best-move loop under the resulting policy.
