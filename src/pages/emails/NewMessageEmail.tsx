import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, User, Clock } from "lucide-react";

const NewMessageEmail = () => {
  return (
    <div className="min-h-screen bg-secondary/20 p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center border-b">
            <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <MessageSquare className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl">You Have a New Message</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6 pt-6">
            <div className="text-center">
              <p className="text-foreground font-medium">Hi John Doe,</p>
              <p className="text-muted-foreground mt-2">
                You have received a new message about your booking.
              </p>
            </div>

            <div className="bg-secondary/50 rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b">
                <User className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold">Sarah Ahmed</p>
                  <p className="text-sm text-muted-foreground">Host</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>2 hours ago</span>
              </div>

              <div className="bg-background rounded-lg p-4 border">
                <p className="text-sm text-foreground">
                  "Hello! I wanted to reach out about your upcoming stay at Kurdish Traditional House. 
                  I've prepared a welcome package for you with local recommendations and a small gift. 
                  Looking forward to hosting you!"
                </p>
              </div>

              <div className="pt-2">
                <p className="text-xs text-muted-foreground">
                  <strong>Regarding:</strong> Kurdish Traditional House<br />
                  Check-in: May 15, 2024
                </p>
              </div>
            </div>

            <div className="text-center py-4">
              <a 
                href="/messages" 
                className="inline-block bg-primary text-primary-foreground px-8 py-4 rounded-md font-medium hover:bg-primary/90 transition-colors"
              >
                Reply to Message
              </a>
            </div>

            <div className="bg-secondary/50 rounded-lg p-4">
              <h3 className="font-semibold mb-2 text-sm">Message Tips</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Respond promptly to maintain good communication</li>
                <li>• Be clear and specific in your replies</li>
                <li>• Keep all communication on the platform</li>
              </ul>
            </div>

            <div className="text-center pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">
                Manage your notification preferences
              </p>
              <a href="/account-settings" className="text-sm text-primary hover:underline">
                Update Settings
              </a>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-4">
          This is a preview of the new message notification email template
        </p>
      </div>
    </div>
  );
};

export default NewMessageEmail;
