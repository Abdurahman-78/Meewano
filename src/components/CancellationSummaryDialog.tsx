import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  MapPin,
  Calendar,
  CreditCard,
  FileText,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  getCancelledStatusInfo,
  type BookingWithRefundInfo,
  type RefundRequestRecord,
} from "@/lib/cancellationStatus";
import { computeRefund } from "@/lib/refundCalculator";

interface CancellationSummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: BookingWithRefundInfo | null;
  refundRequest?: RefundRequestRecord | null;
}

export const CancellationSummaryDialog = ({
  open,
  onOpenChange,
  booking,
  refundRequest,
}: CancellationSummaryDialogProps) => {
  const { formatPrice } = useCurrency();

  const property = booking?.property || booking?.properties;

  const statusInfo = useMemo(() => {
    if (!booking) return null;
    return getCancelledStatusInfo(booking, refundRequest);
  }, [booking, refundRequest]);

  const refundCalculation = useMemo(() => {
    if (!booking) return null;
    return computeRefund({
      policyText: property?.cancellation_policy,
      checkIn: booking.check_in,
      totalPrice: Number(booking.total_price),
      now: booking.cancelled_at ? new Date(booking.cancelled_at) : new Date(),
    });
  }, [booking, property]);

  if (!booking || !statusInfo) return null;

  const dateBookedStr = booking.created_at
    ? new Date(booking.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

  const cancelledDateStr = booking.cancelled_at
    ? new Date(booking.cancelled_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  const finalRefundAmount =
    booking.refund_amount !== null && booking.refund_amount !== undefined
      ? Number(booking.refund_amount)
      : refundRequest?.refund_amount !== null && refundRequest?.refund_amount !== undefined
      ? Number(refundRequest.refund_amount)
      : refundCalculation?.totalRefund || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="space-y-1">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <DialogTitle className="text-2xl font-bold">Cancellation Summary</DialogTitle>
            <Badge className={statusInfo.badgeClass}>{statusInfo.badgeText}</Badge>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            Booking #{booking.id.slice(0, 8).toUpperCase()} · {property?.title || "Property"}
          </DialogDescription>
        </DialogHeader>

        {/* Status Callout Banner */}
        <div
          className={`rounded-lg p-4 border flex items-start gap-3 mt-2 ${
            statusInfo.type === "paid"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200"
              : statusInfo.type === "not_qualified"
              ? "bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-200"
              : "bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200"
          }`}
        >
          {statusInfo.iconType === "check" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : statusInfo.iconType === "x" ? (
            <XCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          ) : (
            <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1 text-sm">
            <p className="font-semibold text-base">Status: {statusInfo.label}</p>
            <p className="opacity-90">{statusInfo.description}</p>
          </div>
        </div>

        {/* Booking & Property Info */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-bold text-base">{property?.title || "Property"}</h4>
              <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                <MapPin className="h-3.5 w-3.5 mr-1 text-primary" />
                {property?.location || "Location not specified"}
              </div>
            </div>
            <p className="text-base font-bold text-primary">{formatPrice(booking.total_price)}</p>
          </div>

          <Separator />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <p className="text-muted-foreground">Date Booked</p>
              <p className="font-medium mt-0.5">{dateBookedStr}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Check-in</p>
              <p className="font-medium mt-0.5">{booking.check_in}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Check-out</p>
              <p className="font-medium mt-0.5">{booking.check_out || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Cancelled At</p>
              <p className="font-medium mt-0.5">{cancelledDateStr}</p>
            </div>
          </div>
        </div>

        {/* Cancellation Details & Reason */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm flex items-center gap-1.5">
            <FileText className="h-4 w-4 text-primary" /> Cancellation Details
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm rounded-lg border border-border p-3 bg-muted/20">
            <div>
              <p className="text-xs text-muted-foreground">Cancellation Policy</p>
              <p className="font-medium mt-0.5">{refundCalculation?.policyLabel || "Standard"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Days Remaining at Cancellation</p>
              <p className="font-medium mt-0.5">
                {refundCalculation?.daysUntilCheckIn !== undefined
                  ? `${refundCalculation.daysUntilCheckIn} day(s)`
                  : "—"}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs text-muted-foreground">Category</p>
              <p className="font-medium mt-0.5 capitalize">
                {booking.cancellation_category || (refundRequest ? "Exceptional circumstances" : "General")}
              </p>
            </div>
            {(booking.cancellation_reason || refundRequest?.reason) && (
              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground">Reason</p>
                <p className="font-medium mt-0.5">
                  {booking.cancellation_reason || refundRequest?.reason}
                </p>
              </div>
            )}
            {refundRequest?.details && (
              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground">Provided Circumstance Details</p>
                <p className="text-xs mt-1 p-2 rounded bg-background border border-border whitespace-pre-wrap">
                  {refundRequest.details}
                </p>
              </div>
            )}
            {refundRequest?.host_decision_reason && (
              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground">Host Response Note</p>
                <p className="text-xs mt-1 p-2 rounded bg-muted text-foreground">
                  {refundRequest.host_decision_reason}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Refund & Financial Breakdown */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm flex items-center gap-1.5">
            <CreditCard className="h-4 w-4 text-primary" /> Refund & Financial Breakdown
          </h4>
          <div className="rounded-lg border border-border p-4 bg-card space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Paid by Guest</span>
              <span className="font-medium">{formatPrice(booking.total_price)}</span>
            </div>
            {refundCalculation && (
              <>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Accommodation Portion</span>
                  <span>{formatPrice(refundCalculation.accommodationBase)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    Meewano Service Fee {refundCalculation.serviceFeeRefund > 0 ? "(Refunded)" : "(Non-refundable)"}
                  </span>
                  <span>{formatPrice(refundCalculation.serviceFee)}</span>
                </div>
              </>
            )}
            <Separator />
            <div className="flex justify-between items-center text-base font-bold">
              <span>Total Refund Amount</span>
              <span
                className={
                  finalRefundAmount > 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-muted-foreground"
                }
              >
                {formatPrice(finalRefundAmount)}
              </span>
            </div>

            {statusInfo.type === "paid" && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                This refund has been paid and credited to your customer account.
              </p>
            )}
            {statusInfo.type === "in_progress" && (
              <p className="text-xs text-muted-foreground mt-2">
                Refunds typically take 5-14 business days to appear on your original payment statement depending on your bank or payment provider.
              </p>
            )}
            {statusInfo.type === "not_qualified" && (
              <p className="text-xs text-muted-foreground mt-2">
                As per the cancellation policy, no refund was eligible for this cancellation.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 mt-2">
          {property && (
            <Button asChild variant="outline" className="flex-1">
              <Link to={`/property/${booking.property_id || property.title}`}>
                <ExternalLink className="h-4 w-4 mr-2" />
                View Property
              </Link>
            </Button>
          )}
          <Button onClick={() => onOpenChange(false)} className="flex-1">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
