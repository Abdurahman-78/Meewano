import { computeRefund, resolvePolicyKey } from "./refundCalculator";

export type CancelledRefundType = "in_progress" | "paid" | "not_qualified";

export interface CancelledStatusDetails {
  type: CancelledRefundType;
  label: string;
  badgeClass: string;
  badgeText: string;
  description: string;
  iconType: "clock" | "check" | "x";
}

export interface BookingWithRefundInfo {
  id: string;
  status?: string | null;
  refund_status?: string | null;
  refund_amount?: number | null;
  total_price: number;
  check_in: string;
  check_out?: string;
  created_at?: string;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
  cancellation_category?: string | null;
  property?: {
    title?: string;
    location?: string;
    images?: string[];
    cancellation_policy?: string | null;
  } | null;
  properties?: {
    title?: string;
    location?: string;
    images?: string[];
    cancellation_policy?: string | null;
  } | null;
}

export interface RefundRequestRecord {
  id?: string;
  booking_id: string;
  status: string;
  reason?: string;
  details?: string;
  evidence_urls?: string[];
  refund_amount?: number | null;
  admin_decision?: string | null;
  host_decision_reason?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Returns the exact cancellation status category, badge colors, and full description
 * for a booking according to the three types:
 * 1. Status: Cancelled - Refund in Progress
 * 2. Status: Cancelled - Refund Paid to Customer Account
 * 3. Status: Cancelled - Not qualified for a Refund
 */
export function getCancelledStatusInfo(
  booking: BookingWithRefundInfo,
  refundRequest?: RefundRequestRecord | null,
): CancelledStatusDetails {
  const explicitRefundStatus = (booking.refund_status || "").toLowerCase();
  const rrStatus = (refundRequest?.status || "").toLowerCase();

  // 1. Check if refund was already paid out to customer account
  if (
    explicitRefundStatus === "paid" ||
    explicitRefundStatus === "refund_paid" ||
    explicitRefundStatus === "completed" ||
    rrStatus === "refund_paid" ||
    rrStatus === "paid"
  ) {
    return {
      type: "paid",
      label: "Cancelled - Refund Paid to Customer Account",
      badgeText: "Cancelled · Refund Paid",
      badgeClass: "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600",
      description: "Your refund has been successfully paid and credited to your payment account.",
      iconType: "check",
    };
  }

  // 2. Check if not qualified for refund
  const isZeroRefund =
    booking.refund_amount === 0 ||
    (refundRequest && refundRequest.refund_amount === 0 && rrStatus !== "pending_host" && rrStatus !== "host_rejected");

  const isExplicitNotQualified =
    explicitRefundStatus === "not_qualified" ||
    rrStatus === "admin_approved_rejection";

  if (isExplicitNotQualified || (isZeroRefund && !refundRequest && booking.cancellation_category === "general")) {
    return {
      type: "not_qualified",
      label: "Cancelled - Not qualified for a Refund",
      badgeText: "Cancelled · Not Qualified",
      badgeClass: "bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-600",
      description: "This booking did not qualify for a refund according to the property's cancellation policy.",
      iconType: "x",
    };
  }

  // 3. If refund is in progress:
  // - refund_amount > 0
  // - explicit refund_status = 'in_progress'
  // - refund_request pending host or admin review
  return {
    type: "in_progress",
    label: "Cancelled - Refund in Progress",
    badgeText: "Cancelled · Refund in Progress",
    badgeClass: "bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-600",
    description: "Your cancellation refund is being processed and will be credited to your account.",
    iconType: "clock",
  };
}

/**
 * Word count helper
 */
export function countWords(text: string): number {
  if (!text) return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}
