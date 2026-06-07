import { UserRound, CreditCard, CheckCircle } from "lucide-react";

interface Step {
  number: number;
  label: string;
  icon: React.ReactNode;
}

const steps: Step[] = [
  { number: 1, label: "Your Details", icon: <UserRound className="h-4 w-4" /> },
  { number: 2, label: "Payment", icon: <CreditCard className="h-4 w-4" /> },
  { number: 3, label: "Confirmation", icon: <CheckCircle className="h-4 w-4" /> },
];

interface BookingStepIndicatorProps {
  currentStep: number;
}

export default function BookingStepIndicator({ currentStep }: BookingStepIndicatorProps) {
  return (
    <div className="w-full mb-6 md:mb-8">
      <div className="flex items-center justify-between relative">
        {/* Connecting line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-border z-0" />

        {steps.map((step) => {
          const isActive = step.number === currentStep;
          const isCompleted = step.number < currentStep;
          return (
            <div key={step.number} className="relative z-10 flex flex-col items-center gap-2 bg-background px-2">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 font-bold text-sm shadow-sm transition-colors ${
                  isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : isCompleted
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-muted bg-muted text-muted-foreground"
                }`}
              >
                {isCompleted ? <CheckCircle className="h-5 w-5" /> : step.number}
              </div>
              <span className={`text-xs font-semibold whitespace-nowrap hidden sm:block ${isActive ? "text-foreground" : isCompleted ? "text-primary" : "text-muted-foreground"}`}>
                {step.label}
              </span>
              <span className={`text-[10px] font-semibold whitespace-nowrap sm:hidden ${isActive ? "text-foreground" : isCompleted ? "text-primary" : "text-muted-foreground"}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
