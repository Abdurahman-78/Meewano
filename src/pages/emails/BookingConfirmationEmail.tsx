import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Calendar, MapPin, User, Home } from "lucide-react";

const BookingConfirmationEmail = () => {
  return (
    <div className="min-h-screen bg-secondary/20 p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center border-b">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Booking Confirmed!</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Reference: MEW123ABC456
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6 pt-6">
            <div className="text-center">
              <p className="text-foreground font-medium">Dear John Doe,</p>
              <p className="text-muted-foreground mt-2">
                Your booking has been confirmed. We're excited to host you!
              </p>
            </div>

            <div className="bg-secondary/50 rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Home className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold">Kurdish Traditional House</p>
                  <p className="text-sm text-muted-foreground">Entire home</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary" />
                <p className="text-sm text-muted-foreground">Erbil, Kurdistan Region</p>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Check-in: May 15, 2024 at 3:00 PM</p>
                  <p className="text-sm text-muted-foreground">Check-out: May 20, 2024 at 11:00 AM</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-primary" />
                <p className="text-sm text-muted-foreground">2 guests</p>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold mb-3">Payment Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">$60 x 5 nights</span>
                  <span>$300.00</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Service fee</span>
                  <span>$45.00</span>
                </div>
                <div className="flex justify-between font-semibold pt-2 border-t">
                  <span>Total</span>
                  <span>$345.00</span>
                </div>
              </div>
            </div>

            <div className="bg-secondary/50 rounded-lg p-4">
              <h3 className="font-semibold mb-2">What's Next?</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Message your host for check-in instructions</li>
                <li>• Review house rules before arrival</li>
                <li>• Download the Meewano app for easy access</li>
              </ul>
            </div>

            <div className="text-center pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Need help? Contact us at support@meewano.com
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-4">
          This is a preview of the booking confirmation email template
        </p>
      </div>
    </div>
  );
};

export default BookingConfirmationEmail;
