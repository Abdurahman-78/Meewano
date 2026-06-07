import { useMemo } from "react";

interface PasswordStrengthProps {
  password: string;
}

type StrengthLevel = 0 | 1 | 2 | 3 | 4;

function getStrength(password: string): { level: StrengthLevel; label: string } {
  if (!password) return { level: 0, label: "" };

  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const labels = ["Weak", "Fair", "Good", "Strong"];
  return { level: score as StrengthLevel, label: labels[score - 1] || "Weak" };
}

const barColors: Record<StrengthLevel, string> = {
  0: "bg-muted",
  1: "bg-destructive",
  2: "bg-orange-400",
  3: "bg-yellow-400",
  4: "bg-green-500",
};

const labelColors: Record<StrengthLevel, string> = {
  0: "text-muted-foreground",
  1: "text-destructive",
  2: "text-orange-400",
  3: "text-yellow-400",
  4: "text-green-500",
};

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const { level, label } = useMemo(() => getStrength(password), [password]);

  if (!password) {
    return (
      <div className="mt-2 space-y-1.5">
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-1.5 flex-1 rounded-full bg-muted transition-colors"
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Use 8+ chars with uppercase, number & symbol
        </p>
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
              i <= level ? barColors[level] : "bg-muted"
            }`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium transition-colors duration-300 ${labelColors[level]}`}>
        {label}
      </p>
    </div>
  );
}
