import { Check } from "lucide-react";

interface Requirement {
  label: string;
  passed: boolean;
}

export const evaluatePasswordRequirements = (pw: string): Requirement[] => [
  { label: "At least 8 characters", passed: pw.length >= 8 },
  { label: "An uppercase letter (A-Z)", passed: /[A-Z]/.test(pw) },
  { label: "A lowercase letter (a-z)", passed: /[a-z]/.test(pw) },
  { label: "A number (0-9)", passed: /\d/.test(pw) },
  { label: "A symbol (!@#$…)", passed: /[^A-Za-z0-9]/.test(pw) },
];

interface Props {
  password: string;
}

export default function PasswordRequirements({ password }: Props) {
  const requirements = evaluatePasswordRequirements(password);
  const allPassed = requirements.every((r) => r.passed);

  if (!password) {
    return (
      <div className="mt-3 space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Password must have:</p>
        <ul className="space-y-2">
          {requirements.map((req, i) => (
            <li key={req.label} className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-muted bg-muted text-muted-foreground text-[10px] font-bold shrink-0">
                {i + 1}
              </div>
              <span className="text-xs text-muted-foreground">{req.label}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">Password must have:</p>
        {allPassed && (
          <span className="text-[10px] font-semibold text-green-600">All requirements met</span>
        )}
      </div>
      <ul className="space-y-2">
        {requirements.map((req) => (
          <li key={req.label} className="flex items-center gap-2.5">
            <div
              className={`flex items-center justify-center w-5 h-5 rounded-full border-2 text-[10px] font-bold shrink-0 transition-colors ${
                req.passed
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted bg-muted text-muted-foreground"
              }`}
            >
              {req.passed ? <Check className="h-3 w-3" /> : null}
            </div>
            <span
              className={`text-xs transition-colors ${
                req.passed ? "text-foreground font-medium" : "text-muted-foreground"
              }`}
            >
              {req.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
