/** User-declared mating net; shared by the policy, guide animation and tests. */
export const matingNetStart = '8/8/8/8/8/2K5/B1N5/3k4 w - - 6 4';
export const matingNetLine = [
  'Nd4', 'Kc1', 'Ne2+', 'Kd1', 'Kd3', 'Ke1', 'Ke3', 'Kd1',
  'Bb3+', 'Ke1', 'Bc2', 'Kf1', 'Nf4', 'Ke1', 'Ng2+', 'Kf1',
  'Kf3', 'Kg1', 'Kg3', 'Kf1', 'Bd3+', 'Kg1', 'Be2', 'Kh1',
  'Nf4', 'Kg1', 'Nh3+', 'Kh1', 'Bf3#',
] as const;

/** Additional user-declared branch from the Ne2/Kf1 loop, ending in Be4#. */
export const matingNetBranchStart = '8/8/8/8/3N4/4K3/B7/4k3 w - - 0 1';
export const matingNetBranchLine = [
  'Ne2', 'Kf1', 'Bd5', 'Ke1', 'Bb3', 'Kf1', 'Nf4', 'Ke1',
  'Ng2+', 'Kf1', 'Kf3', 'Kg1', 'Kg3', 'Kh1', 'Bc4', 'Kg1',
  'Bd3', 'Kh1', 'Nf4', 'Kg1', 'Nh3+', 'Kh1', 'Be4#',
] as const;

/** Loaded Bb3 branch; the final Be4# destination was already declared. */
export const matingNetBishopBranchStart = '8/8/8/8/8/1B2K3/4N3/5k2 w - - 0 1';
export const matingNetBishopBranchLine = [
  'Nf4', 'Kg1', 'Kf3', 'Kf1', 'Ng2', 'Kg1', 'Kg3', 'Kf1',
  'Bc4+', 'Kg1', 'Bd3', 'Kh1', 'Nf4', 'Kg1', 'Nh3+', 'Kh1', 'Be4#',
] as const;

/** Loaded continuation answering ...Kh2 with Bc4, then Kg3 and Bd3. */
export const matingNetKh2BranchLine = [
  'Nd4', 'Kc1', 'Ne2+', 'Kd1', 'Kd3', 'Ke1', 'Ke3', 'Kf1',
  'Bd5', 'Ke1', 'Bb3', 'Kf1', 'Nf4', 'Kg1', 'Kf3', 'Kh2',
  'Bc4', 'Kg1', 'Kg3', 'Kh1', 'Bd3', 'Kg1', 'Nh3+', 'Kh1', 'Be4#',
] as const;

/** Loaded ...Kf2 branch, through Be6 and ending in Bd5#. */
export const matingNetKf2BranchLine = [
  'Nd4', 'Ke1', 'Kd3', 'Kf2', 'Ne2', 'Kf3', 'Be6', 'Kg2',
  'Ke3', 'Kh2', 'Kf3', 'Kh1', 'Nf4', 'Kg1', 'Bc4', 'Kh1',
  'Kg3', 'Kg1', 'Nh3+', 'Kh1', 'Bd5#',
] as const;

/** User-declared partial ...Kf1 continuation, through Bf5 and Kf3. */
export const matingNetKf1PartialLine = [
  'Nd4', 'Ke1', 'Kd3', 'Kf1', 'Ke3', 'Kg2', 'Ne2', 'Kh2',
  'Be6', 'Kg2', 'Bf5', 'Kh1', 'Kf3', 'Kh2',
] as const;

/** Loaded ...Kg1 branch, checking with Ne2 and answering ...Kh1 with Kf3. */
export const matingNetKg1BranchLine = [
  'Nd4', 'Ke1', 'Kd3', 'Kf1', 'Ke3', 'Kg1', 'Ne2+', 'Kh2',
  'Be6', 'Kh1', 'Kf3', 'Kh2', 'Nf4', 'Kg1', 'Bc4', 'Kh1',
  'Kg3', 'Kg1', 'Nh3+', 'Kh1', 'Bd5#',
] as const;

/** Corrected partial line: arrange the bishop before advancing Ke3. */
export const matingNetCorrectedBishopLine = [
  'Nd4', 'Ke1', 'Kd3', 'Kf2', 'Ne2', 'Kg2', 'Be6', 'Kf3',
  'Bf5', 'Kf2', 'Be4', 'Ke1', 'Ke3', 'Kd1', 'Bd3', 'Ke1',
] as const;
