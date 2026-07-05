import { CANCELLATION_POLICIES, type CancellationPolicyKey, detectPolicyKey } from "./cancellationPolicies";

export interface RefundTier {
  fullRefundDays: number;   // >= this many days before check-in → 100%
  halfRefundDays: number;   // between halfRefundDays and fullRefundDays → 50%
  // below halfRefundDays → 0%
}

export const POLICY_TIERS: Record<CancellationPolicyKey, RefundTier> = {
  extra_flexible: { fullRefundDays: 3, halfRefundDays: 0.5 }, // 12h
  flexible:       { fullRefundDays: 7, halfRefundDays: 1 },
  standard:       { fullRefundDays: 30, halfRefundDays: 7 },
  strict:         { fullRefundDays: 60, halfRefundDays: 30 },
};

// Meewano service fee estimate (percentage of total)
export const MEEWANO_SERVICE_FEE_PCT = 0.04;

export interface RefundBreakdown {
  policyKey: CancellationPolicyKey;
  policyLabel: string;
  daysUntilCheckIn: number;
  refundPct: number;              // 0, 0.5, or 1
  tierSentence: string;           // human-readable
  totalPrice: number;
  serviceFee: number;
  accommodationBase: number;      // totalPrice - serviceFee
  accommodationRefund: number;
  serviceFeeRefund: number;
  totalRefund: number;
}

export const daysBetween = (from: Date, to: Date): number => {
  const ms = to.getTime() - from.getTime();
  return ms / (1000 * 60 * 60 * 24);
};

export const resolvePolicyKey = (
  policyText: string | null | undefined
): CancellationPolicyKey => {
  const detected = detectPolicyKey(policyText || "");
  return (detected || "standard") as CancellationPolicyKey;
};

export const computeRefund = (opts: {
  policyText: string | null | undefined;
  checkIn: string | Date;
  totalPrice: number;
  now?: Date;
}): RefundBreakdown => {
  const policyKey = resolvePolicyKey(opts.policyText);
  const policyLabel =
    CANCELLATION_POLICIES.find((p) => p.key === policyKey)?.label || "Standard";
  const tier = POLICY_TIERS[policyKey];
  const now = opts.now ?? new Date();
  const checkIn = typeof opts.checkIn === "string" ? new Date(opts.checkIn) : opts.checkIn;
  const days = daysBetween(now, checkIn);
  const daysUntilCheckIn = Math.max(0, Math.floor(days));

  let refundPct = 0;
  if (days >= tier.fullRefundDays) refundPct = 1;
  else if (days >= tier.halfRefundDays) refundPct = 0.5;

  const totalPrice = Math.max(0, opts.totalPrice || 0);
  const serviceFee = Math.round(totalPrice * MEEWANO_SERVICE_FEE_PCT);
  const accommodationBase = totalPrice - serviceFee;
  const accommodationRefund = Math.round(accommodationBase * refundPct);
  // Service fee only refunded on a full-refund cancellation
  const serviceFeeRefund = refundPct === 1 ? serviceFee : 0;
  const totalRefund = accommodationRefund + serviceFeeRefund;

  let tierSentence: string;
  if (refundPct === 1) {
    tierSentence = `You are more than ${tier.fullRefundDays} days before check-in — you qualify for a full refund under the ${policyLabel} policy.`;
  } else if (refundPct === 0.5) {
    tierSentence = `You are within ${tier.fullRefundDays} days of check-in — under the ${policyLabel} policy you qualify for a 50% refund of the accommodation.`;
  } else {
    tierSentence = `You are within ${tier.halfRefundDays < 1 ? Math.round(tier.halfRefundDays * 24) + " hours" : tier.halfRefundDays + " days"} of check-in — under the ${policyLabel} policy no refund is available.`;
  }

  return {
    policyKey,
    policyLabel,
    daysUntilCheckIn,
    refundPct,
    tierSentence,
    totalPrice,
    serviceFee,
    accommodationBase,
    accommodationRefund,
    serviceFeeRefund,
    totalRefund,
  };
};
