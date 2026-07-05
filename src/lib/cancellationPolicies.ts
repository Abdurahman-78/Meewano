export type CancellationPolicyKey =
  | "extra_flexible"
  | "flexible"
  | "standard"
  | "strict";

export interface CancellationPolicy {
  key: CancellationPolicyKey;
  label: string;
  bullets: string[];
}

export const CANCELLATION_POLICIES: CancellationPolicy[] = [
  {
    key: "extra_flexible",
    label: "Extra Flexible",
    bullets: [
      "Full refund up to 3 days before check-in",
      "50% refund up to 24 hours before check-in*",
      "No refund within 12 hours of check-in*",
    ],
  },
  {
    key: "flexible",
    label: "Flexible",
    bullets: [
      "Full refund up to 7 days before check-in",
      "50% refund up to 24 hours before check-in*",
      "No refund within 24 hours of check-in*",
    ],
  },
  {
    key: "standard",
    label: "Standard",
    bullets: [
      "Full refund up to 30 days before check-in",
      "50% refund up to 7 days before check-in*",
      "No refund within 7 days of check-in*",
    ],
  },
  {
    key: "strict",
    label: "Strict",
    bullets: [
      "Full refund up to 60 days before check-in",
      "50% refund up to 30 days before check-in*",
      "No refund within 30 days of check-in*",
    ],
  },
];

export const CANCELLATION_POLICY_FOOTNOTE =
  "*Unless: the host voluntarily cancels the booking, or the guest experiences exceptional circumstances (emergency, sickness, death, war, etc.), in which case the host is requested to review the refund request and make a decision.";

export const formatCancellationPolicy = (key: CancellationPolicyKey): string => {
  const p = CANCELLATION_POLICIES.find((x) => x.key === key);
  if (!p) return "";
  return `**${p.label}**\n${p.bullets.map((b) => `- ${b}`).join("\n")}\n\n${CANCELLATION_POLICY_FOOTNOTE}`;
};

export const detectPolicyKey = (
  text: string | null | undefined
): CancellationPolicyKey | "" => {
  if (!text) return "";
  const lower = text.toLowerCase();
  // Match by label first
  for (const p of CANCELLATION_POLICIES) {
    if (lower.includes(p.label.toLowerCase())) return p.key;
  }
  return "";
};
