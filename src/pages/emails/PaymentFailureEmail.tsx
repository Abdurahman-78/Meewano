import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle, CreditCard, AlertCircle } from "lucide-react";

const PaymentFailureEmail = () => {
  return (
    <div className="min-h-screen bg-secondary/20 p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center border-b">
            <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <CardTitle className="text-2xl">Payment Failed</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6 pt-6">
            <div className="text-center">
              <p className="text-foreground font-medium">Dear John Doe,</p>
              <p className="text-muted-foreground mt-2">
                Unfortunately, we couldn't process your payment for your booking.
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900 mb-2">Payment Declined</p>
                  <p className="text-sm text-red-800">
                    Your payment method was declined. This could be due to insufficient funds, 
                    an incorrect card number, or security restrictions from your bank.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-secondary/50 rounded-lg p-6 space-y-3">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold">Booking Details</p>
                  <p className="text-sm text-muted-foreground">Kurdish Traditional House</p>
                  <p className="text-sm text-muted-foreground">May 15-20, 2024</p>
                  <p className="text-sm font-semibold mt-1">Total: $345.00</p>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold mb-3">What Should You Do?</h3>
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li>1. Check with your bank to ensure the card is active and has sufficient funds</li>
                <li>2. Verify your payment information is correct</li>
                <li>3. Try a different payment method</li>
                <li>4. Contact your bank if the issue persists</li>
              </ol>
            </div>

            <div className="bg-secondary/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                <strong>Important:</strong> This booking is not confirmed. Please complete your 
                payment within 24 hours or your reservation will be cancelled automatically.
              </p>
            </div>

            <div className="text-center pt-4">
              <a 
                href="/payment" 
                className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-md font-medium hover:bg-primary/90 transition-colors"
              >
                Try Payment Again
              </a>
            </div>

            <div className="text-center pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Need assistance? Contact us at support@meewano.com
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-4">
          This is a preview of the payment failure email template
        </p>
      </div>
    </div>
  );
};

export default PaymentFailureEmail;
