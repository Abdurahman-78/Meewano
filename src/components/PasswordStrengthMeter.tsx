import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PasswordCheck {
  label: string;
  passed: boolean;
}

export const evaluatePassword = (pw: string) => {
  const checks: PasswordCheck[] = [
    { label: "At least 8 characters", passed: pw.length >= 8 },
    { label: "An uppercase letter (A-Z)", passed: /[A-Z]/.test(pw) },
    { label: "A lowercase letter (a-z)", passed: /[a-z]/.test(pw) },
    { label: "A number (0-9)", passed: /\d/.test(pw) },
    { label: "A symbol (!@#$…)", passed: /[^A-Za-z0-9]/.test(pw) },
  ];
  const score = checks.filter((c) => c.passed).length;
  let label = "Too weak";
  let color = "bg-destructive";
  if (score >= 5) { label = "Excellent"; color = "bg-green-600"; }
  else if (score === 4) { label = "Strong"; color = "bg-green-500"; }
  else if (score === 3) { label = "Good"; color = "bg-yellow-500"; }
  else if (score === 2) { label = "Weak"; color = "bg-orange-500"; }
  return { checks, score, label, color, isStrong: score >= 3 };
};

interface Props {
  password: string;
  className?: string;
}

const PasswordStrengthMeter = ({ password, className }: Props) => {
  const { checks, score, label, color } = evaluatePassword(password);
  if (!password) return null;
  return (
    <div className={cn("mt-3 space-y-3", className)}>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-muted-foreground">Password strength</span>
          <span className="text-xs font-semibold">{label}</span>
        </div>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i < score ? color : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>
      <ul className="space-y-1">
        {checks.map((c) => (
          <li key={c.label} className="flex items-center gap-2 text-xs">
            {c.passed ? (
              <Check className="h-3.5 w-3.5 text-green-600 shrink-0" />
            ) : (
              <X className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            )}
            <span className={c.passed ? "text-foreground" : "text-muted-foreground"}>{c.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PasswordStrengthMeter;
