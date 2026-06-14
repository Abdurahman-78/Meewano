import { BedDouble, Bath, MapPin, UserPlus, ShieldCheck, CheckCircle } from "lucide-react";

interface Step {
  number: number;
  label: string;
  icon: React.ReactNode;
}

const steps: Step[] = [
  { number: 1, label: "Bedrooms", icon: <BedDouble className="h-4 w-4" /> },
  { number: 2, label: "Bathrooms", icon: <Bath className="h-4 w-4" /> },
  { number: 3, label: "Location", icon: <MapPin className="h-4 w-4" /> },
  { number: 4, label: "Account", icon: <UserPlus className="h-4 w-4" /> },
  { number: 5, label: "Verify", icon: <ShieldCheck className="h-4 w-4" /> },
];

interface HostStepIndicatorProps {
  currentStep: number;
}

export default function HostStepIndicator({ currentStep }: HostStepIndicatorProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative">
        {/* Connecting line */}
        <div className="absolute top-4 md:top-5 left-0 right-0 h-0.5 bg-border z-0" />

        {steps.map((step) => {
          const isActive = step.number === currentStep;
          const isCompleted = step.number < currentStep;
          return (
            <div
              key={step.number}
              className="relative z-10 flex flex-col items-center gap-1 md:gap-2 bg-background px-1 md:px-2"
            >
              <div
                className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full border-2 font-bold text-xs md:text-sm shadow-sm transition-colors ${
                  isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : isCompleted
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-muted bg-muted text-muted-foreground"
                }`}
              >
                {isCompleted ? <CheckCircle className="h-4 w-4 md:h-5 md:w-5" /> : step.number}
              </div>
              <span
                className={`text-[10px] md:text-xs font-semibold whitespace-nowrap ${
                  isActive ? "text-foreground" : isCompleted ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
