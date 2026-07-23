import {
  TWO_BISHOPS_PROOF_DATA_BASE64,
  TWO_BISHOPS_PROOF_MAX_DISTANCE,
  TWO_BISHOPS_PROOF_POSITION_COUNT,
} from '../../app/src/mate/rules/twoBishopsProofData.ts'
import { MATE_CATALOG } from '../../app/src/mate/catalog.ts'
import {
  getTwoBishopsProofDistance,
  isTwoBishopsProofProgress,
} from '../../app/src/mate/rules/twoBishopsProof.ts'
import { twoBishopsWhiteRules } from '../../app/src/mate/rules/twoBishops.ts'
import type { MateVerificationResult } from './types.mts'

const EXPECTED_TABLE_BYTES = 10 * 64 * 32 * 32
const EXPECTED_RULE_PREFIX = [
  'mate',
  'bishops safe',
  'no stalemate',
] as const

/**
 * Exhaustive certificate for the position-only KBB-v-K policy.
 *
 * Every nonzero table entry is an exact White-to-move distance to mate. The
 * fourth White rule rejects every move whose worst legal Black reply does not
 * lower that distance, except for a one-way corner waiting move. That wait
 * starts with bishops at most three king moves apart and ends with them farther
 * apart, so it cannot be selected again until a strictly decreasing move has
 * happened. DTM therefore falls at least every other White turn.
 */
export function verifyTwoBishopsProofCertificate(): MateVerificationResult {
  const data = Buffer.from(TWO_BISHOPS_PROOF_DATA_BASE64, 'base64')
  if (data.length !== EXPECTED_TABLE_BYTES) {
    return incomplete(
      `Two Bishops proof table has ${data.length} bytes; expected ${EXPECTED_TABLE_BYTES}`,
    )
  }

  let positionCount = 0
  let maximumDistance = 0
  for (const distance of data) {
    if (distance === 0) continue
    positionCount += 1
    maximumDistance = Math.max(maximumDistance, distance)
    if (distance % 2 !== 1) {
      return incomplete(
        `Two Bishops proof table contains even White-turn DTM ${distance}`,
      )
    }
  }
  if (
    positionCount !== TWO_BISHOPS_PROOF_POSITION_COUNT ||
    maximumDistance !== TWO_BISHOPS_PROOF_MAX_DISTANCE
  ) {
    return incomplete(
      'Two Bishops proof table metadata does not match its decoded contents',
    )
  }

  const rulePrefix = twoBishopsWhiteRules
    .slice(0, EXPECTED_RULE_PREFIX.length)
    .map(({ id }) => id)
  const proofGuard = twoBishopsWhiteRules[EXPECTED_RULE_PREFIX.length]
  if (
    rulePrefix.length !== EXPECTED_RULE_PREFIX.length ||
    rulePrefix.some((id, index) => id !== EXPECTED_RULE_PREFIX[index]) ||
    proofGuard?.presentationRole !== 'guard'
  ) {
    return incomplete(
      `Two Bishops proof guard must immediately follow ${EXPECTED_RULE_PREFIX.join(', ')}`,
    )
  }

  for (
    let currentDistance = 1;
    currentDistance <= maximumDistance;
    currentDistance += 2
  ) {
    for (
      let worstReplyDistance = 0;
      worstReplyDistance <= maximumDistance;
      worstReplyDistance += 1
    ) {
      for (const supportedCornerWait of [false, true]) {
        for (let startingBishopDistance = 0; startingBishopDistance <= 7; startingBishopDistance += 1) {
          for (let resultingBishopDistance = 0; resultingBishopDistance <= 7; resultingBishopDistance += 1) {
            const accepted = isTwoBishopsProofProgress({
              currentDistance,
              worstReplyDistance,
              supportedCornerWait,
              startingBishopDistance,
              resultingBishopDistance,
            })
            const proven =
              worstReplyDistance < currentDistance ||
              (worstReplyDistance === currentDistance &&
                supportedCornerWait &&
                startingBishopDistance <= 3 &&
                resultingBishopDistance > 3)
            if (accepted !== proven) {
              return incomplete(
                'Two Bishops proof-progress predicate violates its certificate',
              )
            }
          }
        }
      }
    }
  }

  const maximumMatePlies = certifiedMatePlies(maximumDistance)
  if (maximumMatePlies >= 100) {
    return incomplete(
      `Two Bishops certified mate bound is ${maximumMatePlies} plies`,
    )
  }

  const trainSeeds =
    MATE_CATALOG.find(({ id }) => id === 'two-bishops')?.trainSeeds ?? []
  for (const fen of trainSeeds) {
    const distance = getTwoBishopsProofDistance(fen)
    const halfmoveClock = Number(fen.split(' ')[4] ?? 0)
    if (
      distance === null ||
      halfmoveClock + certifiedMatePlies(distance) > 100
    ) {
      return incomplete(
        `Two Bishops Train seed exceeds its certified fifty-move bound: ${fen}`,
      )
    }
  }

  return {
    status: 'verified',
    stats: {
      blackReplies: 0,
      maximumMatePlies,
      provenRoots: positionCount,
      uniquePositions: positionCount,
      whiteChoices: 0,
    },
  }
}

function certifiedMatePlies(distance: number): number {
  return distance + Math.ceil(distance / 2) * 2
}

function incomplete(message: string): MateVerificationResult {
  return {
    message,
    status: 'incomplete',
    stats: {
      blackReplies: 0,
      maximumMatePlies: 0,
      provenRoots: 0,
      uniquePositions: 0,
      whiteChoices: 0,
    },
  }
}
