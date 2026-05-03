import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Clock, Shield } from "lucide-react";

const PasswordResetEmail = () => {
  return (
    <div className="min-h-screen bg-secondary/20 p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center border-b">
            <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Lock className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl">Reset Your Password</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6 pt-6">
            <div className="text-center">
              <p className="text-foreground font-medium">Hi John Doe,</p>
              <p className="text-muted-foreground mt-2">
                We received a request to reset your password for your Meewano account.
              </p>
            </div>

            <div className="bg-secondary/50 rounded-lg p-6 space-y-4">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-semibold">Time Sensitive Request</p>
                  <p className="text-sm text-muted-foreground">
                    This password reset link will expire in 1 hour for security purposes.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center py-4">
              <a 
                href="/auth?reset=true" 
                className="inline-block bg-primary text-primary-foreground px-8 py-4 rounded-md font-medium hover:bg-primary/90 transition-colors text-lg"
              >
                Reset Password
              </a>
            </div>

            <div className="bg-secondary/50 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Or copy and paste this link into your browser:
              </p>
              <p className="text-xs text-primary mt-2 break-all">
                https://meewano.com/reset-password?token=abc123def456ghi789
              </p>
            </div>

            <div className="border-t pt-6">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-2">Security Notice</h3>
                  <p className="text-sm text-muted-foreground">
                    If you didn't request a password reset, you can safely ignore this email. 
                    Your password will remain unchanged.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Tip:</strong> Choose a strong password that you don't use for other accounts. 
                We recommend using a combination of letters, numbers, and special characters.
              </p>
            </div>

            <div className="text-center pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Having trouble? Contact support at security@meewano.com
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-4">
          This is a preview of the password reset email template
        </p>
      </div>
    </div>
  );
};

export default PasswordResetEmail;
